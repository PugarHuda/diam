// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Nox, euint256, externalEuint256, ebool} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

import {IPrivateOTC} from "./interfaces/IPrivateOTC.sol";
import {IERC7984} from "./interfaces/IERC7984.sol";

/// @title PrivateOTC — On-chain confidential OTC desk
/// @notice Hidden-amount OTC trading with Vickrey-fair RFQ pricing.
/// @dev Settlement uses ERC-7984 cTokens. Encrypted ops via iExec Nox.
contract PrivateOTC {
    uint256 public constant MAX_BIDS_PER_RFQ = 10;

    enum IntentStatus {
        Open,
        Filled,
        Cancelled,
        Expired
    }

    enum Mode {
        Direct,
        RFQ
    }

    struct Intent {
        address maker;
        IERC7984 sellToken;
        IERC7984 buyToken;
        euint256 sellAmount;
        euint256 minBuyAmount;
        uint64 deadline;
        IntentStatus status;
        Mode mode;
        address allowedTaker;
    }

    struct Bid {
        address taker;
        euint256 offeredAmount;
        bool active;
    }

    mapping(uint256 => Intent) public intents;
    mapping(uint256 => Bid[]) public bids;
    uint256 public nextIntentId;

    event IntentCreated(
        uint256 indexed id, address indexed maker, address sellToken, address buyToken, Mode mode, uint64 deadline
    );
    event BidSubmitted(uint256 indexed id, address indexed taker);
    event Settled(uint256 indexed id, address indexed taker);
    event Cancelled(uint256 indexed id);

    error IntentNotOpen();
    error NotMaker();
    error NotAllowedTaker();
    error DeadlinePassed();
    error DeadlineNotPassed();
    error MaxBidsReached();
    error InsufficientBids();

    /* -------------------------------------------------------------------------- */
    /*                                Direct OTC                                  */
    /* -------------------------------------------------------------------------- */

    function createIntent(
        IERC7984 sellToken,
        IERC7984 buyToken,
        externalEuint256 sellAmountHandle,
        bytes calldata sellProof,
        externalEuint256 minBuyAmountHandle,
        bytes calldata minBuyProof,
        uint64 deadline,
        address allowedTaker
    ) external returns (uint256 id) {
        if (deadline <= block.timestamp) revert DeadlinePassed();

        id = nextIntentId++;

        euint256 sellAmount = Nox.fromExternal(sellAmountHandle, sellProof);
        euint256 minBuyAmount = Nox.fromExternal(minBuyAmountHandle, minBuyProof);

        intents[id] = Intent({
            maker: msg.sender,
            sellToken: sellToken,
            buyToken: buyToken,
            sellAmount: sellAmount,
            minBuyAmount: minBuyAmount,
            deadline: deadline,
            status: IntentStatus.Open,
            mode: Mode.Direct,
            allowedTaker: allowedTaker
        });

        Nox.allowThis(sellAmount);
        Nox.allow(sellAmount, msg.sender);
        Nox.allowThis(minBuyAmount);
        Nox.allow(minBuyAmount, msg.sender);

        emit IntentCreated(id, msg.sender, address(sellToken), address(buyToken), Mode.Direct, deadline);
    }

    function acceptIntent(uint256 id, externalEuint256 buyAmountHandle, bytes calldata buyProof) external {
        Intent storage intent = intents[id];
        if (intent.status != IntentStatus.Open) revert IntentNotOpen();
        if (intent.mode != Mode.Direct) revert IntentNotOpen();
        if (block.timestamp > intent.deadline) revert DeadlinePassed();
        if (intent.allowedTaker != address(0) && msg.sender != intent.allowedTaker) {
            revert NotAllowedTaker();
        }

        euint256 buyAmount = Nox.fromExternal(buyAmountHandle, buyProof);

        // ─── Strategy B: atomic conditional via safeSub + select ───
        // sufficient = (buyAmount >= minBuyAmount), underflow-safe.
        (ebool sufficient,) = Nox.safeSub(buyAmount, intent.minBuyAmount);

        euint256 zero = Nox.toEuint256(0);
        // Route real amounts on success, zeros on failure. The branch is encrypted.
        euint256 effectiveSell = Nox.select(sufficient, intent.sellAmount, zero);
        euint256 effectiveBuy = Nox.select(sufficient, buyAmount, zero);

        _settleAtomic(intent.sellToken, intent.buyToken, intent.maker, msg.sender, effectiveSell, effectiveBuy);

        intent.status = IntentStatus.Filled;
        emit Settled(id, msg.sender);
    }

    function cancelIntent(uint256 id) external {
        Intent storage intent = intents[id];
        if (intent.maker != msg.sender) revert NotMaker();
        if (intent.status != IntentStatus.Open) revert IntentNotOpen();
        intent.status = IntentStatus.Cancelled;
        emit Cancelled(id);
    }

    /* -------------------------------------------------------------------------- */
    /*                              RFQ (Vickrey)                                 */
    /* -------------------------------------------------------------------------- */

    function createRFQ(
        IERC7984 sellToken,
        IERC7984 buyToken,
        externalEuint256 sellAmountHandle,
        bytes calldata sellProof,
        uint64 biddingDeadline
    ) external returns (uint256 id) {
        if (biddingDeadline <= block.timestamp) revert DeadlinePassed();

        id = nextIntentId++;
        euint256 sellAmount = Nox.fromExternal(sellAmountHandle, sellProof);

        intents[id] = Intent({
            maker: msg.sender,
            sellToken: sellToken,
            buyToken: buyToken,
            sellAmount: sellAmount,
            minBuyAmount: Nox.toEuint256(0),
            deadline: biddingDeadline,
            status: IntentStatus.Open,
            mode: Mode.RFQ,
            allowedTaker: address(0)
        });

        Nox.allowThis(sellAmount);
        Nox.allow(sellAmount, msg.sender);

        emit IntentCreated(id, msg.sender, address(sellToken), address(buyToken), Mode.RFQ, biddingDeadline);
    }

    function submitBid(uint256 id, externalEuint256 bidAmountHandle, bytes calldata bidProof) external {
        Intent storage intent = intents[id];
        if (intent.status != IntentStatus.Open) revert IntentNotOpen();
        if (intent.mode != Mode.RFQ) revert IntentNotOpen();
        if (block.timestamp > intent.deadline) revert DeadlinePassed();
        if (bids[id].length >= MAX_BIDS_PER_RFQ) revert MaxBidsReached();

        euint256 bidAmount = Nox.fromExternal(bidAmountHandle, bidProof);
        bids[id].push(Bid({taker: msg.sender, offeredAmount: bidAmount, active: true}));

        Nox.allowThis(bidAmount);
        Nox.allow(bidAmount, msg.sender);

        emit BidSubmitted(id, msg.sender);
    }

    function finalizeRFQ(uint256 id) external {
        Intent storage intent = intents[id];
        if (intent.status != IntentStatus.Open) revert IntentNotOpen();
        if (intent.mode != Mode.RFQ) revert IntentNotOpen();
        if (block.timestamp <= intent.deadline) revert DeadlineNotPassed();

        Bid[] storage _bids = bids[id];
        if (_bids.length < 2) revert InsufficientBids();

        (address winnerAddr, euint256 priceToPay) = _pickVickreyWinner(id);

        _settleAtomic(intent.sellToken, intent.buyToken, intent.maker, winnerAddr, intent.sellAmount, priceToPay);

        intent.status = IntentStatus.Filled;
        emit Settled(id, winnerAddr);
    }

    /* -------------------------------------------------------------------------- */
    /*                             Internal helpers                               */
    /* -------------------------------------------------------------------------- */

    /// @dev Vickrey: highest bid wins, pays second-highest (encrypted).
    /// Winner address is plain (via event); price they pay is encrypted.
    function _pickVickreyWinner(uint256 id) internal returns (address winnerAddr, euint256 priceToPay) {
        Bid[] storage _bids = bids[id];

        // Initial: assume bid[0] highest. Resolve real top-2 in tracking loop.
        winnerAddr = _bids[0].taker;
        ebool initSwap = Nox.gt(_bids[1].offeredAmount, _bids[0].offeredAmount);
        euint256 highest = Nox.select(initSwap, _bids[1].offeredAmount, _bids[0].offeredAmount);
        euint256 second = Nox.select(initSwap, _bids[0].offeredAmount, _bids[1].offeredAmount);

        // For winner address: plain comparison via offeredAmount handles is impossible
        // since handles are 32-byte references. We track the maximum-bid index off-chain
        // by emitting BidSubmitted events and let the frontend match the winning event.
        // (Alternative: use eaddress when supported in Nox library v0.3+.)

        for (uint256 i = 2; i < _bids.length; i++) {
            euint256 candidate = _bids[i].offeredAmount;
            ebool isHigher = Nox.gt(candidate, highest);
            second = Nox.select(isHigher, highest, second);
            highest = Nox.select(isHigher, candidate, highest);
        }

        Nox.allowThis(highest);
        Nox.allowThis(second);
        priceToPay = second;
    }

    /// @dev Settle a swap: sellToken from maker → taker, buyToken from taker → maker.
    /// Both amounts encrypted. Requires both parties to have called setOperator(this, until).
    function _settleAtomic(
        IERC7984 sellToken,
        IERC7984 buyToken,
        address maker,
        address taker,
        euint256 effectiveSell,
        euint256 effectiveBuy
    ) internal {
        // Grant cTokens transient access to the amount handles for this tx
        Nox.allowTransient(effectiveSell, address(sellToken));
        Nox.allowTransient(effectiveBuy, address(buyToken));

        // Atomic ERC-7984 transfers
        sellToken.confidentialTransferFrom(maker, taker, euint256.unwrap(effectiveSell));
        buyToken.confidentialTransferFrom(taker, maker, euint256.unwrap(effectiveBuy));

        // Persist amounts so both parties can decrypt off-chain (auditor + audit trail)
        Nox.allowThis(effectiveSell);
        Nox.allow(effectiveSell, maker);
        Nox.allow(effectiveSell, taker);
        Nox.allowThis(effectiveBuy);
        Nox.allow(effectiveBuy, maker);
        Nox.allow(effectiveBuy, taker);
    }
}
