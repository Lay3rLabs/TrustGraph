'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAccount } from 'wagmi'

import { useAttestation } from '@/hooks/useAttestation'
import { useAttestationQueries } from '@/hooks/useAttestationQueries'
import { AttestationData, SchemaManager } from '@/lib/schemas'
import { formatTimeAgo } from '@/lib/utils'

import { AttestationDataDisplay } from './AttestationData'
import { Card } from './Card'
import { CopyableText } from './CopyableText'

interface AttestationCardProps {
  uid: `0x${string}`
  onClick?: () => void
  clickable?: boolean
}

export function AttestationCard({
  uid,
  onClick,
  clickable = false,
}: AttestationCardProps) {
  const { address } = useAccount()
  const { revokeAttestation, isLoading: isRevoking } = useAttestation()
  const [isRevokingThis, setIsRevokingThis] = useState(false)

  const attestationQueries = useAttestationQueries()
  const {
    data: attestation,
    isLoading,
    error,
  } = useQuery(attestationQueries.get(uid))

  const handleRevoke = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click when revoking
    if (!attestation) return

    setIsRevokingThis(true)
    try {
      await revokeAttestation(uid, attestation.schema as `0x${string}`)
      toast.success('Attestation revoked successfully!')
    } catch (err) {
      console.error('Failed to revoke attestation:', err)
      toast.error(
        err instanceof Error ? err.message : 'Failed to revoke attestation'
      )
    } finally {
      setIsRevokingThis(false)
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toISOString().replace('T', ' ').split('.')[0]
  }

  const getAttestationStatus = (attestation: AttestationData) => {
    if (Number(attestation.revocationTime) > 0) {
      return {
        status: 'revoked',
        color: 'text-red-600 bg-red-50 border-red-200',
      }
    }
    if (
      Number(attestation.expirationTime) > 0 &&
      Number(attestation.expirationTime) < Math.floor(Date.now() / 1000)
    ) {
      return {
        status: 'expired',
        color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
      }
    }
    return {
      status: 'verified',
      color: 'text-green-700 bg-green-50 border-green-200',
    }
  }

  if (isLoading) {
    return (
      <Card type="primary" size="lg">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-muted-foreground text-lg">◆</span>
              <div>
                <h3 className="font-semibold text-base">Attestation</h3>
                <div className="text-muted-foreground text-sm">Loading...</div>
              </div>
            </div>
            <div className="text-muted-foreground text-xs">Loading</div>
          </div>
          <div className="text-muted-foreground text-xs font-mono">
            UID: {uid}
          </div>
          <div className="text-muted-foreground text-sm">
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
        className="border-destructive/50 bg-destructive/10"
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-destructive text-lg">◆</span>
              <div>
                <h3 className="font-semibold text-base">Attestation</h3>
                <div className="text-muted-foreground text-sm">
                  Failed to load
                </div>
              </div>
            </div>
            <div className="text-destructive text-xs font-medium">Error</div>
          </div>
          <div className="text-muted-foreground text-xs font-mono">
            UID: {uid}
          </div>
          <div className="text-destructive text-sm">
            Failed to load attestation: {error.message}
          </div>
        </div>
      </Card>
    )
  }

  if (!attestation) {
    return (
      <Card type="primary" size="lg" className="border-yellow-200 bg-yellow-50">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <h3 className="font-semibold text-base">Attestation</h3>
                <div className="text-muted-foreground text-sm">
                  No data found
                </div>
              </div>
            </div>
            <div className="text-yellow-700 text-xs font-medium">Not Found</div>
          </div>
          <div className="text-muted-foreground text-xs font-mono">
            UID: {uid}
          </div>
          <div className="text-muted-foreground text-sm">
            Attestation not found or invalid UID
          </div>
        </div>
      </Card>
    )
  }

  const statusInfo = getAttestationStatus(attestation)
  const schemaName =
    SchemaManager.maybeSchemaForUid(attestation.schema)?.name || 'Unknown'

  // Check if current user is the attester and attestation is not already revoked
  const canRevoke =
    address &&
    address.toLowerCase() === attestation.attester.toLowerCase() &&
    Number(attestation.revocationTime) === 0

  return (
    <Card
      type="primary"
      size="lg"
      className={
        clickable
          ? 'cursor-pointer hover:border-foreground/50 transition-colors'
          : ''
      }
      onClick={clickable ? onClick : undefined}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold text-base">{schemaName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1 border rounded-md text-xs font-medium ${statusInfo.color}`}
            >
              {statusInfo.status.charAt(0).toUpperCase() +
                statusInfo.status.slice(1)}
            </div>
            {canRevoke && (
              <button
                onClick={handleRevoke}
                disabled={isRevokingThis}
                className="px-3 py-1 border border-red-200 bg-red-50 text-red-700 rounded-md text-xs font-medium hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRevokingThis ? 'Revoking...' : 'Revoke'}
              </button>
            )}
          </div>
        </div>

        {/* Attestation Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs font-medium mb-1">
              Attestation UID
            </div>
            <CopyableText text={uid} className="text-foreground" />
          </div>
          <div>
            <div className="text-muted-foreground text-xs font-medium mb-1">
              Timestamp
            </div>
            <div className="text-foreground text-xs">
              {formatTimestamp(Number(attestation.time))} (
              {formatTimeAgo(Number(attestation.time) * 1e3)})
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs font-medium mb-1">
              Attester
            </div>
            <CopyableText
              text={attestation.attester}
              className="text-foreground"
            />
          </div>
          <div>
            <div className="text-muted-foreground text-xs font-medium mb-1">
              Recipient
            </div>
            <CopyableText
              text={attestation.recipient}
              className="text-foreground"
            />
          </div>
          <div>
            <div className="text-muted-foreground text-xs font-medium mb-1">
              Schema UID
            </div>
            <CopyableText
              text={attestation.schema}
              className="text-foreground"
            />
          </div>
          {attestation.refUID &&
            attestation.refUID !==
              '0x0000000000000000000000000000000000000000000000000000000000000000' && (
              <div>
                <div className="text-muted-foreground text-xs font-medium mb-1">
                  Reference UID
                </div>
                <CopyableText
                  text={attestation.refUID}
                  className="text-foreground"
                />
              </div>
            )}
          {Number(attestation.expirationTime) > 0 && (
            <div>
              <div className="text-muted-foreground text-xs font-medium mb-1">
                Expiration
              </div>
              <div className="text-foreground text-xs">
                {formatTimestamp(Number(attestation.expirationTime))}
              </div>
            </div>
          )}
        </div>

        {/* Attestation Data Display */}
        <AttestationDataDisplay attestation={attestation} />

        {/* Additional Status Messages */}
        {Number(attestation.revocationTime) > 0 && (
          <div className="border border-red-200 bg-red-50 p-3 rounded-md">
            <div className="text-red-700 text-sm font-medium">
              ⚠️ Revoked: {formatTimestamp(Number(attestation.revocationTime))}
            </div>
          </div>
        )}

        {Number(attestation.expirationTime) > 0 &&
          Number(attestation.expirationTime) <
            Math.floor(Date.now() / 1000) && (
            <div className="border border-yellow-200 bg-yellow-50 p-3 rounded-md">
              <div className="text-yellow-700 text-sm font-medium">
                ⚠️ Expired:{' '}
                {formatTimestamp(Number(attestation.expirationTime))}
              </div>
            </div>
          )}
      </div>
    </Card>
  )
}
