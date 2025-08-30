// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Votes} from "@openzeppelin/contracts/governance/utils/Votes.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";
import {ITypes} from "../../interfaces/ITypes.sol";

/**
 * @title VotingPower
 * @dev A custom voting token contract that implements IVotes interface for governance.
 * This contract manages voting power distribution and delegation for the AttestationGovernor.
 */
contract VotingPower is Votes, Ownable, IWavsServiceHandler {
    /// @dev Operation types for voting power management
    enum OperationType {
        MINT, // 0 - Mint tokens to accounts
        BURN, // 1 - Burn tokens from accounts
        TRANSFER, // 2 - Transfer tokens between accounts
        DELEGATE, // 3 - Delegate voting power
        SET // 4 - Set voting power to a specific amount

    }

    /// @dev Single voting power operation
    struct Operation {
        OperationType operationType; // The operation to perform
        address account; // The primary account
        address target; // The target account (for transfers/delegation, zero address if not used)
        uint256 amount; // The amount (zero if not applicable for delegation)
    }

    /// @dev Main payload structure for WAVS envelope
    struct VotingPowerPayload {
        Operation[] operations; // Array of operations to execute
    }

    // The WAVS service manager instance
    IWavsServiceManager private immutable _serviceManager;

    // Mapping from account to their voting power balance
    mapping(address => uint256) private _balances;

    // Total supply of voting tokens
    uint256 private _totalSupply;

    // Token metadata
    string public name;
    string public symbol;
    uint8 public decimals;

    /**
     * @dev Emitted when voting tokens are minted
     */
    event TokensMinted(address indexed to, uint256 amount);

    /**
     * @dev Emitted when voting tokens are burned
     */
    event TokensBurned(address indexed from, uint256 amount);

    /**
     * @dev Emitted when a WAVS operation is executed
     */
    event WAVSOperationExecuted(OperationType indexed operationType, uint256 totalAccounts, uint256 totalAmount);

    /**
     * @dev Constructor sets the token metadata and initializes EIP712 for delegation signatures
     * @param _name The name of the voting token
     * @param _symbol The symbol of the voting token
     * @param _initialOwner The initial owner who can mint/burn tokens
     */
    constructor(string memory _name, string memory _symbol, address _initialOwner, IWavsServiceManager serviceManager)
        EIP712(_name, "1")
        Ownable(_initialOwner)
    {
        require(address(serviceManager) != address(0), "VotingPower: invalid service manager");
        _serviceManager = serviceManager;
        name = _name;
        symbol = _symbol;
        decimals = 18;
    }

    /**
     * @dev Returns the balance of voting tokens for an account
     * @param account The account to query
     * @return The voting token balance
     */
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev Returns the total supply of voting tokens
     * @return The total supply
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev Internal function to mint new voting tokens to an account
     * @param to The account to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "VotingPower: mint to zero address");
        require(amount > 0, "VotingPower: mint zero amount");

        _balances[to] += amount;
        _totalSupply += amount;

        // Transfer voting units to update delegation checkpoints
        _transferVotingUnits(address(0), to, amount);

        // Auto-delegate to self if not already delegated
        if (delegates(to) == address(0)) {
            _delegate(to, to);
        }

        emit TokensMinted(to, amount);
    }

    /**
     * @dev Mint new voting tokens to an account
     * @param to The account to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burn voting tokens from an account
     * @param from The account to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burn(address from, uint256 amount) external onlyOwner {
        require(from != address(0), "VotingPower: burn from zero address");
        require(_balances[from] >= amount, "VotingPower: burn amount exceeds balance");

        _balances[from] -= amount;
        _totalSupply -= amount;

        // Transfer voting units to update delegation checkpoints
        _transferVotingUnits(from, address(0), amount);

        emit TokensBurned(from, amount);
    }

    /**
     * @dev Transfer voting tokens between accounts
     * @param from The account to transfer from
     * @param to The account to transfer to
     * @param amount The amount to transfer
     */
    function transfer(address from, address to, uint256 amount) external {
        require(from != address(0), "VotingPower: transfer from zero address");
        require(to != address(0), "VotingPower: transfer to zero address");
        require(_balances[from] >= amount, "VotingPower: transfer amount exceeds balance");

        // TODO: Add proper authorization check (msg.sender == from or approved)
        // For now, allowing any transfer for simplicity

        _balances[from] -= amount;
        _balances[to] += amount;

        // Transfer voting units to update delegation checkpoints
        _transferVotingUnits(from, to, amount);
    }

    /**
     * @dev Returns the current voting units for an account (implements abstract function from Votes)
     * @param account The account to query
     * @return The current voting units
     */
    function _getVotingUnits(address account) internal view override returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev Returns the current timepoint for voting calculations
     * Uses block number as the timepoint
     * @return The current block number
     */
    function clock() public view override returns (uint48) {
        return uint48(block.number);
    }

    /**
     * @dev Returns the clock mode description
     * @return The clock mode string
     */
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=blocknumber&from=default";
    }

    /**
     * @dev Batch mint tokens to multiple accounts
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to mint to each recipient
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "VotingPower: arrays length mismatch");

        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }

    /**
     * @dev Set up initial distribution of voting tokens
     * @param initialHolders Array of initial token holders
     * @param initialAmounts Array of initial amounts for each holder
     */
    function initialDistribution(address[] calldata initialHolders, uint256[] calldata initialAmounts)
        external
        onlyOwner
    {
        require(initialHolders.length == initialAmounts.length, "VotingPower: arrays length mismatch");
        require(_totalSupply == 0, "VotingPower: initial distribution already completed");

        for (uint256 i = 0; i < initialHolders.length; i++) {
            _mint(initialHolders[i], initialAmounts[i]);
        }
    }

    /**
     * @dev Emergency function to pause/unpause token operations
     * TODO: Implement pausing mechanism if needed
     */
    function pause() external onlyOwner {
        // TODO: Implement pause functionality
        // This could prevent transfers, minting, burning during emergencies
    }

    /**
     * @dev Get voting power statistics for an account
     * @param account The account to query
     * @return balance Current token balance
     * @return votes Current voting power (after delegation)
     * @return delegatedTo Address that votes are delegated to
     */
    function getVotingStats(address account)
        external
        view
        returns (uint256 balance, uint256 votes, address delegatedTo)
    {
        balance = _balances[account];
        votes = getVotes(account);
        delegatedTo = delegates(account);
    }

    /// @inheritdoc IWavsServiceHandler
    /// @notice Handles signed envelope from WAVS for voting power operations
    /// @param envelope The envelope containing the voting power operation data
    /// @param signatureData The signature data for validation
    function handleSignedEnvelope(Envelope calldata envelope, SignatureData calldata signatureData) external {
        // Validate the envelope signature through the service manager
        _serviceManager.validate(envelope, signatureData);

        // Decode the payload
        VotingPowerPayload memory payload = abi.decode(envelope.payload, (VotingPowerPayload));

        // Execute the operation
        _executeOperation(payload);
    }

    /// @dev Execute voting power operations
    /// @param payload The operation payload to execute
    function _executeOperation(VotingPowerPayload memory payload) internal {
        uint256 totalAmount = 0;
        uint256 totalOperations = payload.operations.length;

        unchecked {
            for (uint256 i = 0; i < totalOperations; ++i) {
                Operation memory op = payload.operations[i];

                if (op.operationType == OperationType.MINT) {
                    _mint(op.account, op.amount);
                    totalAmount += op.amount;
                } else if (op.operationType == OperationType.BURN) {
                    _burn(op.account, op.amount);
                    totalAmount += op.amount;
                } else if (op.operationType == OperationType.TRANSFER) {
                    _transfer(op.account, op.target, op.amount);
                    totalAmount += op.amount;
                } else if (op.operationType == OperationType.DELEGATE) {
                    _delegate(op.account, op.target);
                } else if (op.operationType == OperationType.SET) {
                    _set(op.account, op.amount);
                    totalAmount += op.amount;
                }
            }
        }

        emit WAVSOperationExecuted(
            payload.operations.length > 0 ? payload.operations[0].operationType : OperationType.MINT,
            totalOperations,
            totalAmount
        );
    }

    /// @dev Internal burn function (used by WAVS operations)
    /// @param from The account to burn tokens from
    /// @param amount The amount of tokens to burn
    function _burn(address from, uint256 amount) internal {
        require(from != address(0), "VotingPower: burn from zero address");
        require(_balances[from] >= amount, "VotingPower: burn amount exceeds balance");

        _balances[from] -= amount;
        _totalSupply -= amount;

        // Transfer voting units to update delegation checkpoints
        _transferVotingUnits(from, address(0), amount);

        emit TokensBurned(from, amount);
    }

    /// @dev Internal transfer function (used by WAVS operations)
    /// @param from The account to transfer from
    /// @param to The account to transfer to
    /// @param amount The amount to transfer
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "VotingPower: transfer from zero address");
        require(to != address(0), "VotingPower: transfer to zero address");
        require(_balances[from] >= amount, "VotingPower: transfer amount exceeds balance");

        _balances[from] -= amount;
        _balances[to] += amount;

        // Transfer voting units to update delegation checkpoints
        _transferVotingUnits(from, to, amount);
    }

    /// @dev Internal set function (used by WAVS operations)
    /// @param account The account to set voting power for
    /// @param amount The amount to set as the new voting power
    function _set(address account, uint256 amount) internal {
        require(account != address(0), "VotingPower: set for zero address");

        uint256 currentBalance = _balances[account];

        if (amount > currentBalance) {
            // Need to mint the difference
            uint256 difference = amount - currentBalance;
            _balances[account] = amount;
            _totalSupply += difference;
            _transferVotingUnits(address(0), account, difference);

            // Auto-delegate to self if not already delegated
            if (delegates(account) == address(0)) {
                _delegate(account, account);
            }
        } else if (amount < currentBalance) {
            // Need to burn the difference
            uint256 difference = currentBalance - amount;
            _balances[account] = amount;
            _totalSupply -= difference;
            _transferVotingUnits(account, address(0), difference);
        }
        // If amount == currentBalance, no change needed
    }

    /**
     * @notice Get the service manager address
     * @return address The address of the service manager
     */
    function getServiceManager() external view returns (address) {
        return address(_serviceManager);
    }
}
