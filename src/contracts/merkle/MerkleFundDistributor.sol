// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {
    MerkleProof
} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {
    SafeERC20,
    IERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IMerkleSnapshot} from "interfaces/merkle/IMerkleSnapshot.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

interface IMerkleFundDistributor {
    /// @notice A distribution state.
    struct DistributionState {
        /// @notice The block number of the distribution creation.
        uint256 blockNumber;
        /// @notice The timestamp of the distribution creation.
        uint256 timestamp;
        /// @notice The merkle root of this distribution.
        bytes32 root;
        /// @notice The ipfs hash containing metadata about the root (e.g. the merkle tree itself).
        bytes32 ipfsHash;
        /// @notice The ipfs hash CID containing metadata about the root (e.g. the merkle tree itself).
        string ipfsHashCid;
        /// @notice The total value of the merkle tree.
        uint256 totalMerkleValue;
        /// @notice The distributor address.
        address distributor;
        /// @notice The token to distribute (0 for native token, otherwise an ERC20 token address).
        address token;
        /// @notice The total amount of the token funded.
        uint256 amountFunded;
        /// @notice The amount of the token distributed so far (excluding fee).
        uint256 amountDistributed;
        /// @notice The fee recipient address.
        address feeRecipient;
        /// @notice The amount of the token retained as a fee.
        uint256 feeAmount;
    }

    /// @notice Emitted when owner starts 2-step ownership transfer to `pendingOwner`.
    /// @param pendingOwner The pending owner of the contract.
    event OwnershipTransferStarted(address indexed pendingOwner);

    /// @notice Emitted when the owner of the contract is set.
    /// @param previousOwner The previous owner of the contract.
    /// @param newOwner The new owner of the contract.
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /// @notice Emitted when the fee recipient is set.
    /// @param previousFeeRecipient The previous fee recipient address.
    /// @param newFeeRecipient The new fee recipient address.
    event FeeRecipientSet(
        address indexed previousFeeRecipient,
        address indexed newFeeRecipient
    );

    /// @notice Emitted when the fee percentage is set.
    /// @param previousFeePercentage The previous fee percentage.
    /// @param newFeePercentage The new fee percentage.
    event FeePercentageSet(
        uint256 indexed previousFeePercentage,
        uint256 indexed newFeePercentage
    );

    /// @notice Emitted when the merkle snapshot contract is updated.
    /// @param previousContract The previous merkle snapshot contract address.
    /// @param newContract The new merkle snapshot contract address.
    event MerkleSnapshotUpdated(
        address indexed previousContract,
        address indexed newContract
    );

    /// @notice Emitted when a distributor's ability to distribute funds is updated.
    /// @param distributor The distributor address.
    /// @param canDistribute The distributor's ability to distribute funds.
    event DistributorAllowanceUpdated(
        address indexed distributor,
        bool indexed canDistribute
    );

    /// @notice Emitted when the distributor allowlist is enabled/disabled.
    /// @param enabled The distributor's allowlist status.
    event DistributorAllowlistUpdated(bool indexed enabled);

    /// @notice Emitted when funds are distributed.
    /// @param distributionIndex The index of the distribution.
    /// @param distributor The distributor address.
    /// @param token The token distributed.
    /// @param amountFunded The amount of token funded.
    /// @param feeAmount The amount of token retained as a fee.
    event Distributed(
        uint256 indexed distributionIndex,
        address indexed distributor,
        address indexed token,
        uint256 amountFunded,
        uint256 feeAmount
    );

    /// @notice Emitted when tokens are claimed.
    /// @param distributionIndex The index of the distribution.
    /// @param account The address that claimed the tokens.
    /// @param token The token claimed.
    /// @param amount The amount of token claimed.
    /// @param value The merkle tree value.
    event Claimed(
        uint256 indexed distributionIndex,
        address indexed account,
        address indexed token,
        uint256 amount,
        uint256 value
    );

    error NotOwner();
    error NotPendingOwner();
    error InvalidAddress();
    error CannotDistribute();
    error InvalidNativeTokenTransfer();
    error InvalidNativeTokenTransferAmount();
    error AlreadyClaimed();
    error FailedToTransferFee(bytes data);
    error FailedToTransferTokens(bytes data);
    error InvalidMerkleState();
    error DistributionNotFound();
    error InvalidMerkleProof();
    error NoFundsToClaim();
    error FeePercentageTooHigh();
    error UnexpectedMerkleRoot(bytes32 expected, bytes32 actual);
}

/// @title MerkleFundDistributor
/// @notice A contract for distributing funds from a merkle tree.
/// @dev TODO: allow distributor to refund unclaimed funds? after expiration? to retrieve dust/rounding losses?
/// @dev TODO: restrict claim function to sender-only (instead of anyone)?
contract MerkleFundDistributor is
    IMerkleFundDistributor,
    ReentrancyGuard,
    Pausable
{
    using SafeERC20 for IERC20;

    /* CONSTANTS */

    /// @notice The range of the fee percentage.
    /// @dev 1e18 = 100%
    /// @dev 1e17 = 10%
    /// @dev 1e16 = 1%
    /// @dev 1e15 = 0.1%
    uint64 public constant FEE_RANGE = 1e18;

    /* STORAGE */

    /// @notice The address that can update the distribution parameters.
    address public owner;

    /// @notice The pending owner address (for 2-step ownership transfer).
    address public pendingOwner;

    /// @notice The fee recipient address.
    address public feeRecipient;

    /// @notice Address of the MerkleSnapshot contract to query for merkle state
    address public merkleSnapshot;

    /// @notice The fee percentage taken from the distributed amount.
    uint256 public feePercentage;

    /// @notice Whether the distributor allowlist is enabled.
    bool public distributorAllowlistEnabled;

    /// @notice The addresses allowed to distribute funds (if allowlist is enabled).
    mapping(address distributor => bool canDistribute) public canDistribute;

    /// @notice The distributions.
    DistributionState[] public distributions;

    /// @notice The `amount` claimed by `account` for a given distribution.
    mapping(uint256 distributionIndex => mapping(address account => uint256 amount))
        public claimed;

    /* MODIFIERS */

    /// @notice Reverts if the caller is not the owner.
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }

    /// @notice Reverts if the caller cannot distribute funds.
    modifier onlyDistributor() {
        if (distributorAllowlistEnabled && !canDistribute[msg.sender]) {
            revert CannotDistribute();
        }
        _;
    }

    /* CONSTRUCTOR */

    /**
     * @notice Initialize the contract
     * @param owner_ The owner of the contract
     * @param merkleSnapshot_ The MerkleSnapshot contract address
     * @param feeRecipient_ The fee recipient address
     * @param feePercentage_ The fee percentage taken from the distributed amount
     * @param distributorAllowlistEnabled_ Whether the distributor allowlist is enabled.
     */
    constructor(
        address owner_,
        address merkleSnapshot_,
        address feeRecipient_,
        uint256 feePercentage_,
        bool distributorAllowlistEnabled_
    ) {
        // Initialize owner to the deployer.
        owner = msg.sender;
        // If initial owner differs from the deployer, start 2-step ownership transfer.
        if (owner_ != msg.sender) {
            _transferOwnership(owner_);
        }

        _setMerkleSnapshot(merkleSnapshot_);
        _setFeeRecipient(feeRecipient_);
        _setFeePercentage(feePercentage_);
        _setDistributorAllowlistEnabled(distributorAllowlistEnabled_);
    }

    /* VIEW */

    /// @notice Gets paginated distributions.
    /// @param offset The offset to start from.
    /// @param limit The number of distributions to return.
    /// @return result The distributions.
    function getDistributions(
        uint256 offset,
        uint256 limit
    ) external view returns (DistributionState[] memory) {
        if (offset >= distributions.length) {
            return new DistributionState[](0);
        }

        uint256 end = offset + limit;
        if (end > distributions.length) {
            end = distributions.length;
        }

        DistributionState[] memory result = new DistributionState[](
            end - offset
        );
        for (uint256 i = offset; i < end; ) {
            result[i - offset] = distributions[i];
            unchecked {
                ++i;
            }
        }

        return result;
    }

    /// @notice Returns the total number of distributions.
    /// @return total The total number of distributions.
    function getDistributionCount() external view returns (uint256 total) {
        return distributions.length;
    }

    /* EXTERNAL */

    /// @notice Starts 2-step ownership transfer to `newOwner`.
    /// @param newOwner The new owner of the contract.
    function transferOwnership(address newOwner) external onlyOwner {
        _transferOwnership(newOwner);
    }

    /// @notice Accepts the ownership transfer.
    /// @dev Only the pending owner can accept the ownership transfer.
    function acceptOwnership() external {
        if (msg.sender != pendingOwner) {
            revert NotPendingOwner();
        }
        address previousOwner = owner;
        owner = msg.sender;
        pendingOwner = address(0);
        emit OwnershipTransferred(previousOwner, owner);
    }

    /// @notice Sets the `feeRecipient` of the contract to `newFeeRecipient`.
    /// @param newFeeRecipient The new fee recipient address.
    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        _setFeeRecipient(newFeeRecipient);
    }

    /// @notice Sets the `feePercentage` of the contract to `newFeePercentage`.
    /// @param newFeePercentage The new fee percentage.
    function setFeePercentage(uint256 newFeePercentage) external onlyOwner {
        _setFeePercentage(newFeePercentage);
    }

    /// @notice Sets the `merkleSnapshot` of the contract to `newMerkleSnapshot`.
    /// @param newMerkleSnapshot The new merkle snapshot contract address.
    function setMerkleSnapshot(address newMerkleSnapshot) external onlyOwner {
        _setMerkleSnapshot(newMerkleSnapshot);
    }

    /// @notice Sets the `distributorAllowlistEnabled` of the contract to `distributorAllowlistEnabled_`.
    /// @param distributorAllowlistEnabled_ Whether the distributor allowlist is enabled.
    function setDistributorAllowlistEnabled(
        bool distributorAllowlistEnabled_
    ) external onlyOwner {
        _setDistributorAllowlistEnabled(distributorAllowlistEnabled_);
    }

    /// @notice Updates a distributor's ability to distribute funds.
    /// @param distributor The distributor address.
    /// @param canDistribute_ The distributor's ability to distribute funds.
    function updateDistributorAllowance(
        address distributor,
        bool canDistribute_
    ) external onlyOwner {
        _setCanDistribute(distributor, canDistribute_);
    }

    /// @notice Pauses the contract.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpauses the contract.
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Distributes funds.
    /// @param token The token to distribute.
    /// @param amount The amount of token to distribute.
    /// @param expectedRoot The expected root of the merkle tree to add an additional layer of security (pass 0 to skip).
    /// @dev Only distributors can distribute funds.
    /// @return distributionIndex The index of the distribution.
    function distribute(
        address token,
        uint256 amount,
        bytes32 expectedRoot
    )
        external
        payable
        onlyDistributor
        nonReentrant
        whenNotPaused
        returns (uint256 distributionIndex)
    {
        // Fetch the latest merkle state.
        IMerkleSnapshot.MerkleState memory merkleState = IMerkleSnapshot(
            merkleSnapshot
        ).getLatestState();

        if (merkleState.root == bytes32(0) || merkleState.totalValue == 0) {
            revert InvalidMerkleState();
        }

        if (expectedRoot != bytes32(0) && merkleState.root != expectedRoot) {
            revert UnexpectedMerkleRoot(expectedRoot, merkleState.root);
        }

        // Calculate the fee amount.
        uint256 feeAmount = Math.mulDiv(amount, feePercentage, FEE_RANGE);

        // Create new distribution.
        distributionIndex = distributions.length;
        distributions.push(
            DistributionState({
                blockNumber: block.number,
                timestamp: block.timestamp,
                root: merkleState.root,
                ipfsHash: merkleState.ipfsHash,
                ipfsHashCid: merkleState.ipfsHashCid,
                totalMerkleValue: merkleState.totalValue,
                distributor: msg.sender,
                token: token,
                amountFunded: amount,
                amountDistributed: 0,
                feeRecipient: feeRecipient,
                feeAmount: feeAmount
            })
        );

        bool isNativeToken = _isNativeToken(token);

        // Move funds around.
        if (isNativeToken) {
            // Ensure the native token amount sent is correct.
            if (msg.value != amount) {
                revert InvalidNativeTokenTransferAmount();
            }

            // Transfer fee to the fee recipient.
            (bool success, bytes memory data) = payable(feeRecipient).call{
                value: feeAmount
            }("");
            if (!success) {
                revert FailedToTransferFee(data);
            }
        } else {
            // Ensure no native token is sent along with the ERC20 token.
            if (msg.value > 0) {
                revert InvalidNativeTokenTransfer();
            }

            // Transfer ERC20 from the sender to this distributor contract.
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

            // Transfer fee to the fee recipient.
            IERC20(token).safeTransfer(feeRecipient, feeAmount);
        }

        emit Distributed(
            distributionIndex,
            msg.sender,
            token,
            amount,
            feeAmount
        );
    }

    /// @notice Claims tokens for a given distribution.
    /// @param distributionIndex The index of the distribution to claim tokens for.
    /// @param account The address to claim tokens for.
    /// @param value The merkle tree value.
    /// @param proof The merkle proof that validates this claim.
    /// @return claimedAmount The amount of tokens claimed.
    /// @dev Anyone can claim tokens on behalf of an account.
    function claim(
        uint256 distributionIndex,
        address account,
        uint256 value,
        bytes32[] calldata proof
    ) external nonReentrant whenNotPaused returns (uint256 claimedAmount) {
        if (distributionIndex >= distributions.length) {
            revert DistributionNotFound();
        }

        if (account == address(0)) {
            revert InvalidAddress();
        }

        // Fetch the distribution.
        DistributionState storage distribution = distributions[
            distributionIndex
        ];
        bytes32 root = distribution.root;
        if (root == bytes32(0)) {
            revert DistributionNotFound();
        }

        // Verify the account has not already claimed tokens for this distribution.
        if (claimed[distributionIndex][account] > 0) {
            revert AlreadyClaimed();
        }

        // Verify the merkle proof.
        if (
            !MerkleProof.verifyCalldata(
                proof,
                root,
                keccak256(bytes.concat(keccak256(abi.encode(account, value))))
            )
        ) {
            revert InvalidMerkleProof();
        }

        uint256 totalDistributable = distribution.amountFunded -
            distribution.feeAmount;

        // Calculate the amount of distributable tokens to claim (proportional to value / total merkle value).
        claimedAmount = Math.mulDiv(
            totalDistributable,
            value,
            distribution.totalMerkleValue
        );

        if (claimedAmount == 0) {
            revert NoFundsToClaim();
        }

        claimed[distributionIndex][account] = claimedAmount;
        distribution.amountDistributed += claimedAmount;

        // Transfer tokens to the account.
        if (_isNativeToken(distribution.token)) {
            (bool success, bytes memory data) = payable(account).call{
                value: claimedAmount
            }("");
            if (!success) {
                revert FailedToTransferTokens(data);
            }
        } else {
            IERC20(distribution.token).safeTransfer(account, claimedAmount);
        }

        emit Claimed(
            distributionIndex,
            account,
            distribution.token,
            claimedAmount,
            value
        );
    }

    /* INTERNAL */

    /// @dev Starts 2-step ownership transfer to `newOwner`.
    function _transferOwnership(address newOwner) internal {
        if (newOwner == address(0)) {
            revert InvalidAddress();
        }

        pendingOwner = newOwner;
        emit OwnershipTransferStarted(newOwner);
    }

    /// @dev Sets the `feeRecipient` of the contract to `newFeeRecipient`.
    function _setFeeRecipient(address newFeeRecipient) internal {
        if (newFeeRecipient == address(0)) {
            revert InvalidAddress();
        }

        address previousFeeRecipient = feeRecipient;
        feeRecipient = newFeeRecipient;
        emit FeeRecipientSet(previousFeeRecipient, newFeeRecipient);
    }

    /// @dev Sets the `feePercentage` of the contract to `newFeePercentage`.
    function _setFeePercentage(uint256 newFeePercentage) internal {
        if (newFeePercentage > FEE_RANGE) {
            revert FeePercentageTooHigh();
        }

        uint256 previousFeePercentage = feePercentage;
        feePercentage = newFeePercentage;
        emit FeePercentageSet(previousFeePercentage, newFeePercentage);
    }

    /// @dev Sets the `merkleSnapshot` of the contract to `newMerkleSnapshot`.
    function _setMerkleSnapshot(address newMerkleSnapshot) internal {
        if (newMerkleSnapshot == address(0)) {
            revert InvalidAddress();
        }

        address previousMerkleSnapshot = merkleSnapshot;
        merkleSnapshot = newMerkleSnapshot;
        emit MerkleSnapshotUpdated(previousMerkleSnapshot, newMerkleSnapshot);
    }

    /// @dev Sets the `distributorAllowlistEnabled` of the contract to `distributorAllowlistEnabled_`.
    function _setDistributorAllowlistEnabled(
        bool distributorAllowlistEnabled_
    ) internal {
        distributorAllowlistEnabled = distributorAllowlistEnabled_;
        emit DistributorAllowlistUpdated(distributorAllowlistEnabled_);
    }

    /// @dev Sets the `canDistribute` flag for the distributor to `newCanDistribute`.
    function _setCanDistribute(
        address distributor,
        bool newCanDistribute
    ) internal {
        canDistribute[distributor] = newCanDistribute;
        emit DistributorAllowanceUpdated(distributor, newCanDistribute);
    }

    /// @dev Whether or not the token is a native token.
    function _isNativeToken(address token) internal pure returns (bool) {
        return token == address(0);
    }
}
