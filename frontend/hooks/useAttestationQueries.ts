'use client'

import { APIS } from '@/lib/config'
import { attestationQueries } from '@/queries/attestation'
import { attestationPonderQueries } from '@/queries/attestation-ponder'

/**
 * Adaptive hook that switches between RPC and Ponder attestation queries
 * based on configuration and availability
 */
export function useAttestationQueries() {
  // Use Ponder if it's configured and available, otherwise fall back to RPC
  const usePonder = Boolean(APIS.ponder)

  if (usePonder) {
    return {
      ...attestationPonderQueries,
      source: 'ponder' as const,
    }
  }

  return {
    ...attestationQueries,
    source: 'rpc' as const,
  }
}

/**
 * Hook to get the current data source being used for attestations
 */
export function useAttestationDataSource() {
  const usePonder = Boolean(APIS.ponder)
  return usePonder ? 'ponder' : 'rpc'
}

/**
 * Hook to check if Ponder is available for attestation queries
 */
export function useIsPonderAvailable() {
  return Boolean(APIS.ponder)
}
