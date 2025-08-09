// SPDX-License-Identifier: MIT

pragma solidity 0.8.27;

import {IEAS, Attestation} from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import {SchemaResolver} from "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";
import {Indexer} from "@ethereum-attestation-service/eas-contracts/contracts/Indexer.sol";

/// @title IndexerResolver
/// @notice A schema resolver that automatically indexes attestations upon creation.
contract IndexerResolver is SchemaResolver {
    /// @notice The Indexer contract instance.
    Indexer public immutable indexer;

    /// @notice Emitted when an attestation is automatically indexed.
    /// @param uid The UID of the indexed attestation.
    event AttestationIndexed(bytes32 indexed uid);

    /// @notice Creates a new IndexerResolver instance.
    /// @param eas The EAS contract instance.
    /// @param _indexer The Indexer contract instance.
    constructor(IEAS eas, Indexer _indexer) SchemaResolver(eas) {
        indexer = _indexer;
    }

    /// @notice Indexes the attestation upon creation.
    /// @param attestation The new attestation.
    /// @return Whether the attestation is valid and was successfully indexed.
    function onAttest(
        Attestation calldata attestation,
        uint256 /*value*/
    ) internal override returns (bool) {
        // Index the attestation
        indexer.indexAttestation(attestation.uid);

        emit IEAS.Attested(
            attestation.recipient,
            attestation.attester,
            attestation.uid,
            attestation.schema
        );
        emit AttestationIndexed(attestation.uid);

        return true;
    }

    /// @notice Handles attestation revocation (currently allows all revocations).
    /// @return Whether the attestation can be revoked.
    function onRevoke(
        Attestation calldata /*attestation*/,
        uint256 /*value*/
    ) internal pure override returns (bool) {
        // Allow all revocations - the indexer will still maintain the indexed data
        // as revoked attestations remain indexed for historical purposes
        return true;
    }
}
