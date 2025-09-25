'use client'

import { useQuery } from '@tanstack/react-query'

import { AttestationData, SchemaManager } from '@/lib/schemas'
import { formatTimeAgo } from '@/lib/utils'
import { attestationQueries } from '@/queries/attestation'

import { Card } from './Card'

interface AttestationCardProps {
  uid: `0x${string}`
}

export function AttestationCard({ uid }: AttestationCardProps) {
  const {
    data: attestation,
    isLoading,
    error,
  } = useQuery(attestationQueries.get(uid))

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toISOString().replace('T', ' ').split('.')[0]
  }

  const getAttestationStatus = (attestation: AttestationData) => {
    if (Number(attestation.revocationTime) > 0) {
      return { status: 'revoked', color: 'text-red-400' }
    }
    if (
      Number(attestation.expirationTime) > 0 &&
      Number(attestation.expirationTime) < Math.floor(Date.now() / 1000)
    ) {
      return { status: 'expired', color: 'text-yellow-400' }
    }
    return { status: 'verified', color: 'text-green-400' }
  }

  if (isLoading) {
    return (
      <Card type="primary" size="lg">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <span className="terminal-bright text-lg">◆</span>
              <div>
                <h3 className="terminal-bright text-base">ATTESTATION</h3>
                <div className="terminal-dim text-sm">Loading...</div>
              </div>
            </div>
            <div className="terminal-dim text-xs">LOADING</div>
          </div>
          <div className="terminal-dim text-xs">UID: {uid}</div>
          <div className="terminal-dim text-xs">
            Fetching attestation details from EAS contract...
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card
        type="primary"
        size="lg"
        className="border border-red-700 bg-red-900/10"
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-red-400 text-lg">◆</span>
              <div>
                <h3 className="terminal-bright text-base">ATTESTATION</h3>
                <div className="terminal-dim text-sm">Failed to load</div>
              </div>
            </div>
            <div className="text-red-400 text-xs">ERROR</div>
          </div>
          <div className="terminal-dim text-xs">UID: {uid}</div>
          <div className="terminal-text text-red-400 text-xs">
            Failed to load attestation: {error.message}
          </div>
        </div>
      </Card>
    )
  }

  if (!attestation) {
    return (
      <Card
        type="primary"
        size="lg"
        className="border border-yellow-700 bg-yellow-900/10"
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-yellow-400 text-lg">◆</span>
              <div>
                <h3 className="terminal-bright text-base">ATTESTATION</h3>
                <div className="terminal-dim text-sm">No data found</div>
              </div>
            </div>
            <div className="text-yellow-400 text-xs">NOT FOUND</div>
          </div>
          <div className="terminal-dim text-xs">UID: {uid}</div>
          <div className="terminal-dim text-xs">
            Attestation not found or invalid UID
          </div>
        </div>
      </Card>
    )
  }

  const statusInfo = getAttestationStatus(attestation)
  const schemaName =
    SchemaManager.maybeSchemaForUid(attestation.schema)?.name.toUpperCase() ||
    'UNKNOWN'

  return (
    <Card type="primary" size="lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <span className="terminal-bright text-lg">◆</span>
            <h3 className="terminal-bright text-base">{schemaName}</h3>
          </div>
          <div
            className={`px-3 py-1 border border-gray-700 rounded-sm text-xs ${statusInfo.color}`}
          >
            {statusInfo.status.toUpperCase()}
          </div>
        </div>

        {/* Attestation Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="terminal-dim text-xs mb-1">ATTESTATION UID</div>
            <div className="terminal-text font-mono text-xs break-all">
              {uid}
            </div>
          </div>
          <div>
            <div className="terminal-dim text-xs mb-1">TIMESTAMP</div>
            <div className="terminal-text text-xs">
              {formatTimestamp(Number(attestation.time))}
            </div>
          </div>
          <div>
            <div className="terminal-dim text-xs mb-1">ATTESTER</div>
            <div className="terminal-text font-mono text-xs break-all">
              {attestation.attester}
            </div>
          </div>
          <div>
            <div className="terminal-dim text-xs mb-1">RECIPIENT</div>
            <div className="terminal-text font-mono text-xs break-all">
              {attestation.recipient}
            </div>
          </div>
          <div>
            <div className="terminal-dim text-xs mb-1">SCHEMA UID</div>
            <div className="terminal-text font-mono text-xs break-all">
              {attestation.schema}
            </div>
          </div>
          {attestation.refUID &&
            attestation.refUID !==
              '0x0000000000000000000000000000000000000000000000000000000000000000' && (
              <div>
                <div className="terminal-dim text-xs mb-1">REFERENCE UID</div>
                <div className="terminal-text font-mono text-xs break-all">
                  {attestation.refUID}
                </div>
              </div>
            )}
          <div>
            <div className="terminal-dim text-xs mb-1">TIME AGO</div>
            <div className="terminal-text text-xs">
              {formatTimeAgo(Number(attestation.time) * 1e3)}
            </div>
          </div>
          {Number(attestation.expirationTime) > 0 && (
            <div>
              <div className="terminal-dim text-xs mb-1">EXPIRATION</div>
              <div className="terminal-text text-xs">
                {formatTimestamp(Number(attestation.expirationTime))}
              </div>
            </div>
          )}
          <div>
            <div className="terminal-dim text-xs mb-1">DATA</div>
            <div className="terminal-text text-xs">
              {JSON.stringify(attestation.decodedData)}
            </div>
          </div>
        </div>

        {/* Additional Status Messages */}
        {Number(attestation.revocationTime) > 0 && (
          <div className="border border-red-700 bg-red-900/10 p-3 rounded-sm">
            <div className="terminal-text text-red-400 text-xs">
              ⚠️ REVOKED: {formatTimestamp(Number(attestation.revocationTime))}
            </div>
          </div>
        )}

        {Number(attestation.expirationTime) > 0 &&
          Number(attestation.expirationTime) <
            Math.floor(Date.now() / 1000) && (
            <div className="border border-yellow-700 bg-yellow-900/10 p-3 rounded-sm">
              <div className="terminal-text text-yellow-400 text-xs">
                ⚠️ EXPIRED:{' '}
                {formatTimestamp(Number(attestation.expirationTime))}
              </div>
            </div>
          )}
      </div>
    </Card>
  )
}
