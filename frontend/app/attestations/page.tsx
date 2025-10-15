'use client'

import { usePonderQuery } from '@ponder/react'
import { useRouter } from 'next/navigation'
import { count, eq } from 'ponder'
import type React from 'react'
import { useMemo, useState } from 'react'
import { Hex } from 'viem'

import { AttestationCard } from '@/components/AttestationCard'
import { Card } from '@/components/Card'
import { CreateAttestationModal } from '@/components/CreateAttestationModal'
import { intoAttestationsData } from '@/lib/attestation'
import { SCHEMAS } from '@/lib/schemas'
import { easAttestation } from '@/ponder.schema'

export default function AttestationsPage() {
  const router = useRouter()
  const [selectedSchema, setSelectedSchema] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [limit, _setLimit] = useState(50)

  const {
    data: [{ count: totalAttestations }] = [{ count: 0 }],
    isLoading: isLoadingTotalAttestations,
  } = usePonderQuery({
    queryFn: (db) =>
      db.select({ count: count(easAttestation.uid) }).from(easAttestation),
  })
  const {
    data: [{ count: currentTotal }] = [{ count: 0 }],
    isLoading: isLoadingCurrentTotal,
  } = usePonderQuery({
    queryFn: (db) =>
      db
        .select({ count: count(easAttestation.uid) })
        .from(easAttestation)
        .where(
          selectedSchema === 'all' || !selectedSchema.startsWith('0x')
            ? undefined
            : eq(easAttestation.schema, selectedSchema as Hex)
        ),
  })

  const { data: _attestations, isLoading: isLoadingAttestations } =
    usePonderQuery({
      queryFn: (db) =>
        db.query.easAttestation.findMany({
          where: (t, { eq }) =>
            selectedSchema === 'all' || !selectedSchema.startsWith('0x')
              ? undefined
              : eq(t.schema, selectedSchema as Hex),
          orderBy: (t, { asc, desc }) =>
            sortOrder === 'newest' ? desc(t.timestamp) : asc(t.timestamp),
          limit,
        }),
    })
  const attestations = useMemo(
    () => intoAttestationsData(_attestations || []),
    [_attestations]
  )

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
      {(isLoadingAttestations ||
        isLoadingCurrentTotal ||
        isLoadingTotalAttestations) && (
        <div className="text-center py-8">
          <div className="terminal-bright text-lg">
            ◉ LOADING ATTESTATIONS ◉
          </div>
          <div className="terminal-dim text-sm mt-2">Fetching data...</div>
        </div>
      )}

      {/* Attestations List */}
      <div className="space-y-4">
        {!isLoadingAttestations &&
          attestations
            .filter(
              (item) =>
                selectedStatus === 'all' || item.status === selectedStatus
            )
            .map((item) => (
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
