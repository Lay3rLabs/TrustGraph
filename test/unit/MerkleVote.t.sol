// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {MerkleVote} from "contracts/MerkleVote.sol";
import {ITypes} from "interfaces/ITypes.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";

contract MockServiceManager is IWavsServiceManager {
    function validate(IWavsServiceHandler.Envelope calldata, IWavsServiceHandler.SignatureData calldata)
        external
        pure
    {
        // Mock validation - always passes
    }

    function getOperatorWeight(address) external pure returns (uint256) {
        return 1;
    }

    function getServiceURI() external pure returns (string memory) {
        return "";
    }

    function setServiceURI(string calldata) external {
        // Mock implementation
    }

    function getLatestOperatorForSigningKey(address) external pure returns (address) {
        return address(0);
    }
}

contract MerkleVoteTest is Test {
    MerkleVote public merkleVote;
    MockServiceManager public serviceManager;

    address public owner = address(0x1);
    uint256 public timelock = 3600;

    function setUp() public {
        serviceManager = new MockServiceManager();
        merkleVote = new MerkleVote(IWavsServiceManager(address(serviceManager)), owner, timelock);
    }

    function testHandleSignedEnvelope_ShouldDecodeCorrectly() public {
        // Prepare test data
        bytes32 expectedRoot = keccak256("test-root");
        bytes32 expectedIpfsHashData = keccak256("ipfs-data");
        string memory expectedIpfsHashCid = "QmTestHash123456789";

        // Create AvsOutput
        ITypes.AvsOutput memory avsOutput =
            ITypes.AvsOutput({root: expectedRoot, ipfsHashData: expectedIpfsHashData, ipfsHash: expectedIpfsHashCid});

        // Encode AvsOutput
        bytes memory avsOutputEncoded = abi.encode(avsOutput);

        // Create DataWithId wrapping the AvsOutput
        ITypes.TriggerId triggerId = ITypes.TriggerId.wrap(1);
        ITypes.DataWithId memory dataWithId = ITypes.DataWithId({triggerId: triggerId, data: avsOutputEncoded});

        // Encode DataWithId as the envelope payload
        bytes memory payload = abi.encode(dataWithId);

        // Create envelope
        IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(uint160(0x1)),
            ordering: bytes12(uint96(0)),
            payload: payload
        });

        // Create signature data (mock)
        IWavsServiceHandler.SignatureData memory signatureData = IWavsServiceHandler.SignatureData({
            signers: new address[](0),
            signatures: new bytes[](0),
            referenceBlock: 1000
        });

        // Call handleSignedEnvelope
        merkleVote.handleSignedEnvelope(envelope, signatureData);

        // Verify the state was updated correctly
        assertEq(merkleVote.root(), expectedRoot, "Root should be updated");
        assertEq(merkleVote.ipfsHash(), expectedIpfsHashData, "IPFS hash data should be updated");
        assertEq(merkleVote.ipfsHashCid(), expectedIpfsHashCid, "IPFS hash CID should be updated");
    }

    function testHandleSignedEnvelope_WithDifferentData() public {
        // Test with different values to ensure proper decoding
        bytes32 expectedRoot = bytes32(uint256(0xDEADBEEF));
        bytes32 expectedIpfsHashData = bytes32(uint256(0xCAFEBABE));
        string memory expectedIpfsHashCid = "QmAnotherTestHash987654321";

        ITypes.AvsOutput memory avsOutput =
            ITypes.AvsOutput({root: expectedRoot, ipfsHashData: expectedIpfsHashData, ipfsHash: expectedIpfsHashCid});

        ITypes.TriggerId triggerId = ITypes.TriggerId.wrap(42);
        ITypes.DataWithId memory dataWithId = ITypes.DataWithId({triggerId: triggerId, data: abi.encode(avsOutput)});

        IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(uint160(0x2)),
            ordering: bytes12(uint96(0)),
            payload: abi.encode(dataWithId)
        });

        IWavsServiceHandler.SignatureData memory signatureData = IWavsServiceHandler.SignatureData({
            signers: new address[](0),
            signatures: new bytes[](0),
            referenceBlock: 2000
        });

        merkleVote.handleSignedEnvelope(envelope, signatureData);

        assertEq(merkleVote.root(), expectedRoot, "Root should match expected value");
        assertEq(merkleVote.ipfsHash(), expectedIpfsHashData, "IPFS hash data should match expected value");
        assertEq(merkleVote.ipfsHashCid(), expectedIpfsHashCid, "IPFS hash CID should match expected value");
    }

    function testRootManagement() public {
        vm.startPrank(owner);

        // Set up an updater
        address updater = address(0x2);
        merkleVote.setRootUpdater(updater, true);

        vm.stopPrank();
        vm.startPrank(updater);

        // Submit a new root
        bytes32 newRoot = keccak256("new-root");
        bytes32 newIpfsHash = keccak256("new-ipfs");
        merkleVote.submitRoot(newRoot, newIpfsHash);

        // Check pending root
        (bytes32 pendingRoot, bytes32 pendingIpfsHash,) = merkleVote.pendingRoot();
        assertEq(pendingRoot, newRoot, "Pending root should be set");
        assertEq(pendingIpfsHash, newIpfsHash, "Pending IPFS hash should be set");

        // Fast forward time
        vm.warp(block.timestamp + timelock + 1);

        // Accept the root
        merkleVote.acceptRoot();

        // Verify root was updated
        assertEq(merkleVote.root(), newRoot, "Root should be updated after timelock");
        assertEq(merkleVote.ipfsHash(), newIpfsHash, "IPFS hash should be updated after timelock");

        vm.stopPrank();
    }

    function testVotingPowerVerification() public {
        // First set a root via handleSignedEnvelope
        bytes32 merkleRoot = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;

        ITypes.AvsOutput memory avsOutput = ITypes.AvsOutput({root: merkleRoot, ipfsHashData: bytes32(0), ipfsHash: ""});

        ITypes.DataWithId memory dataWithId =
            ITypes.DataWithId({triggerId: ITypes.TriggerId.wrap(1), data: abi.encode(avsOutput)});

        IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(uint160(0x3)),
            ordering: bytes12(uint96(0)),
            payload: abi.encode(dataWithId)
        });

        IWavsServiceHandler.SignatureData memory signatureData = IWavsServiceHandler.SignatureData({
            signers: new address[](0),
            signatures: new bytes[](0),
            referenceBlock: 3000
        });

        merkleVote.handleSignedEnvelope(envelope, signatureData);

        // Verify root was set
        assertEq(merkleVote.root(), merkleRoot, "Merkle root should be set");

        // Create merkle proof data
        address account = address(0x3);
        uint256 proposalId = 1;
        address rewardToken = address(0x4);
        uint256 votingPower = 1000;

        // Create leaf matching RewardDistributor structure
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(account, rewardToken, votingPower))));

        // For this test, we'll use a simple proof (in real scenario, this would be a proper merkle proof)
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leaf;

        // Note: This will fail with INVALID_PROOF since we're using a mock proof
        // In a real test, you'd need to construct a proper merkle tree and proof
        vm.expectRevert("INVALID_PROOF");
        merkleVote.verifyVotingPower(account, proposalId, rewardToken, votingPower, proof);
    }
}
