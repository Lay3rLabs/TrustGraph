"use client";

import { useIndividualAttestation } from "@/hooks/useIndexer";

interface AttestationCardProps {
  uid: string;
  index: number;
}

export function AttestationCard({ uid, index }: AttestationCardProps) {
  const { data: attestationData, isLoading, error } = useIndividualAttestation(uid);

  const formatTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
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
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="space-y-1">
              <div className="terminal-command text-sm">
                VOUCHING ATTESTATION #{index + 1}
              </div>
              <div className="terminal-dim text-xs">
                UID: {uid.slice(0, 16)}...{uid.slice(-8)}
              </div>
            </div>
            <div className="terminal-dim text-xs">Loading...</div>
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
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="space-y-1">
              <div className="terminal-command text-sm">
                VOUCHING ATTESTATION #{index + 1}
              </div>
              <div className="terminal-dim text-xs">
                UID: {uid.slice(0, 16)}...{uid.slice(-8)}
              </div>
            </div>
            <div className="terminal-text text-red-400 text-xs">Error</div>
          </div>
          <div className="terminal-text text-red-400 text-xs">
            Failed to load attestation: {error.message}
          </div>
        </div>
      </div>
    );
  }

  if (!attestationData) {
    return (
      <div className="border border-yellow-700 bg-yellow-900/10 p-4 rounded-sm">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="space-y-1">
              <div className="terminal-command text-sm">
                VOUCHING ATTESTATION #{index + 1}
              </div>
              <div className="terminal-dim text-xs">
                UID: {uid.slice(0, 16)}...{uid.slice(-8)}
              </div>
            </div>
            <div className="terminal-dim text-xs">No data</div>
          </div>
          <div className="terminal-dim text-xs">
            Attestation not found or invalid UID
          </div>
        </div>
      </div>
    );
  }

  const attestation = attestationData as any;
  const vouchData = parseVouchingData(attestation.data);

  return (
    <div className="border border-gray-700 bg-black/5 p-4 rounded-sm">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="space-y-1">
            <div className="terminal-command text-sm">
              VOUCHING ATTESTATION #{index + 1}
            </div>
            <div className="terminal-dim text-xs">
              UID: {uid.slice(0, 16)}...{uid.slice(-8)}
            </div>
          </div>
          <div className="terminal-dim text-xs">
            {formatTimeAgo(Number(attestation.time))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="terminal-dim text-xs">ATTESTER:</div>
            <div className="terminal-text text-xs font-mono">
              {attestation.attester.slice(0, 8)}...
              {attestation.attester.slice(-6)}
            </div>
          </div>
          <div className="space-y-2">
            <div className="terminal-dim text-xs">RECIPIENT:</div>
            <div className="terminal-text text-xs font-mono">
              {attestation.recipient.slice(0, 8)}...
              {attestation.recipient.slice(-6)}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="terminal-dim text-xs">VOUCH WEIGHT:</div>
          <div className="terminal-text text-sm">{vouchData.weight}</div>
        </div>

        {Number(attestation.revocationTime) > 0 && (
          <div className="border border-red-700 bg-red-900/10 p-2 rounded-sm">
            <div className="terminal-text text-red-400 text-xs">⚠️ REVOKED</div>
          </div>
        )}
      </div>
    </div>
  );
}