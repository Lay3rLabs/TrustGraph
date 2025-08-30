// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {EasAttest} from "script/EasAttest.s.sol";

contract EasAttestTest is Test {
    EasAttest public easAttestScript;

    function setUp() public {
        // Deploy the script
        easAttestScript = new EasAttest();
    }

    function testMilliEthConversion() public pure {
        // Test the conversion math directly
        uint256 milliEth = 1;
        uint256 expectedWei = 1e15;
        uint256 actualWei = milliEth * 1e15;

        assertEq(actualWei, expectedWei, "1 milliether should equal 1e15 wei");

        // Test larger amounts
        milliEth = 10;
        expectedWei = 10e15;
        actualWei = milliEth * 1e15;

        assertEq(actualWei, expectedWei, "10 milliether should equal 10e15 wei");

        // Test fractional amounts
        milliEth = 5;
        expectedWei = 5e15;
        actualWei = milliEth * 1e15;

        assertEq(actualWei, expectedWei, "5 milliether should equal 5e15 wei");
    }

    function testScriptDeployment() public view {
        // Simple test to verify the script deploys correctly
        assertTrue(address(easAttestScript) != address(0), "Script should be deployed");
    }

    function testStringConversions() public view {
        // Test that we can convert addresses and bytes32 to strings (used by the script)
        address testAddr = address(0x1234);
        string memory addrStr = vm.toString(testAddr);
        assertTrue(bytes(addrStr).length > 0, "Address should convert to non-empty string");

        bytes32 testBytes = bytes32(uint256(0x5678));
        string memory bytesStr = vm.toString(testBytes);
        assertTrue(bytes(bytesStr).length > 0, "Bytes32 should convert to non-empty string");
    }
}
