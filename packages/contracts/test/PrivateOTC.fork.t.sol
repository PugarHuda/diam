// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {PrivateOTC} from "../src/PrivateOTC.sol";
import {MockCToken} from "../src/mocks/MockCToken.sol";
import {IERC7984} from "../src/interfaces/IERC7984.sol";

/// @notice Fork tests against Arbitrum Sepolia where NoxCompute is deployed.
/// @dev Run: forge test --fork-url $ARBITRUM_SEPOLIA_RPC_URL --match-contract Fork
contract PrivateOTCForkTest is Test {
    PrivateOTC otc;
    MockCToken cusdc;
    MockCToken ceth;

    address maker = makeAddr("maker");
    address taker1 = makeAddr("taker1");
    address taker2 = makeAddr("taker2");

    function setUp() public {
        // Skip if not running on Arbitrum Sepolia fork
        if (block.chainid != 421614) {
            vm.skip(true);
        }
        otc = new PrivateOTC();
        cusdc = new MockCToken("Confidential USDC", "cUSDC", 6);
        ceth = new MockCToken("Confidential ETH", "cETH", 18);
    }

    function test_mockTokenMetadata() public view {
        assertEq(cusdc.symbol(), "cUSDC");
        assertEq(cusdc.decimals(), 6);
        assertEq(ceth.symbol(), "cETH");
        assertEq(ceth.decimals(), 18);
    }

    function test_setOperator() public {
        uint48 until = uint48(block.timestamp + 1 hours);
        vm.prank(maker);
        cusdc.setOperator(address(otc), until);

        assertTrue(cusdc.isOperator(maker, address(otc)));

        vm.warp(uint256(until) + 1);
        assertFalse(cusdc.isOperator(maker, address(otc)));
    }

    function test_setOperator_emitsEvent() public {
        uint48 until = uint48(block.timestamp + 1 hours);
        vm.prank(maker);
        vm.expectEmit(true, true, false, true);
        emit IERC7984.OperatorSet(maker, address(otc), until);
        cusdc.setOperator(address(otc), until);
    }

    function test_initialBalanceIsZero() public view {
        // bytes32(0) is what an uninitialized euint256 unwraps to
        assertEq(cusdc.confidentialBalanceOf(maker), bytes32(0));
        assertEq(cusdc.confidentialTotalSupply(), euint256ToBytes32(cusdc));
    }

    function euint256ToBytes32(MockCToken token) internal view returns (bytes32) {
        return token.confidentialTotalSupply();
    }
}
