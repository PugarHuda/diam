// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {PrivateOTC} from "../src/PrivateOTC.sol";

/// @notice Deploy PrivateOTC ke Arbitrum Sepolia
/// @dev Run: forge script script/Deploy.s.sol --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --broadcast --verify
contract Deploy is Script {
    function run() external returns (PrivateOTC otc) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        otc = new PrivateOTC();

        vm.stopBroadcast();

        console.log("PrivateOTC deployed at:", address(otc));
        console.log("Add to .env:");
        console.log("  NEXT_PUBLIC_PRIVATE_OTC_ADDRESS=", address(otc));
    }
}
