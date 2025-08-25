// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {Attester} from "../../src/contracts/Attester.sol";
import {IndexerResolver} from "../../src/contracts/IndexerResolver.sol";
import {Indexer} from "../../src/contracts/Indexer.sol";
import {EAS} from "@ethereum-attestation-service/eas-contracts/contracts/EAS.sol";
import {SchemaRegistry} from "@ethereum-attestation-service/eas-contracts/contracts/SchemaRegistry.sol";
import {
    IEAS,
    AttestationRequest,
    AttestationRequestData
} from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import {ISchemaRegistry} from "@ethereum-attestation-service/eas-contracts/contracts/ISchemaRegistry.sol";
import {NO_EXPIRATION_TIME, EMPTY_UID} from "@ethereum-attestation-service/eas-contracts/contracts/Common.sol";
import {IWavsServiceManager} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";

// Mock service manager for testing
contract MockWavsServiceManager is IWavsServiceManager {
    function getOperatorWeight(address) external pure returns (uint256) {
        return 100;
    }

    function validate(
        IWavsServiceHandler.Envelope calldata,
        IWavsServiceHandler.SignatureData calldata
    ) external pure {
        // Always pass validation in tests
        return;
    }

    function getServiceURI() external pure returns (string memory) {
        return "test-uri";
    }

    function setServiceURI(string calldata) external pure {
        // Mock implementation
    }

    function getLatestOperatorForSigningKey(
        address
    ) external pure returns (address) {
        return address(0x1);
    }

    function getAllocationManager() external view override returns (address) {}

    function getDelegationManager() external view override returns (address) {}

    function getStakeRegistry() external view override returns (address) {}
}

contract AttesterTest is Test {
    Attester public attester;
    IndexerResolver public resolver;
    Indexer public indexer;
    EAS public eas;
    SchemaRegistry public schemaRegistry;
    MockWavsServiceManager public serviceManager;

    string constant SCHEMA = "uint256 value";
    string constant SCHEMA2 = "uint256 value2";
    bytes32 public schemaId;
    bytes32 public schemaId2;

    address constant ZERO_ADDRESS = address(0);

    function setUp() public {
        // Deploy contracts
        schemaRegistry = new SchemaRegistry();
        eas = new EAS(ISchemaRegistry(address(schemaRegistry)));
        indexer = new Indexer(IEAS(address(eas)));
        resolver = new IndexerResolver(IEAS(address(eas)), indexer);
        serviceManager = new MockWavsServiceManager();
        attester = new Attester(IEAS(address(eas)), IWavsServiceManager(address(serviceManager)));

        // Register schemas
        schemaId = schemaRegistry.register(SCHEMA, resolver, true);
        schemaId2 = schemaRegistry.register(SCHEMA2, resolver, true);
    }

    function testConstruction_ShouldRevertWithInvalidEAS() public {
        vm.expectRevert(Attester.InvalidEAS.selector);
        new Attester(IEAS(ZERO_ADDRESS), IWavsServiceManager(address(serviceManager)));
    }

    function testConstruction_ShouldRevertWithInvalidServiceManager() public {
        vm.expectRevert(Attester.InvalidServiceManager.selector);
        new Attester(IEAS(address(eas)), IWavsServiceManager(ZERO_ADDRESS));
    }

    // Enum for operation types matching the contract
    enum OperationType {
        ATTEST,
        REVOKE,
        MULTI_ATTEST,
        MULTI_REVOKE
    }

    // Struct for attestation payload matching the contract
    struct AttestationPayload {
        OperationType operationType;
        bytes data;
    }

    function testHandleSignedEnvelope_ShouldCreateAttestation() public {
        // Setup test data
        address recipient = address(0x123);
        bytes memory attestationData = abi.encode(uint256(42));

        // Create attestation payload for ATTEST operation
        // Data contains (schema, recipient, data) for the _attest internal function
        bytes memory attestData = abi.encode(schemaId, recipient, attestationData);
        AttestationPayload memory payload = AttestationPayload({operationType: OperationType.ATTEST, data: attestData});

        bytes memory encodedPayload = abi.encode(payload);

        // Create envelope
        IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(uint160(0x1)),
            ordering: bytes12(uint96(0)),
            payload: encodedPayload
        });

        // Create signature data
        address[] memory signers = new address[](1);
        signers[0] = address(0x456);
        bytes[] memory signatures = new bytes[](1);
        signatures[0] = abi.encodePacked("mock_signature");

        IWavsServiceHandler.SignatureData memory signatureData =
            IWavsServiceHandler.SignatureData({signers: signers, signatures: signatures, referenceBlock: 1000});

        // Call handleSignedEnvelope
        attester.handleSignedEnvelope(envelope, signatureData);

        // The test should not revert - this indicates successful attestation creation
        // In a more complete test, we would verify the attestation was actually created
        // but that would require additional EAS testing infrastructure
    }

    function testManualEncodingDecoding() public {
        // Test the exact encoding/decoding logic used by WAVS component
        bytes32 schema = schemaId;
        address recipient = address(0x123);
        bytes memory attestationData = abi.encode(uint256(42));

        // Step 1: Encode attest data (schema, recipient, data) - what component does
        bytes memory attestData = abi.encode(schema, recipient, attestationData);

        // Step 2: Create AttestationPayload - what component does
        AttestationPayload memory payload = AttestationPayload({operationType: OperationType.ATTEST, data: attestData});

        // Step 3: Encode the full payload - what component sends
        bytes memory encodedPayload = abi.encode(payload);

        console.log("Encoded payload length:", encodedPayload.length);

        // Step 4: Test decoding - what contract receives
        AttestationPayload memory decodedPayload = abi.decode(encodedPayload, (AttestationPayload));

        // Verify operation type
        assertEq(uint8(decodedPayload.operationType), uint8(OperationType.ATTEST));

        // Step 5: Test inner data decoding - what contract does internally
        (bytes32 decodedSchema, address decodedRecipient, bytes memory decodedData) =
            abi.decode(decodedPayload.data, (bytes32, address, bytes));

        // Verify all components
        assertEq(decodedSchema, schema);
        assertEq(decodedRecipient, recipient);
        assertEq(decodedData, attestationData);

        console.log("Manual encoding/decoding test passed");
    }

    function testHandleSignedEnvelopeWithManualPayload() public {
        // Use the exact same encoding as the manual test
        bytes32 schema = schemaId;
        address recipient = address(0x123);
        bytes memory attestationData = abi.encode(uint256(42));

        bytes memory attestData = abi.encode(schema, recipient, attestationData);
        AttestationPayload memory payload = AttestationPayload({operationType: OperationType.ATTEST, data: attestData});
        bytes memory encodedPayload = abi.encode(payload);

        // Create envelope
        IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(uint160(0x1)),
            ordering: bytes12(uint96(0)),
            payload: encodedPayload
        });

        // Create signature data
        address[] memory signers = new address[](1);
        signers[0] = address(0x456);
        bytes[] memory signatures = new bytes[](1);
        signatures[0] = abi.encodePacked("mock_signature");

        IWavsServiceHandler.SignatureData memory signatureData =
            IWavsServiceHandler.SignatureData({signers: signers, signatures: signatures, referenceBlock: 1000});

        // This should work without reverting
        attester.handleSignedEnvelope(envelope, signatureData);
    }

    event AttestationRequested(address indexed creator, bytes32 indexed schema, address indexed recipient, bytes data);

    function testAttestationRequestedEventFormat() public {
        // Emit the exact event that would trigger our WAVS component
        bytes32 schema = schemaId;
        address recipient = address(0x123);
        bytes memory attestationData = abi.encode(uint256(42));

        // Emit the event (simulating what would happen on-chain)
        emit AttestationRequested(msg.sender, schema, recipient, attestationData);

        // Now simulate what the WAVS component does:
        // 1. Decode event data (this would happen in the component)
        // 2. Create attestation payload
        // 3. Test that it matches our expected format

        // Convert event data to what component would encode
        bytes memory componentAttestData = abi.encode(schema, recipient, attestationData);
        AttestationPayload memory componentPayload =
            AttestationPayload({operationType: OperationType.ATTEST, data: componentAttestData});
        bytes memory componentEncodedPayload = abi.encode(componentPayload);

        console.log("Event attestationData length:", attestationData.length);
        console.log("Component attest_data length:", componentAttestData.length);
        console.log("Component full payload length:", componentEncodedPayload.length);

        // Test that our contract can decode this
        AttestationPayload memory decodedPayload = abi.decode(componentEncodedPayload, (AttestationPayload));
        assertEq(uint8(decodedPayload.operationType), uint8(OperationType.ATTEST));

        (bytes32 decodedSchema, address decodedRecipient, bytes memory decodedData) =
            abi.decode(decodedPayload.data, (bytes32, address, bytes));

        assertEq(decodedSchema, schema);
        assertEq(decodedRecipient, recipient);
        assertEq(decodedData, attestationData);

        console.log("Event format test passed - contract can decode component payload");
    }
}
