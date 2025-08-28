"use client";

import type React from "react";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  useSchemaAttestations,
  useIndividualAttestation,
} from "@/hooks/useIndexer";
import { schemas, SCHEMA_OPTIONS } from "@/lib/schemas";
import { AttestationCard } from "@/components/AttestationCard";
import { VouchingModal } from "@/components/VouchingModal";

// Helper component to fetch attestation data for filtering
function AttestationWithStatus({
  uid,
  onStatusReady,
}: {
  uid: `0x${string}`;
  onStatusReady: (uid: string, status: string) => void;
}) {
  const { data: attestationData } = useIndividualAttestation(uid);

  const getAttestationStatus = (attestation: any) => {
    if (!attestation) return "loading";
    if (Number(attestation.revocationTime) > 0) return "revoked";
    if (
      Number(attestation.expirationTime) > 0 &&
      Number(attestation.expirationTime) < Math.floor(Date.now() / 1000)
    ) {
      return "expired";
    }
    return "verified";
  };

  useEffect(() => {
    if (attestationData) {
      const status = getAttestationStatus(attestationData);
      onStatusReady(uid, status);
    }
  }, [attestationData, uid, onStatusReady]);

  return null;
}

export default function AttestationsPage() {
  const [selectedSchema, setSelectedSchema] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [limit, setLimit] = useState(20);
  const [attestationStatuses, setAttestationStatuses] = useState<
    Record<string, string>
  >({});

  // Fetch attestations for all schemas or specific schema
  const schemaQueries = useMemo(() => {
    if (selectedSchema === "all") {
      return SCHEMA_OPTIONS.map((schema) => ({
        schemaUID: schema.uid,
        name: schema.name,
      }));
    }
    const selectedSchemaOption = SCHEMA_OPTIONS.find(
      (s) => s.uid === selectedSchema,
    );
    return selectedSchemaOption
      ? [{ schemaUID: selectedSchema, name: selectedSchemaOption.name }]
      : [];
  }, [selectedSchema]);

  // Use hooks for each schema
  const basicSchema = useSchemaAttestations(
    schemas.basicSchema,
    selectedSchema === "all" || selectedSchema === schemas.basicSchema
      ? limit
      : 0,
  );
  const computeSchema = useSchemaAttestations(
    schemas.computeSchema,
    selectedSchema === "all" || selectedSchema === schemas.computeSchema
      ? limit
      : 0,
  );
  const vouchingSchema = useSchemaAttestations(
    schemas.vouchingSchema,
    selectedSchema === "all" || selectedSchema === schemas.vouchingSchema
      ? limit
      : 0,
  );

  // Handle status updates from individual attestations
  const handleStatusReady = useCallback((uid: string, status: string) => {
    setAttestationStatuses((prev) => ({ ...prev, [uid]: status }));
  }, []);

  // Combine all attestations
  const allAttestationUIDs = useMemo(() => {
    const uids: Array<{
      uid: `0x${string}`;
      schema: `0x${string}`;
      timestamp?: number;
    }> = [];

    if (selectedSchema === "all" || selectedSchema === schemas.basicSchema) {
      basicSchema.attestationUIDs?.forEach((uid) =>
        uids.push({ uid, schema: schemas.basicSchema }),
      );
    }
    if (selectedSchema === "all" || selectedSchema === schemas.computeSchema) {
      computeSchema.attestationUIDs?.forEach((uid) =>
        uids.push({ uid, schema: schemas.computeSchema }),
      );
    }
    if (selectedSchema === "all" || selectedSchema === schemas.vouchingSchema) {
      vouchingSchema.attestationUIDs?.forEach((uid) =>
        uids.push({ uid, schema: schemas.vouchingSchema }),
      );
    }

    // Sort by newest/oldest (UIDs are typically ordered by creation time already)
    return sortOrder === "newest" ? uids : uids.reverse();
  }, [
    basicSchema.attestationUIDs,
    computeSchema.attestationUIDs,
    vouchingSchema.attestationUIDs,
    selectedSchema,
    sortOrder,
  ]);

  // Filter by status
  const filteredAttestationUIDs = useMemo(() => {
    if (selectedStatus === "all") {
      return allAttestationUIDs;
    }
    return allAttestationUIDs.filter(
      (item) => attestationStatuses[item.uid] === selectedStatus,
    );
  }, [allAttestationUIDs, selectedStatus, attestationStatuses]);

  const isLoading =
    basicSchema.isLoadingUIDs ||
    computeSchema.isLoadingUIDs ||
    vouchingSchema.isLoadingUIDs;
  const totalCount =
    (basicSchema.totalCount || 0) +
    (computeSchema.totalCount || 0) +
    (vouchingSchema.totalCount || 0);

  // Handle successful attestation creation
  const handleAttestationSuccess = useCallback(() => {
    // Force refresh of all data
    window.location.reload();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="ascii-art-title text-lg">ATTESTATIONS</div>
          <VouchingModal onSuccess={handleAttestationSuccess} />
        </div>
        <div className="system-message text-sm">
          ◆ VERIFIABLE CREDENTIALS • REPUTATION NETWORKS • TRUST PROTOCOLS ◆
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="terminal-dim text-sm mb-2 block">SCHEMA TYPE</label>
          <select
            value={selectedSchema}
            onChange={(e) => setSelectedSchema(e.target.value)}
            className="w-full bg-black/20 border border-gray-700 terminal-text text-sm p-2 rounded-sm"
          >
            <option value="all">ALL SCHEMAS</option>
            {SCHEMA_OPTIONS.map((schema) => (
              <option key={schema.uid} value={schema.uid}>
                {schema.name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="terminal-dim text-sm mb-2 block">
            VERIFICATION STATUS
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-black/20 border border-gray-700 terminal-text text-sm p-2 rounded-sm"
          >
            <option value="all">ALL STATUS</option>
            <option value="verified">VERIFIED</option>
            <option value="expired">EXPIRED</option>
            <option value="revoked">REVOKED</option>
          </select>
        </div>

        <div>
          <label className="terminal-dim text-sm mb-2 block">SORT ORDER</label>
          <select
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value as "newest" | "oldest")
            }
            className="w-full bg-black/20 border border-gray-700 terminal-text text-sm p-2 rounded-sm"
          >
            <option value="newest">NEWEST FIRST</option>
            <option value="oldest">OLDEST FIRST</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">
            {filteredAttestationUIDs.length}
          </div>
          <div className="terminal-dim text-xs">SHOWING</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">
            {allAttestationUIDs.length}
          </div>
          <div className="terminal-dim text-xs">FETCHED</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">{totalCount}</div>
          <div className="terminal-dim text-xs">TOTAL</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">{SCHEMA_OPTIONS.length}</div>
          <div className="terminal-dim text-xs">SCHEMAS</div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="terminal-bright text-lg">
            ◉ LOADING ATTESTATIONS ◉
          </div>
          <div className="terminal-dim text-sm mt-2">
            Fetching data from EAS contract...
          </div>
        </div>
      )}

      {/* Hidden components to fetch status data */}
      <div style={{ display: "none" }}>
        {allAttestationUIDs.map((item) => (
          <AttestationWithStatus
            key={`status-${item.uid}`}
            uid={item.uid}
            onStatusReady={handleStatusReady}
          />
        ))}
      </div>

      {/* Attestations List */}
      <div className="space-y-4">
        {!isLoading &&
          filteredAttestationUIDs.map((item, index) => (
            <AttestationCard key={item.uid} uid={item.uid} index={index} />
          ))}
      </div>

      {!isLoading &&
        filteredAttestationUIDs.length === 0 &&
        allAttestationUIDs.length > 0 && (
          <div className="text-center py-12">
            <div className="terminal-dim text-sm">
              NO ATTESTATIONS MATCH CURRENT FILTERS
            </div>
            <div className="system-message text-xs mt-2">
              ◆ TRY ADJUSTING YOUR FILTER SETTINGS ◆
            </div>
          </div>
        )}

      {!isLoading && allAttestationUIDs.length === 0 && (
        <div className="text-center py-12">
          <div className="terminal-dim text-sm">NO ATTESTATIONS FOUND</div>
          <div className="system-message text-xs mt-2">
            {selectedSchema !== "all"
              ? "◆ NO ATTESTATIONS FOR SELECTED SCHEMA ◆"
              : "◆ NO ATTESTATIONS AVAILABLE ◆"}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-700 pt-4 mt-8">
        <div className="system-message text-center text-sm">
          ∞ TRUST IS EARNED • REPUTATION IS VERIFIED • IDENTITY IS FLUID ∞
        </div>
      </div>
    </div>
  );
}
