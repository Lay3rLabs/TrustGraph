// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/// @title DAICOVault
/// @notice Vault token for DAICO participation with built-in governance capabilities
/// @dev ERC20Votes token that represents a user's contribution to the DAICO
///      Can be redeemed for unvested ETH or exchanged for vested project tokens
contract DAICOVault is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes {
    /// @notice The DAICO contract that can mint and burn tokens
    address public immutable DAICO;

    /// @notice Only the DAICO contract can call this function
    error OnlyDAICO();

    /// @notice Requires caller to be the DAICO contract
    modifier onlyDAICO() {
        if (msg.sender != DAICO) revert OnlyDAICO();
        _;
    }

    /// @notice Initialize the vault token
    /// @param _daico The DAICO contract address
    /// @param _name Token name (e.g., "DAICO Vault Token")
    /// @param _symbol Token symbol (e.g., "vDAICO")
    constructor(address _daico, string memory _name, string memory _symbol) ERC20(_name, _symbol) ERC20Permit(_name) {
        DAICO = _daico;
    }

    /// @notice Mint vault tokens to a contributor
    /// @param to The recipient address
    /// @param amount The amount of tokens to mint
    /// @dev Only callable by the DAICO contract
    function mint(address to, uint256 amount) external onlyDAICO {
        _mint(to, amount);
    }

    /// @notice Burn vault tokens from a user
    /// @param from The address to burn from
    /// @param amount The amount of tokens to burn
    /// @dev Only callable by the DAICO contract
    function burnFrom(address from, uint256 amount) public override onlyDAICO {
        _burn(from, amount);
    }

    // ============ OVERRIDES ============

    /// @notice Override _update for ERC20Votes functionality
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    /// @notice Override nonces for ERC20Permit functionality
    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }

    function daico() public view returns (address) {
        return DAICO;
    }
}
