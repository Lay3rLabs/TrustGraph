'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Hex } from 'viem'

import { AttestationCard } from '@/components/AttestationCard'
import { Card } from '@/components/Card'
import { CreateAttestationModal } from '@/components/CreateAttestationModal'
import {
  useAttestationDataSource,
  useAttestationQueries,
} from '@/hooks/useAttestationQueries'
import { SCHEMAS } from '@/lib/schemas'

// Helper component to fetch attestation data for filtering
function AttestationWithStatus({
  uid,
  onStatusReady,
}: {
  uid: `0x${string}`
  onStatusReady: (uid: string, status: string) => void
}) {
  const attestationQueries = useAttestationQueries()
  const { data: attestationData } = useQuery(attestationQueries.get(uid))

  const getAttestationStatus = (attestation: any) => {
    if (!attestation) return 'loading'
    if (Number(attestation.revocationTime) > 0) return 'revoked'
    if (
      Number(attestation.expirationTime) > 0 &&
      Number(attestation.expirationTime) < Math.floor(Date.now() / 1000)
    ) {
      return 'expired'
    }
    return 'verified'
  }

  useEffect(() => {
    if (attestationData) {
      const status = getAttestationStatus(attestationData)
      onStatusReady(uid, status)
    }
  }, [attestationData, uid, onStatusReady])

  return null
}

export default function AttestationsPage() {
  const router = useRouter()
  const [selectedSchema, setSelectedSchema] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [limit, setLimit] = useState(50)
  const [attestationStatuses, setAttestationStatuses] = useState<
    Record<string, string>
  >({})

  const attestationQueries = useAttestationQueries()
  const dataSource = useAttestationDataSource()

  const allQuery = useQuery({
    ...attestationQueries.uids({
      limit,
      reverse: sortOrder === 'newest',
    }),
    enabled: selectedSchema === 'all',
  })
  const allCountQuery = useQuery(attestationQueries.count())
  const { data: totalAttestations = 0, isLoading: isLoadingTotalAttestations } =
    allCountQuery

  const schemaQuery = useQuery({
    ...attestationQueries.schemaUIDs(selectedSchema as Hex, {
      limit,
      reverse: sortOrder === 'newest',
    }),
    enabled: selectedSchema !== 'all' && selectedSchema.startsWith('0x'),
  })
  const schemaCountQuery = useQuery({
    ...attestationQueries.schemaCount(selectedSchema as Hex),
    enabled: selectedSchema !== 'all' && selectedSchema.startsWith('0x'),
  })

  const { data: attestationUIDs = [], isLoading: isLoadingUIDs } =
    selectedSchema === 'all' ? allQuery : schemaQuery
  const { data: currentTotal = 0, isLoading: isLoadingCurrentTotal } =
    selectedSchema === 'all' ? allCountQuery : schemaCountQuery

  // Handle status updates from individual attestations
  const handleStatusReady = useCallback((uid: string, status: string) => {
    setAttestationStatuses((prev) => ({ ...prev, [uid]: status }))
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="ascii-art-title text-lg">ATTESTATIONS</div>
          <CreateAttestationModal />
        </div>
        {/*<div className="system-message text-sm">
          ◆ VERIFIABLE CREDENTIALS • REPUTATION NETWORKS • TRUST PROTOCOLS ◆It'
        </div>*/}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="terminal-dim text-sm mb-2 block">SCHEMA TYPE</label>
          <select
            value={selectedSchema}
            onChange={(e) => setSelectedSchema(e.target.value)}
            className="w-full terminal-text text-sm p-2 rounded-sm bg-card-foreground/30 shadow-md"
          >
            <option value="all">ALL SCHEMAS</option>
            {SCHEMAS.map((schema) => (
              <option key={schema.uid} value={schema.uid}>
                {schema.name}
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
            className="w-full terminal-text text-sm p-2 rounded-sm bg-card-foreground/30 shadow-md"
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
              setSortOrder(e.target.value as 'newest' | 'oldest')
            }
            className="w-full terminal-text text-sm p-2 rounded-sm bg-card-foreground/30 shadow-md"
          >
            <option value="newest">NEWEST FIRST</option>
            <option value="oldest">OLDEST FIRST</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card type="detail" size="sm">
          <div className="terminal-bright text-lg">{currentTotal}</div>
          <div className="terminal-dim text-xs">FETCHED</div>
        </Card>
        <Card type="detail" size="sm">
          <div className="terminal-bright text-lg">{totalAttestations}</div>
          <div className="terminal-dim text-xs">TOTAL ATTESTATIONS</div>
        </Card>
        <Card type="detail" size="sm">
          <div className="terminal-bright text-lg">{SCHEMAS.length}</div>
          <div className="terminal-dim text-xs">SCHEMAS</div>
        </Card>
      </div>

      {/* Loading State */}
      {(isLoadingUIDs ||
        isLoadingCurrentTotal ||
        isLoadingTotalAttestations) && (
        <div className="text-center py-8">
          <div className="terminal-bright text-lg">
            ◉ LOADING ATTESTATIONS ◉
          </div>
          <div className="terminal-dim text-sm mt-2">Fetching data...</div>
        </div>
      )}

      {/* Hidden components to fetch status data */}
      <div style={{ display: 'none' }}>
        {attestationUIDs.map((item) => (
          <AttestationWithStatus
            key={`status-${item.uid}`}
            uid={item.uid}
            onStatusReady={handleStatusReady}
          />
        ))}
      </div>

      {/* Attestations List */}
      <div className="space-y-4">
        {!isLoadingUIDs &&
          attestationUIDs.map((item) => (
            <AttestationCard
              key={item.uid}
              uid={item.uid}
              clickable
              onClick={() => router.push(`/attestations/${item.uid}`)}
            />
          ))}
      </div>

      {!isLoadingTotalAttestations &&
        currentTotal === 0 &&
        totalAttestations > 0 && (
          <div className="text-center py-12">
            <div className="terminal-dim text-sm">
              NO ATTESTATIONS MATCH CURRENT FILTERS
            </div>
            <div className="system-message text-xs mt-2">
              ◆ TRY ADJUSTING YOUR FILTER SETTINGS ◆
            </div>
          </div>
        )}

      {!isLoadingTotalAttestations && totalAttestations === 0 && (
        <div className="text-center py-12">
          <div className="terminal-dim text-sm">NO ATTESTATIONS FOUND</div>
          <div className="system-message text-xs mt-2">
            {selectedSchema !== 'all'
              ? '◆ NO ATTESTATIONS FOR SELECTED SCHEMA ◆'
              : '◆ NO ATTESTATIONS AVAILABLE ◆'}
          </div>
        </div>
      )}
    </div>
  )
}
