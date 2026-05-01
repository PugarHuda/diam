// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {DiamReceipt} from "../src/DiamReceipt.sol";

/// @notice Standalone deploy for DiamReceipt — keeps the existing
/// PrivateOTC + cToken deployment untouched.
contract DeployReceipt is Script {
    function run() external returns (DiamReceipt receipt) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        receipt = new DiamReceipt();
        vm.stopBroadcast();

        console.log("DiamReceipt :", address(receipt));
        console.log("");
        console.log("Add to .env:");
        console.log("  NEXT_PUBLIC_DIAM_RECEIPT_ADDRESS=", address(receipt));
    }
}
