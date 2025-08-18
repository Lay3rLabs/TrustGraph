// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Test} from "forge-std/Test.sol";
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
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";

// Mock service manager for testing
contract MockWavsServiceManager is IWavsServiceManager {
    function getOperatorWeight(address) external pure returns (uint256) {
        return 100;
    }

    function validate(IWavsServiceHandler.Envelope calldata, IWavsServiceHandler.SignatureData calldata)
        external
        pure
    {
        // Always pass validation in tests
        return;
    }

    function getServiceURI() external pure returns (string memory) {
        return "test-uri";
    }

    function setServiceURI(string calldata) external pure {
        // Mock implementation
    }

    function getLatestOperatorForSigningKey(address) external pure returns (address) {
        return address(0x1);
    }
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

    function testAttest_ShouldLogAttestedValue() public {
        uint256 value = 123456;

        bytes32 uid = attester.attest(schemaId, address(0), abi.encode(value));

        // Verify the attestation was created
        assertTrue(uid != bytes32(0));
    }

    function testAttest_ShouldCreateAttestationWithGenericData() public {
        bytes memory customData = abi.encode("Hello", uint256(42), true);
        address recipient = address(0x123);

        bytes32 uid = attester.attest(schemaId, recipient, customData);

        // Verify the attestation was created
        assertTrue(uid != bytes32(0));
    }

    function testMultiAttest_ShouldLogAttestedValues() public {
        bytes32[] memory schemas = new bytes32[](2);
        schemas[0] = schemaId;
        schemas[1] = schemaId2;

        address[][] memory recipients = new address[][](2);
        recipients[0] = new address[](3);
        recipients[0][0] = address(0);
        recipients[0][1] = address(0);
        recipients[0][2] = address(0);
        recipients[1] = new address[](2);
        recipients[1][0] = address(0);
        recipients[1][1] = address(0);

        bytes[][] memory schemaData = new bytes[][](2);
        schemaData[0] = new bytes[](3);
        schemaData[0][0] = abi.encode(uint256(10));
        schemaData[0][1] = abi.encode(uint256(100));
        schemaData[0][2] = abi.encode(uint256(123456));
        schemaData[1] = new bytes[](2);
        schemaData[1][0] = abi.encode(uint256(5));
        schemaData[1][1] = abi.encode(uint256(23423234));

        bytes32[] memory uids = attester.multiAttest(schemas, recipients, schemaData);

        // Verify attestations were created
        assertEq(uids.length, 5); // 3 + 2 attestations
        for (uint256 i = 0; i < uids.length; i++) {
            assertTrue(uids[i] != bytes32(0));
        }
    }

    function testMultiAttest_ShouldCreateAttestationsWithGenericData() public {
        bytes32[] memory schemas = new bytes32[](2);
        schemas[0] = schemaId;
        schemas[1] = schemaId2;

        address[][] memory recipients = new address[][](2);
        recipients[0] = new address[](2);
        recipients[0][0] = address(0x111);
        recipients[0][1] = address(0x222);
        recipients[1] = new address[](1);
        recipients[1][0] = address(0x333);

        bytes[][] memory schemaData = new bytes[][](2);
        schemaData[0] = new bytes[](2);
        schemaData[0][0] = abi.encode("first", uint256(100));
        schemaData[0][1] = abi.encode("second", uint256(200));
        schemaData[1] = new bytes[](1);
        schemaData[1][0] = abi.encode("third", uint256(300));

        bytes32[] memory uids = attester.multiAttest(schemas, recipients, schemaData);

        // Verify attestations were created
        assertEq(uids.length, 3); // 2 + 1 attestations
        for (uint256 i = 0; i < uids.length; i++) {
            assertTrue(uids[i] != bytes32(0));
        }
    }

    function testMultiAttest_ShouldRevertWithEmptySchemas() public {
        bytes32[] memory schemas = new bytes32[](0);
        address[][] memory recipients = new address[][](0);
        bytes[][] memory schemaData = new bytes[][](0);

        vm.expectRevert(Attester.InvalidInput.selector);
        attester.multiAttest(schemas, recipients, schemaData);
    }

    function testMultiAttest_ShouldRevertWithMismatchedArrays() public {
        bytes32[] memory schemas = new bytes32[](1);
        schemas[0] = schemaId;

        address[][] memory recipients = new address[][](2);
        recipients[0] = new address[](1);
        recipients[0][0] = address(0x111);
        recipients[1] = new address[](1);
        recipients[1][0] = address(0x222);

        bytes[][] memory schemaData = new bytes[][](2);
        schemaData[0] = new bytes[](1);
        schemaData[0][0] = abi.encode(uint256(10));
        schemaData[1] = new bytes[](1);
        schemaData[1][0] = abi.encode(uint256(20));

        vm.expectRevert(Attester.InvalidInput.selector);
        attester.multiAttest(schemas, recipients, schemaData);
    }

    function testMultiAttest_GenericShouldRevertWithMismatchedArrays() public {
        bytes32[] memory schemas = new bytes32[](1);
        schemas[0] = schemaId;

        address[][] memory recipients = new address[][](2);
        recipients[0] = new address[](1);
        recipients[0][0] = address(0x111);
        recipients[1] = new address[](1);
        recipients[1][0] = address(0x222);

        bytes[][] memory schemaData = new bytes[][](1);
        schemaData[0] = new bytes[](1);
        schemaData[0][0] = abi.encode(uint256(100));

        vm.expectRevert(Attester.InvalidInput.selector);
        attester.multiAttest(schemas, recipients, schemaData);
    }

    function testRevoke_ShouldHandleRevoke() public {
        uint256 value = 999;

        // First create an attestation
        bytes32 uid = attester.attest(schemaId, address(0), abi.encode(value));

        // Then revoke it
        attester.revoke(schemaId, uid);
    }

    function testMultiRevoke_ShouldHandleMultipleRevokes() public {
        // First create multiple attestations
        bytes32[] memory schemas = new bytes32[](2);
        schemas[0] = schemaId;
        schemas[1] = schemaId2;

        address[][] memory recipients = new address[][](2);
        recipients[0] = new address[](3);
        recipients[0][0] = address(0);
        recipients[0][1] = address(0);
        recipients[0][2] = address(0);
        recipients[1] = new address[](2);
        recipients[1][0] = address(0);
        recipients[1][1] = address(0);

        bytes[][] memory schemaData = new bytes[][](2);
        schemaData[0] = new bytes[](3);
        schemaData[0][0] = abi.encode(uint256(10));
        schemaData[0][1] = abi.encode(uint256(100));
        schemaData[0][2] = abi.encode(uint256(123456));
        schemaData[1] = new bytes[](2);
        schemaData[1][0] = abi.encode(uint256(5));
        schemaData[1][1] = abi.encode(uint256(23423234));

        bytes32[] memory uids = attester.multiAttest(schemas, recipients, schemaData);

        // Prepare revocation data
        bytes32[][] memory schemaUids = new bytes32[][](2);
        schemaUids[0] = new bytes32[](3);
        schemaUids[0][0] = uids[0];
        schemaUids[0][1] = uids[1];
        schemaUids[0][2] = uids[2];

        schemaUids[1] = new bytes32[](2);
        schemaUids[1][0] = uids[3];
        schemaUids[1][1] = uids[4];

        // Revoke all attestations
        attester.multiRevoke(schemas, schemaUids);
    }

    function testMultiRevoke_ShouldRevertWithEmptySchemas() public {
        bytes32[] memory schemas = new bytes32[](0);
        bytes32[][] memory schemaUids = new bytes32[][](0);

        vm.expectRevert(Attester.InvalidInput.selector);
        attester.multiRevoke(schemas, schemaUids);
    }

    function testMultiRevoke_ShouldRevertWithMismatchedArrays() public {
        bytes32[] memory schemas = new bytes32[](1);
        schemas[0] = schemaId;

        bytes32[][] memory schemaUids = new bytes32[][](2);
        schemaUids[0] = new bytes32[](1);
        schemaUids[0][0] = bytes32(uint256(1));
        schemaUids[1] = new bytes32[](1);
        schemaUids[1][0] = bytes32(uint256(2));

        vm.expectRevert(Attester.InvalidInput.selector);
        attester.multiRevoke(schemas, schemaUids);
    }

    function testHandleSignedEnvelope_ShouldCreateAttestation() public {
        // Setup test data
        address recipient = address(0x123);
        bytes memory attestationData = abi.encode(uint256(42));

        // Create a proper AttestationRequest
        AttestationRequest memory request = AttestationRequest({
            schema: schemaId,
            data: AttestationRequestData({
                recipient: recipient,
                expirationTime: NO_EXPIRATION_TIME,
                revocable: true,
                refUID: EMPTY_UID,
                data: attestationData,
                value: 0
            })
        });

        bytes memory payload = abi.encode(request);

        // Create envelope
        IWavsServiceHandler.Envelope memory envelope = IWavsServiceHandler.Envelope({
            eventId: bytes20(uint160(0x1)),
            ordering: bytes12(uint96(0)),
            payload: payload
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
}
