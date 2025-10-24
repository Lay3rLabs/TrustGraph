'use client'

import { count } from '@ponder/client'
import { usePonderQuery } from '@ponder/react'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useState } from 'react'
import { Hex } from 'viem'

import { AttestationCard } from '@/components/AttestationCard'
import { CreateAttestationModal } from '@/components/CreateAttestationModal'
import { useIntoAttestationsData } from '@/hooks/useAttestation'
import { usePushBreadcrumb } from '@/hooks/usePushBreadcrumb'
import { LOCALISM_FUND } from '@/lib/network'
import { SCHEMAS } from '@/lib/schemas'
import { easAttestation } from '@/ponder.schema'

export default function AttestationsPage() {
  const router = useRouter()
  const pushBreadcrumb = usePushBreadcrumb()
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

  const { data: attestations = [], isLoading: isLoadingAttestations } =
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
      select: useIntoAttestationsData(),
    })

  const filteredAttestations = attestations.filter(
    (item) => selectedStatus === 'all' || item.status === selectedStatus
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-lg">ATTESTATIONS</div>
        <CreateAttestationModal network={LOCALISM_FUND} />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm mb-2 block">SCHEMA TYPE</label>
          <select
            value={selectedSchema}
            onChange={(e) => setSelectedSchema(e.target.value)}
            className="w-full text-sm p-2 rounded-sm bg-background border border-border cursor-pointer"
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
          <label className="text-sm mb-2 block">VERIFICATION STATUS</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full text-sm p-2 rounded-sm bg-background border border-border cursor-pointer"
          >
            <option value="all">ALL STATUSES</option>
            <option value="verified">VERIFIED</option>
            <option value="expired">EXPIRED</option>
            <option value="revoked">REVOKED</option>
          </select>
        </div>

        <div>
          <label className="text-sm mb-2 block">SORT ORDER</label>
          <select
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value as 'newest' | 'oldest')
            }
            className="w-full text-sm p-2 rounded-sm bg-background border border-border cursor-pointer"
          >
            <option value="newest">NEWEST FIRST</option>
            <option value="oldest">OLDEST FIRST</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {(isLoadingAttestations || isLoadingTotalAttestations) && (
        <div className="text-center py-8">
          <div className="text-lg">LOADING ATTESTATIONS</div>
          <div className="text-sm mt-2">Fetching data...</div>
        </div>
      )}

      {!isLoadingTotalAttestations &&
        filteredAttestations.length === 0 &&
        totalAttestations > 0 && (
          <div className="text-center py-12">
            <div className="text-sm">NO ATTESTATIONS MATCH CURRENT FILTERS</div>
            <div className="text-xs mt-2">
              TRY ADJUSTING YOUR FILTER SETTINGS
            </div>
          </div>
        )}

      {!isLoadingTotalAttestations && totalAttestations === 0 && (
        <div className="text-center py-12">
          <div className="text-sm">NO ATTESTATIONS FOUND</div>
          <div className="text-xs mt-2">
            {selectedSchema !== 'all'
              ? 'NO ATTESTATIONS FOR SELECTED SCHEMA'
              : 'NO ATTESTATIONS AVAILABLE'}
          </div>
        </div>
      )}

      {/* Attestations List */}
      {!isLoadingAttestations && filteredAttestations.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground italic">
            {filteredAttestations.length} matching attestations
          </p>

          {filteredAttestations.map((item) => (
            <AttestationCard
              key={item.uid}
              uid={item.uid}
              onClick={() => {
                pushBreadcrumb()
                router.push(`/attestations/${item.uid}`)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
