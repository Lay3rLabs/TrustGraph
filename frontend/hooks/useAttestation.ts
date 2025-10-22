'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { Hex, WatchContractEventOnLogsFn, keccak256, stringToBytes } from 'viem'
import { useAccount, usePublicClient, useWatchContractEvent } from 'wagmi'

import { intoAttestationData, intoAttestationsData } from '@/lib/attestation'
import {
  easAbi,
  easAddress,
  wavsIndexerAbi,
  wavsIndexerConfig,
} from '@/lib/contracts'
import { parseErrorMessage, shouldRetryTxError } from '@/lib/error'
import { SchemaKey, SchemaManager } from '@/lib/schemas'
import { txToast } from '@/lib/tx'
import { attestationKeys } from '@/queries/attestation'

interface NewAttestationData {
  schema: SchemaKey | Hex
  recipient: string
  data: Record<string, string | boolean>
}

const ATTESTATION_HASH = keccak256(stringToBytes('attestation'))

export function useAttestation() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()

  const [isCreating, setIsCreating] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)
  const [isCreated, setIsCreated] = useState(false)
  const [isRevoked, setIsRevoked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hash, setHash] = useState<`0x${string}` | null>(null)

  // Watch for EventIndexed events with eventType "attestation"
  const handleEventIndexed: WatchContractEventOnLogsFn<typeof wavsIndexerAbi> =
    useCallback(
      ([event]) => {
        if (
          event.eventName === 'EventIndexed' &&
          event.args.eventType === ATTESTATION_HASH
        ) {
          console.log(
            '🔍 EventIndexed event detected for attestation - invalidating queries'
          )
          queryClient.invalidateQueries({ queryKey: attestationKeys.all })
        }
      },
      [queryClient]
    )

  useWatchContractEvent({
    ...wavsIndexerConfig,
    eventName: 'EventIndexed',
    onLogs: handleEventIndexed,
  })

  const createAttestation = async (attestationData: NewAttestationData) => {
    if (!isConnected) {
      throw new Error('Please connect your wallet')
    }

    const schemaUid = attestationData.schema.startsWith('0x')
      ? (attestationData.schema as Hex)
      : SchemaManager.schemaForKey(attestationData.schema).uid

    setIsCreating(true)
    setIsCreated(false)
    setError(null)
    setHash(null)

    try {
      // Validate input formats
      if (!schemaUid.startsWith('0x') || schemaUid.length !== 66) {
        throw new Error(`Invalid schema format: ${attestationData.schema}`)
      }
      if (
        !attestationData.recipient.startsWith('0x') ||
        attestationData.recipient.length !== 42
      ) {
        throw new Error(
          `Invalid recipient address format: ${attestationData.recipient}`
        )
      }

      const encodedData = SchemaManager.encode(schemaUid, attestationData.data)

      // Helper function to execute transaction with fresh nonce
      const executeTransaction = async (retryCount = 0): Promise<void> => {
        const nonce = await publicClient!.getTransactionCount({
          address: address!,
          blockTag: retryCount === 0 ? 'pending' : 'latest',
        })

        const attestationRequest = {
          schema: schemaUid,
          data: {
            recipient: attestationData.recipient as `0x${string}`,
            expirationTime: 0n,
            revocable: true,
            refUID:
              '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
            data: encodedData,
            value: 0n,
          },
        }

        // Estimate gas and simulate
        const gasEstimate = await publicClient!.estimateContractGas({
          address: easAddress,
          abi: easAbi,
          functionName: 'attest',
          args: [attestationRequest],
          account: address!,
        })

        await publicClient!.simulateContract({
          address: easAddress as `0x${string}`,
          abi: easAbi,
          functionName: 'attest',
          args: [attestationRequest],
          account: address!,
        })

        const gasPrice = await publicClient!.getGasPrice()

        const [receipt] = await txToast({
          tx: {
            address: easAddress as `0x${string}`,
            abi: easAbi,
            functionName: 'attest',
            args: [attestationRequest],
            gas: (gasEstimate * 120n) / 100n,
            gasPrice: gasPrice,
            nonce,
            type: 'legacy',
          },
          onTransactionSent: setHash,
          successMessage: 'Attestation created!',
        })

        console.log(`✅ Transaction confirmed: ${receipt.transactionHash}`)

        setIsCreated(true)
      }

      // Execute transaction with retry logic
      try {
        await executeTransaction()
      } catch (error) {
        if (shouldRetryTxError(error)) {
          console.warn('Transaction failed, retrying with fresh nonce:', error)
          // Retry once with fresh nonce
          await executeTransaction(1)
        } else {
          throw error
        }
      }
    } catch (err) {
      console.error('Error creating attestation:', err)
      setError(parseErrorMessage(err))
      throw err
    } finally {
      setIsCreating(false)
    }
  }

  const clearTransactionState = useCallback(() => {
    setIsCreated(false)
    setIsRevoked(false)
    setError(null)
    setHash(null)
  }, [])

  const revokeAttestation = async (uid: Hex, schemaUid: Hex) => {
    if (!isConnected) {
      throw new Error('Please connect your wallet')
    }

    setIsRevoking(true)
    setIsRevoked(false)
    setError(null)
    setHash(null)

    try {
      // Validate input formats
      if (!uid.startsWith('0x') || uid.length !== 66) {
        throw new Error(`Invalid attestation UID format: ${uid}`)
      }
      if (!schemaUid.startsWith('0x') || schemaUid.length !== 66) {
        throw new Error(`Invalid schema UID format: ${schemaUid}`)
      }

      // Helper function to execute transaction with fresh nonce
      const executeTransaction = async (retryCount = 0): Promise<void> => {
        const nonce = await publicClient!.getTransactionCount({
          address: address!,
          blockTag: retryCount === 0 ? 'pending' : 'latest',
        })

        const revocationRequest = {
          schema: schemaUid,
          data: {
            uid: uid,
            value: 0n,
          },
        }

        // Estimate gas and simulate
        const gasEstimate = await publicClient!.estimateContractGas({
          address: easAddress,
          abi: easAbi,
          functionName: 'revoke',
          args: [revocationRequest],
          account: address!,
        })

        await publicClient!.simulateContract({
          address: easAddress as `0x${string}`,
          abi: easAbi,
          functionName: 'revoke',
          args: [revocationRequest],
          account: address!,
        })

        const gasPrice = await publicClient!.getGasPrice()

        const [receipt] = await txToast({
          tx: {
            address: easAddress as `0x${string}`,
            abi: easAbi,
            functionName: 'revoke',
            args: [revocationRequest],
            gas: (gasEstimate * 120n) / 100n,
            gasPrice: gasPrice,
            nonce,
            type: 'legacy',
          },
          onTransactionSent: setHash,
          successMessage: 'Attestation revoked!',
        })

        console.log(`✅ Transaction confirmed: ${receipt.transactionHash}`)

        setIsRevoked(true)

        // Invalidate queries to refresh the attestation data
        queryClient.invalidateQueries({ queryKey: attestationKeys.all })
      }

      // Execute transaction with retry logic
      try {
        await executeTransaction()
      } catch (error) {
        if (shouldRetryTxError(error)) {
          console.warn('Transaction failed, retrying with fresh nonce:', error)
          // Retry once with fresh nonce
          await executeTransaction(1)
        } else {
          throw error
        }
      }
    } catch (err) {
      console.error('Error revoking attestation:', err)
      setError(parseErrorMessage(err))
      throw err
    } finally {
      setIsRevoking(false)
    }
  }

  return {
    createAttestation,
    revokeAttestation,
    clearTransactionState,
    isCreating,
    isRevoking,
    isLoading: isCreating || isRevoking,
    isCreated,
    isRevoked,
    isSuccess: isCreated || isRevoked,
    error,
    hash,
    isConnected,
    userAddress: address,
  }
}

export const useIntoAttestationData = () => useCallback(intoAttestationData, [])
export const useIntoAttestationsData = () =>
  useCallback(intoAttestationsData, [])
