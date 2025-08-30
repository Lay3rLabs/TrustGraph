// SPDX-License-Identifier: MIT

pragma solidity 0.8.27;

import {IEAS, Attestation} from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import {SchemaResolver} from "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";
import {AttestationAttested, AttestationRevoked} from "../../interfaces/IIndexedEvents.sol";

/// @title EASIndexerResolver
/// @notice A schema resolver that automatically indexes attestations upon creation.
contract EASIndexerResolver is SchemaResolver {
    /// @notice Creates a new EASIndexerResolver instance.
    /// @param eas The EAS contract instance.
    constructor(IEAS eas) SchemaResolver(eas) {}

    /// @notice Indexes the attestation upon creation.
    /// @param attestation The new attestation.
    /// @return Whether the attestation is valid and was successfully indexed.
    function onAttest(Attestation calldata attestation, uint256 /*value*/ ) internal override returns (bool) {
        // Emitted so the WAVS eas-compute component can be more generic.
        emit IEAS.Attested(attestation.recipient, attestation.attester, attestation.uid, attestation.schema);

        // Emit the attestation indexed event for the WavsIndexer
        emit AttestationAttested(address(_eas), attestation.uid);

        return true;
    }

    /// @notice Handles attestation revocation.
    /// @return Whether the attestation can be revoked.
    function onRevoke(Attestation calldata attestation, uint256 /*value*/ ) internal override returns (bool) {
        // Emit the attestation revoked event for the WavsIndexer
        emit AttestationRevoked(address(_eas), attestation.uid);
        return true;
    }
}
