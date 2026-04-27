// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {PrivateOTC} from "../src/PrivateOTC.sol";
import {IERC7984} from "../src/interfaces/IERC7984.sol";

/// @notice Local-only PrivateOTC tests (no Nox dependency)
/// @dev MockCToken + Nox-using flows live in PrivateOTC.fork.t.sol — those
///      need `--fork-url $ARBITRUM_SEPOLIA_RPC_URL` since NoxCompute proxy
///      only exists on chains 421614/42161/31337-with-deploy.
contract PrivateOTCTest is Test {
    PrivateOTC otc;

    address maker = makeAddr("maker");
    address taker1 = makeAddr("taker1");

    function setUp() public {
        otc = new PrivateOTC();
    }

    function test_initialState() public view {
        assertEq(otc.nextIntentId(), 0);
        assertEq(otc.MAX_BIDS_PER_RFQ(), 10);
    }

    function test_cancelIntent_revertsIfNotMaker() public {
        vm.prank(taker1);
        vm.expectRevert(PrivateOTC.NotMaker.selector);
        otc.cancelIntent(0);
    }

    function test_finalizeRFQ_revertsIfNotOpen() public {
        // intent[0] doesn't exist → status defaults to Open(0), but mode is Direct(0)
        vm.expectRevert(PrivateOTC.IntentNotOpen.selector);
        otc.finalizeRFQ(0);
    }
}
