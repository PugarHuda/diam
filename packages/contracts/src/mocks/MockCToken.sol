// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Nox, euint256, externalEuint256, ebool} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

import {IERC7984} from "../interfaces/IERC7984.sol";

/// @title MockCToken — Minimal ERC-7984 confidential token for testing
/// @notice Open faucet on testnet. Real productions should add access control.
/// @dev Uses Nox primitives directly (transfer/mint/burn) for encrypted accounting.
contract MockCToken is IERC7984 {
    string public override name;
    string public override symbol;
    uint8 public immutable override decimals;
    string public override contractURI;

    mapping(address => euint256) private _balances;
    euint256 private _totalSupply;
    mapping(address => mapping(address => uint48)) private _operators;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        _totalSupply = Nox.toEuint256(0);
        Nox.allowThis(_totalSupply);
    }

    /// @notice Open faucet — mint encrypted amount to msg.sender. Testnet only.
    function faucet(externalEuint256 amountHandle, bytes calldata amountProof) external {
        euint256 amount = Nox.fromExternal(amountHandle, amountProof);

        (, euint256 newBalance, euint256 newSupply) = Nox.mint(_balances[msg.sender], amount, _totalSupply);

        _balances[msg.sender] = newBalance;
        _totalSupply = newSupply;

        Nox.allowThis(newBalance);
        Nox.allow(newBalance, msg.sender);
        Nox.allowThis(newSupply);
    }

    function confidentialTotalSupply() external view override returns (bytes32) {
        return euint256.unwrap(_totalSupply);
    }

    function confidentialBalanceOf(address account) external view override returns (bytes32) {
        return euint256.unwrap(_balances[account]);
    }

    function isOperator(address holder, address spender) external view override returns (bool) {
        return _operators[holder][spender] > block.timestamp;
    }

    function setOperator(address operator, uint48 until) external override {
        _operators[msg.sender][operator] = until;
        emit OperatorSet(msg.sender, operator, until);
    }

    function confidentialTransfer(address to, bytes32 amount) external override returns (bytes32) {
        return _doTransfer(msg.sender, to, amount);
    }

    function confidentialTransfer(address to, bytes32 amount, bytes calldata)
        external
        override
        returns (bytes32)
    {
        return _doTransfer(msg.sender, to, amount);
    }

    function confidentialTransferFrom(address from, address to, bytes32 amount) external override returns (bytes32) {
        _checkOperator(from);
        return _doTransfer(from, to, amount);
    }

    function confidentialTransferFrom(address from, address to, bytes32 amount, bytes calldata)
        external
        override
        returns (bytes32)
    {
        _checkOperator(from);
        return _doTransfer(from, to, amount);
    }

    function confidentialTransferAndCall(address, bytes32, bytes calldata) external pure override returns (bytes32) {
        revert("MockCToken: callbacks not implemented");
    }

    function confidentialTransferFromAndCall(address, address, bytes32, bytes calldata)
        external
        pure
        override
        returns (bytes32)
    {
        revert("MockCToken: callbacks not implemented");
    }

    function _checkOperator(address from) internal view {
        require(
            from == msg.sender || _operators[from][msg.sender] > block.timestamp, "MockCToken: not operator"
        );
    }

    function _doTransfer(address from, address to, bytes32 amount) internal returns (bytes32) {
        euint256 amt = euint256.wrap(amount);

        (, euint256 newFrom, euint256 newTo) = Nox.transfer(_balances[from], _balances[to], amt);

        _balances[from] = newFrom;
        _balances[to] = newTo;

        Nox.allowThis(newFrom);
        Nox.allow(newFrom, from);
        Nox.allowThis(newTo);
        Nox.allow(newTo, to);

        emit ConfidentialTransfer(from, to, amount);
        return amount;
    }
}
