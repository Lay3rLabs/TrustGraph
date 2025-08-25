"use client";

import type React from "react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { injected } from "wagmi/connectors";
import { useConnect } from "wagmi";
import { useVouchingAttestations } from "@/hooks/useIndexer";
import { schemas } from "@/lib/schemas";
import { AttestationCard } from "@/components/AttestationCard";
import { VouchingModal } from "@/components/VouchingModal";

export default function VouchingPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { totalCount, attestationUIDs, isLoadingUIDs, countError, uidsError } =
    useVouchingAttestations(10);
  const [isVouchingModalOpen, setIsVouchingModalOpen] = useState(false);

  const handleConnect = () => {
    try {
      connect({ connector: injected() });
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="space-y-2">
            <div className="terminal-command text-lg">VOUCHING PROTOCOL</div>
            <div className="system-message">
              ◢◤ Trust networks through cryptographic vouching ◢◤
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <Button
                onClick={() => setIsVouchingModalOpen(true)}
                className="mobile-terminal-btn !px-4 !py-2"
              >
                <span className="terminal-command text-xs">CREATE VOUCH</span>
              </Button>
            ) : (
              <Button onClick={handleConnect} className="mobile-terminal-btn !px-4 !py-2">
                <span className="terminal-command text-xs">CONNECT WALLET</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Connection Status */}
      {!isConnected && (
        <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
          <div className="flex items-center justify-between">
            <div className="terminal-text">WALLET CONNECTION REQUIRED</div>
            <Button onClick={handleConnect} className="mobile-terminal-btn !px-4 !py-2">
              <span className="terminal-command text-xs">CONNECT WALLET</span>
            </Button>
          </div>
        </div>
      )}

      {/* Vouching Schema Info */}
      <div className="space-y-4">
        <div className="terminal-text">VOUCHING SCHEMA:</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
            <div className="space-y-2">
              <div className="terminal-command text-sm">Schema Information</div>
              <div className="terminal-dim text-xs">
                Used for creating trust relationships and vouching for other
                users
              </div>
              <div className="space-y-1">
                <div className="terminal-dim text-xs">Fields:</div>
                <div className="terminal-text text-xs ml-2">
                  • weight (numeric value representing vouch strength)
                </div>
              </div>
            </div>
          </div>
          <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
            <div className="space-y-2">
              <div className="terminal-command text-sm">SCHEMA UID</div>
              <div className="terminal-dim text-xs break-all">
                {schemas.vouchingSchema}
              </div>
              <div className="terminal-dim text-xs">
                Vouching schema identifier
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vouching Stats */}
      <div className="space-y-4">
        <div className="terminal-text">VOUCHING STATISTICS:</div>
        <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
          <div className="space-y-2">
            <div className="terminal-command text-sm">TOTAL VOUCH COUNT</div>
            <div className="terminal-text text-2xl">
              {isLoadingUIDs ? "..." : totalCount.toString()}
            </div>
            <div className="terminal-dim text-xs">
              Lifetime vouching attestations
            </div>
          </div>
        </div>
      </div>

      {/* Recent Vouching Attestations */}
      <div className="space-y-4">
        <div className="terminal-text">RECENT VOUCHING ATTESTATIONS:</div>
        <div className="space-y-3">
          {isLoadingUIDs ? (
            <div className="border border-gray-700 bg-black/5 p-4 rounded-sm">
              <div className="terminal-dim text-xs text-center">
                Loading attestation UIDs from indexer...
              </div>
            </div>
          ) : countError || uidsError ? (
            <div className="border border-red-700 bg-red-900/10 p-4 rounded-sm">
              <div className="terminal-text text-red-400 text-xs text-center">
                Error loading attestations:{" "}
                {countError?.message || uidsError?.message}
              </div>
            </div>
          ) : attestationUIDs.length === 0 ? (
            <div className="border border-gray-700 bg-black/5 p-4 rounded-sm">
              <div className="terminal-dim text-xs text-center">
                No vouching attestations found
              </div>
            </div>
          ) : (
            attestationUIDs.map((uid, index) => (
              <AttestationCard key={uid} uid={uid} index={index} />
            ))
          )}
        </div>
      </div>

      {/* Vouching Modal */}
      <VouchingModal
        isOpen={isVouchingModalOpen}
        setIsOpen={setIsVouchingModalOpen}
      />
    </div>
  );
}
