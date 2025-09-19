'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { Hex, WatchContractEventOnLogsFn, keccak256, stringToBytes } from 'viem'
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWatchContractEvent,
} from 'wagmi'

import {
  easAbi,
  easAddress,
  wavsIndexerAbi,
  wavsIndexerConfig,
} from '@/lib/contracts'
import { SchemaKey, SchemaManager } from '@/lib/schemas'
import { txToast } from '@/lib/tx'
import { localChain } from '@/lib/wagmi'
import { attestationKeys } from '@/queries/attestation'

interface NewAttestationData {
  schema: SchemaKey | Hex
  recipient: string
  data: Record<string, string | boolean>
}

const ATTESTATION_HASH = keccak256(stringToBytes('attestation'))
console.log({ ATTESTATION_HASH })

export function useAttestation() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()

  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<Error | null>(null)
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
    enabled: chainId === localChain.id,
  })

  const createAttestation = async (attestationData: NewAttestationData) => {
    if (!isConnected) {
      throw new Error('Please connect your wallet')
    }

    if (chainId !== localChain.id) {
      throw new Error(
        `Please switch to the local network (chain ID ${localChain.id})`
      )
    }

    const schemaUid = attestationData.schema.startsWith('0x')
      ? (attestationData.schema as Hex)
      : SchemaManager.schemaForKey(attestationData.schema).uid

    setIsLoading(true)
    setIsSuccess(false)
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
            expirationTime: BigInt(0),
            revocable: true,
            refUID:
              '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
            data: encodedData,
            value: BigInt(0),
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
            gas: (gasEstimate * BigInt(120)) / BigInt(100),
            gasPrice: gasPrice,
            nonce,
            type: 'legacy',
          },
          onTransactionSent: setHash,
          successMessage: 'Attestation created!',
        })

        console.log(`✅ Transaction confirmed: ${receipt.transactionHash}`)

        setIsSuccess(true)
      }

      // Execute transaction with retry logic
      try {
        await executeTransaction()
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message.toLowerCase() : ''

        // Don't retry if user rejected the transaction
        if (
          errorMessage.includes('user rejected') ||
          errorMessage.includes('user denied')
        ) {
          throw error
        }

        // Check if we should retry (actual nonce conflicts or Anvil errors)
        const shouldRetry =
          errorMessage.includes('nonce too low') ||
          errorMessage.includes('nonce too high') ||
          errorMessage.includes('transaction underpriced') ||
          errorMessage.includes('replacement transaction underpriced') ||
          errorMessage.includes('internal json-rpc error') ||
          errorMessage.includes('internal error')

        if (shouldRetry) {
          console.warn(
            'Transaction failed, retrying with fresh nonce:',
            errorMessage
          )

          // Test Anvil responsiveness for internal errors
          if (errorMessage.includes('internal')) {
            try {
              await publicClient!.getBlockNumber()
              await new Promise((resolve) => setTimeout(resolve, 1000))
            } catch (nodeErr) {
              throw new Error(
                'Anvil node appears unresponsive. Please restart anvil and try again.'
              )
            }
          }

          // Retry once with fresh nonce
          await executeTransaction(1)
        } else {
          throw error
        }
      }
    } catch (err) {
      console.error('Error creating attestation:', err)
      setError(err instanceof Error ? err : new Error(String(err)))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createAttestation,
    isLoading,
    isSuccess,
    error,
    hash,
    isConnected,
    userAddress: address,
  }
}
