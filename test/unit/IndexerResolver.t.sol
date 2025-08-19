// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Test} from "forge-std/Test.sol";
import {IndexerResolver} from "../../src/contracts/IndexerResolver.sol";
import {EAS} from "@ethereum-attestation-service/eas-contracts/contracts/EAS.sol";
import {SchemaRegistry} from "@ethereum-attestation-service/eas-contracts/contracts/SchemaRegistry.sol";
import {Indexer} from "../../src/contracts/Indexer.sol";
import {
    IEAS,
    AttestationRequest,
    AttestationRequestData,
    RevocationRequest,
    RevocationRequestData
} from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import {ISchemaRegistry} from "@ethereum-attestation-service/eas-contracts/contracts/ISchemaRegistry.sol";
import {NO_EXPIRATION_TIME, EMPTY_UID} from "@ethereum-attestation-service/eas-contracts/contracts/Common.sol";

contract IndexerResolverTest is Test {
    IndexerResolver public resolver;
    EAS public eas;
    SchemaRegistry public schemaRegistry;
    Indexer public indexer;

    string constant SCHEMA = "uint256 value";
    bytes32 public schemaId;

    address constant ZERO_ADDRESS = address(0);
    address public attester = address(0x1);
    address public recipient = address(0x2);

    function setUp() public {
        // Deploy contracts
        schemaRegistry = new SchemaRegistry();
        eas = new EAS(ISchemaRegistry(address(schemaRegistry)));
        indexer = new Indexer(IEAS(address(eas)));
        resolver = new IndexerResolver(IEAS(address(eas)), indexer);

        // Register schema with the resolver
        schemaId = schemaRegistry.register(SCHEMA, resolver, true);
    }

    function testConstruction_ShouldInitializeCorrectly() public {
        // Verify the resolver was created successfully
        assertTrue(address(resolver) != address(0));
        assertEq(address(resolver.indexer()), address(indexer));
    }

    function testOnAttest_ShouldIndexAttestationAndEmitEvent() public {
        uint256 testValue = 12345;

        // Expect the AttestationIndexed event to be emitted
        vm.expectEmit(false, false, false, false);
        emit IndexerResolver.AttestationIndexed(bytes32(0)); // Check event signature only

        // Create an attestation which will trigger the resolver
        bytes32 uid = eas.attest(
            AttestationRequest({
                schema: schemaId,
                data: AttestationRequestData({
                    recipient: recipient,
                    expirationTime: NO_EXPIRATION_TIME,
                    revocable: true,
                    refUID: EMPTY_UID,
                    data: abi.encode(testValue),
                    value: 0
                })
            })
        );

        // Verify the attestation was indexed
        assertTrue(indexer.isAttestationIndexed(uid));

        // Verify it appears in the indexer's schema attestations
        assertEq(indexer.getSchemaAttestationUIDCount(schemaId), 1);

        bytes32[] memory schemaUIDs = indexer.getSchemaAttestationUIDs(schemaId, 0, 1, false);
        assertEq(schemaUIDs.length, 1);
        assertEq(schemaUIDs[0], uid);
    }

    function testOnAttest_ShouldIndexMultipleAttestations() public {
        uint256[] memory values = new uint256[](3);
        values[0] = 100;
        values[1] = 200;
        values[2] = 300;

        bytes32[] memory uids = new bytes32[](3);

        for (uint256 i = 0; i < values.length; i++) {
            // Expect the AttestationIndexed event
            vm.expectEmit(false, false, false, false);
            emit IndexerResolver.AttestationIndexed(bytes32(0));

            uids[i] = eas.attest(
                AttestationRequest({
                    schema: schemaId,
                    data: AttestationRequestData({
                        recipient: recipient,
                        expirationTime: NO_EXPIRATION_TIME,
                        revocable: true,
                        refUID: EMPTY_UID,
                        data: abi.encode(values[i]),
                        value: 0
                    })
                })
            );

            // Verify each attestation is indexed
            assertTrue(indexer.isAttestationIndexed(uids[i]));
        }

        // Verify all attestations are in the schema index
        assertEq(indexer.getSchemaAttestationUIDCount(schemaId), 3);

        bytes32[] memory schemaUIDs = indexer.getSchemaAttestationUIDs(schemaId, 0, 3, false);
        assertEq(schemaUIDs.length, 3);

        for (uint256 i = 0; i < values.length; i++) {
            assertEq(schemaUIDs[i], uids[i]);
        }
    }

    function testOnAttest_ShouldIndexByRecipient() public {
        uint256 testValue = 54321;

        bytes32 uid = eas.attest(
            AttestationRequest({
                schema: schemaId,
                data: AttestationRequestData({
                    recipient: recipient,
                    expirationTime: NO_EXPIRATION_TIME,
                    revocable: true,
                    refUID: EMPTY_UID,
                    data: abi.encode(testValue),
                    value: 0
                })
            })
        );

        // Verify the attestation appears in recipient's received attestations
        assertEq(indexer.getReceivedAttestationUIDCount(recipient, schemaId), 1);

        bytes32[] memory receivedUIDs = indexer.getReceivedAttestationUIDs(recipient, schemaId, 0, 1, false);
        assertEq(receivedUIDs.length, 1);
        assertEq(receivedUIDs[0], uid);
    }

    function testOnAttest_ShouldIndexByAttester() public {
        uint256 testValue = 98765;

        // Switch to the attester account for this test
        vm.prank(attester);
        bytes32 uid = eas.attest(
            AttestationRequest({
                schema: schemaId,
                data: AttestationRequestData({
                    recipient: recipient,
                    expirationTime: NO_EXPIRATION_TIME,
                    revocable: true,
                    refUID: EMPTY_UID,
                    data: abi.encode(testValue),
                    value: 0
                })
            })
        );

        // Verify the attestation appears in attester's sent attestations
        assertEq(indexer.getSentAttestationUIDCount(attester, schemaId), 1);

        bytes32[] memory sentUIDs = indexer.getSentAttestationUIDs(attester, schemaId, 0, 1, false);
        assertEq(sentUIDs.length, 1);
        assertEq(sentUIDs[0], uid);
    }

    function testOnAttest_ShouldIndexBySchemaAttesterRecipient() public {
        uint256 testValue = 13579;

        vm.prank(attester);
        bytes32 uid = eas.attest(
            AttestationRequest({
                schema: schemaId,
                data: AttestationRequestData({
                    recipient: recipient,
                    expirationTime: NO_EXPIRATION_TIME,
                    revocable: true,
                    refUID: EMPTY_UID,
                    data: abi.encode(testValue),
                    value: 0
                })
            })
        );

        // Verify the attestation appears in the schema-attester-recipient index
        assertEq(indexer.getSchemaAttesterRecipientAttestationUIDCount(schemaId, attester, recipient), 1);

        bytes32[] memory sarUIDs =
            indexer.getSchemaAttesterRecipientAttestationUIDs(schemaId, attester, recipient, 0, 1, false);
        assertEq(sarUIDs.length, 1);
        assertEq(sarUIDs[0], uid);
    }

    function testOnRevoke_ShouldAllowRevocation() public {
        uint256 testValue = 24680;

        // Create an attestation first
        bytes32 uid = eas.attest(
            AttestationRequest({
                schema: schemaId,
                data: AttestationRequestData({
                    recipient: recipient,
                    expirationTime: NO_EXPIRATION_TIME,
                    revocable: true,
                    refUID: EMPTY_UID,
                    data: abi.encode(testValue),
                    value: 0
                })
            })
        );

        // Verify attestation exists and is valid
        assertTrue(eas.isAttestationValid(uid));
        assertTrue(indexer.isAttestationIndexed(uid));

        // Revoke the attestation - should succeed
        eas.revoke(RevocationRequest({schema: schemaId, data: RevocationRequestData({uid: uid, value: 0})}));

        // Verify the attestation remains indexed (revoked attestations stay indexed for historical purposes)
        assertTrue(indexer.isAttestationIndexed(uid)); // Should still be indexed
    }

    function testOnRevoke_ShouldHandleMultipleRevocations() public {
        uint256[] memory values = new uint256[](2);
        values[0] = 777;
        values[1] = 888;

        bytes32[] memory uids = new bytes32[](2);

        // Create attestations
        for (uint256 i = 0; i < values.length; i++) {
            uids[i] = eas.attest(
                AttestationRequest({
                    schema: schemaId,
                    data: AttestationRequestData({
                        recipient: recipient,
                        expirationTime: NO_EXPIRATION_TIME,
                        revocable: true,
                        refUID: EMPTY_UID,
                        data: abi.encode(values[i]),
                        value: 0
                    })
                })
            );
        }

        // Revoke them and verify they remain indexed
        for (uint256 i = 0; i < values.length; i++) {
            eas.revoke(RevocationRequest({schema: schemaId, data: RevocationRequestData({uid: uids[i], value: 0})}));

            assertTrue(indexer.isAttestationIndexed(uids[i]));
        }

        // Verify all attestations are still in the schema index
        assertEq(indexer.getSchemaAttestationUIDCount(schemaId), 2);
    }

    function testFullAttestationIndexingCycle() public {
        uint256 testValue = 999;

        // Expect the AttestationIndexed event
        vm.expectEmit(false, false, false, false);
        emit IndexerResolver.AttestationIndexed(bytes32(0));

        // Create attestation
        bytes32 uid = eas.attest(
            AttestationRequest({
                schema: schemaId,
                data: AttestationRequestData({
                    recipient: recipient,
                    expirationTime: NO_EXPIRATION_TIME,
                    revocable: true,
                    refUID: EMPTY_UID,
                    data: abi.encode(testValue),
                    value: 0
                })
            })
        );

        // Verify attestation exists and is indexed
        assertTrue(eas.isAttestationValid(uid));
        assertTrue(indexer.isAttestationIndexed(uid));

        // Verify it appears in all relevant indexes
        assertEq(indexer.getSchemaAttestationUIDCount(schemaId), 1);
        assertEq(indexer.getReceivedAttestationUIDCount(recipient, schemaId), 1);
        assertEq(indexer.getSentAttestationUIDCount(address(this), schemaId), 1);

        // Revoke attestation
        eas.revoke(RevocationRequest({schema: schemaId, data: RevocationRequestData({uid: uid, value: 0})}));

        // Verify indexed data persists (revoked attestations remain indexed)
        assertTrue(indexer.isAttestationIndexed(uid));
        assertEq(indexer.getSchemaAttestationUIDCount(schemaId), 1);
    }

    function testPreventDoubleIndexing() public {
        uint256 testValue = 11111;

        // Create attestation (will be auto-indexed by resolver)
        bytes32 uid = eas.attest(
            AttestationRequest({
                schema: schemaId,
                data: AttestationRequestData({
                    recipient: recipient,
                    expirationTime: NO_EXPIRATION_TIME,
                    revocable: true,
                    refUID: EMPTY_UID,
                    data: abi.encode(testValue),
                    value: 0
                })
            })
        );

        // Verify it's indexed
        assertTrue(indexer.isAttestationIndexed(uid));
        assertEq(indexer.getSchemaAttestationUIDCount(schemaId), 1);

        // Try to manually index again - should not increase count
        indexer.indexAttestation(uid);

        // Count should still be 1 (no double indexing)
        assertEq(indexer.getSchemaAttestationUIDCount(schemaId), 1);
    }

    function testIndexerReference() public view {
        // Verify the resolver correctly references the indexer
        assertEq(address(resolver.indexer()), address(indexer));
    }
}
