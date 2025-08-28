"use client";

import { AttestationData, useIndividualAttestation } from "@/hooks/useIndexer";
import { SCHEMA_OPTIONS } from "@/lib/schemas";

interface AttestationCardProps {
  uid: `0x${string}`;
}

export function AttestationCard({ uid }: AttestationCardProps) {
  const {
    data: attestation,
    isLoading,
    error,
  } = useIndividualAttestation(uid);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toISOString().replace('T', ' ').split('.')[0];
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const getAttestationStatus = (attestation: AttestationData) => {
    if (Number(attestation.revocationTime) > 0) {
      return { status: "revoked", color: "text-red-400" };
    }
    if (Number(attestation.expirationTime) > 0 && Number(attestation.expirationTime) < Math.floor(Date.now() / 1000)) {
      return { status: "expired", color: "text-yellow-400" };
    }
    return { status: "verified", color: "text-green-400" };
  };

  const parseVouchingData = (data: string) => {
    try {
      // Parse the ABI encoded data for vouching schema
      // Vouching schema has a "weight" field
      if (data === "0x" || !data) return { weight: "0" };

      // Simple parsing - in a real implementation you'd use proper ABI decoding
      // The data should be ABI-encoded uint256 for the weight
      // For now, assume it's a simple hex-encoded number
      if (data.length > 2) {
        try {
          const hexValue = data.slice(2);
          if (hexValue.length === 64) {
            // Standard ABI-encoded uint256
            const weight = parseInt(hexValue, 16);
            return { weight: weight.toString() };
          }
        } catch {
          // Fall through to default
        }
      }

      return { weight: "1" }; // Default weight
    } catch (err) {
      return { weight: "Unknown" };
    }
  };

  if (isLoading) {
    return (
      <div className="border border-gray-700 bg-black/5 p-4 rounded-sm">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <span className="terminal-bright text-lg">◆</span>
              <div>
                <h3 className="terminal-bright text-base">
                  ATTESTATION
                </h3>
                <div className="terminal-dim text-sm">Loading...</div>
              </div>
            </div>
            <div className="terminal-dim text-xs">LOADING</div>
          </div>
          <div className="terminal-dim text-xs">
            UID: {uid}
          </div>
          <div className="terminal-dim text-xs">
            Fetching attestation details from EAS contract...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-700 bg-red-900/10 p-4 rounded-sm">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-red-400 text-lg">◆</span>
              <div>
                <h3 className="terminal-bright text-base">
                  ATTESTATION
                </h3>
                <div className="terminal-dim text-sm">Failed to load</div>
              </div>
            </div>
            <div className="text-red-400 text-xs">ERROR</div>
          </div>
          <div className="terminal-dim text-xs">
            UID: {uid}
          </div>
          <div className="terminal-text text-red-400 text-xs">
            Failed to load attestation: {error.message}
          </div>
        </div>
      </div>
    );
  }

  if (!attestation) {
    return (
      <div className="border border-yellow-700 bg-yellow-900/10 p-4 rounded-sm">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-yellow-400 text-lg">◆</span>
              <div>
                <h3 className="terminal-bright text-base">
                  ATTESTATION
                </h3>
                <div className="terminal-dim text-sm">No data found</div>
              </div>
            </div>
            <div className="text-yellow-400 text-xs">NOT FOUND</div>
          </div>
          <div className="terminal-dim text-xs">
            UID: {uid}
          </div>
          <div className="terminal-dim text-xs">
            Attestation not found or invalid UID
          </div>
        </div>
      </div>
    );
  }

  const data = parseVouchingData(attestation.data);
  const statusInfo = getAttestationStatus(attestation);
  const schemaOptions = SCHEMA_OPTIONS.find(
    (schema) => schema.uid === attestation.schema,
  );

  return (
    <div className="border border-gray-700 bg-card-foreground/70 p-4 rounded-sm hover:bg-card-foreground/75 transition-colors">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <span className="terminal-bright text-lg">◆</span>
            <div>
              <h3 className="terminal-bright text-base">
                {schemaOptions?.name.split(' ')[0].toUpperCase()} ATTESTATION
              </h3>
              <div className="terminal-dim text-sm">
                Vouch Weight: {data.weight}
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 border border-gray-700 rounded-sm text-xs ${statusInfo.color}`}>
            {statusInfo.status.toUpperCase()}
          </div>
        </div>

        {/* Attestation Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="terminal-dim text-xs mb-1">ATTESTATION UID</div>
            <div className="terminal-text font-mono text-xs break-all">{uid}</div>
          </div>
          <div>
            <div className="terminal-dim text-xs mb-1">TIMESTAMP</div>
            <div className="terminal-text text-xs">
              {formatTimestamp(Number(attestation.time))}
            </div>
          </div>
          <div>
            <div className="terminal-dim text-xs mb-1">ATTESTER</div>
            <div className="terminal-text font-mono text-xs break-all">{attestation.attester}</div>
          </div>
          <div>
            <div className="terminal-dim text-xs mb-1">RECIPIENT</div>
            <div className="terminal-text font-mono text-xs break-all">{attestation.recipient}</div>
          </div>
          <div>
            <div className="terminal-dim text-xs mb-1">SCHEMA UID</div>
            <div className="terminal-text font-mono text-xs break-all">{attestation.schema}</div>
          </div>
          {attestation.refUID && attestation.refUID !== "0x0000000000000000000000000000000000000000000000000000000000000000" && (
            <div>
              <div className="terminal-dim text-xs mb-1">REFERENCE UID</div>
              <div className="terminal-text font-mono text-xs break-all">{attestation.refUID}</div>
            </div>
          )}
          <div>
            <div className="terminal-dim text-xs mb-1">TIME AGO</div>
            <div className="terminal-text text-xs">{formatTimeAgo(Number(attestation.time))}</div>
          </div>
          {Number(attestation.expirationTime) > 0 && (
            <div>
              <div className="terminal-dim text-xs mb-1">EXPIRATION</div>
              <div className="terminal-text text-xs">
                {formatTimestamp(Number(attestation.expirationTime))}
              </div>
            </div>
          )}
        </div>

        {/* Additional Status Messages */}
        {Number(attestation.revocationTime) > 0 && (
          <div className="border border-red-700 bg-red-900/10 p-3 rounded-sm">
            <div className="terminal-text text-red-400 text-xs">
              ⚠️ REVOKED: {formatTimestamp(Number(attestation.revocationTime))}
            </div>
          </div>
        )}

        {Number(attestation.expirationTime) > 0 && Number(attestation.expirationTime) < Math.floor(Date.now() / 1000) && (
          <div className="border border-yellow-700 bg-yellow-900/10 p-3 rounded-sm">
            <div className="terminal-text text-yellow-400 text-xs">
              ⚠️ EXPIRED: {formatTimestamp(Number(attestation.expirationTime))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
