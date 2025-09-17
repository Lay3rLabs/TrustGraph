// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    uint8 private _decimals;

    constructor(string memory name, string memory symbol, uint8 decimals_, uint256 initialSupply) ERC20(name, symbol) {
        _decimals = decimals_;
        _mint(msg.sender, initialSupply);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract DeployTestToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("FUNDED_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying test token from:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy test token with 10 million supply
        TestToken token = new TestToken("Test Vesting Token", "TVT", 18, 10_000_000 * 10 ** 18);

        vm.stopBroadcast();

        console.log("\n=== Test Token Deployed ===");
        console.log("Token Address:", address(token));
        console.log("Name:", token.name());
        console.log("Symbol:", token.symbol());
        console.log("Decimals:", token.decimals());
        console.log("Total Supply:", token.totalSupply());
        console.log("Deployer Balance:", token.balanceOf(deployer));
        console.log("\nAdd this to your .env file:");
        console.log("VESTING_TOKEN_ADDRESS=", address(token));
    }
}
