// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {PrivateOTC} from "../src/PrivateOTC.sol";

/// @notice Skeleton tests untuk PrivateOTC
/// @dev TODO: Setup mock Nox library + ERC-7984 mock untuk full coverage.
///      Foundry tidak bisa langsung uji TEE off-chain — perlu fork test
///      ke Arbitrum Sepolia atau pakai mock Nox library.
contract PrivateOTCTest is Test {
    PrivateOTC otc;

    address maker = makeAddr("maker");
    address taker1 = makeAddr("taker1");
    address taker2 = makeAddr("taker2");

    function setUp() public {
        otc = new PrivateOTC();
    }

    function test_initialState() public view {
        assertEq(otc.nextIntentId(), 0);
        assertEq(otc.MAX_BIDS_PER_RFQ(), 10);
    }

    // TODO: Test createIntent dengan mock externalEuint256 + proof
    // TODO: Test acceptIntent flow
    // TODO: Test cancelIntent only by maker
    // TODO: Test createRFQ + submitBid + finalizeRFQ
    // TODO: Test MAX_BIDS_PER_RFQ enforcement
    // TODO: Test deadline enforcement (warp)
    // TODO: Fuzz test bid count 2-10
    // TODO: Fork test on Arbitrum Sepolia for real Nox integration
}
