// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/*
 Note: having stupid version issues with this contract's dependencies so it's disabled for now.
*/

import {UniversalRewardsDistributor} from "@morpho-org/universal-rewards-distributor/UniversalRewardsDistributor.sol";
import {ErrorsLib} from "@morpho-org/universal-rewards-distributor/libraries/ErrorsLib.sol";
import {EventsLib} from "@morpho-org/universal-rewards-distributor/libraries/EventsLib.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IMerkleSnapshot} from "interfaces/merkle/IMerkleSnapshot.sol";
import {IMerkleSnapshotHook} from "interfaces/merkle/IMerkleSnapshotHook.sol";

contract RewardDistributor is UniversalRewardsDistributor, IMerkleSnapshotHook {
    using SafeERC20 for IERC20;

    /// @notice The optional ipfs hash CID containing metadata about the root (e.g. the merkle tree itself).
    string public ipfsHashCid;

    /// @notice The ERC20 reward token to distribute
    address public rewardToken;

    /**
     * @notice Initialize the contract
     * @param rewardToken_ The ERC20 reward token to distribute
     */
    constructor(address rewardToken_) UniversalRewardsDistributor(address(this), 0, bytes32(0), bytes32(0)) {
        rewardToken = rewardToken_;
    }

    /// @inheritdoc IMerkleSnapshotHook
    function onMerkleUpdate(IMerkleSnapshot.MerkleState memory state) external {
        _setRoot(state.root, state.ipfsHash);
        ipfsHashCid = state.ipfsHashCid;
        emit IMerkleSnapshot.MerkleRootUpdated(state.root, state.ipfsHash, state.ipfsHashCid);
    }

    /// @notice Claims rewards for the reward token.
    /// @param account The address to claim rewards for.
    /// @param claimable The overall claimable amount of token rewards.
    /// @param proof The merkle proof that validates this claim.
    /// @return amount The amount of reward token claimed.
    /// @dev Anyone can claim rewards on behalf of an account.
    function claim(address account, uint256 claimable, bytes32[] calldata proof) external returns (uint256 amount) {
        require(root != bytes32(0), ErrorsLib.ROOT_NOT_SET);
        require(
            MerkleProof.verifyCalldata(proof, root, keccak256(bytes.concat(keccak256(abi.encode(account, claimable))))),
            ErrorsLib.INVALID_PROOF_OR_EXPIRED
        );

        require(claimable > claimed[account][rewardToken], ErrorsLib.CLAIMABLE_TOO_LOW);

        amount = claimable - claimed[account][rewardToken];

        claimed[account][rewardToken] = claimable;

        IERC20(rewardToken).safeTransfer(account, amount);

        emit EventsLib.Claimed(account, rewardToken, amount);
    }
}
