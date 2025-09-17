'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAccount, useChainId, usePublicClient } from 'wagmi'

import { easAbi, easAddress } from '@/lib/contracts'
import { encodeAttestationData } from '@/lib/schemas'
import { txToast } from '@/lib/tx'
import { localChain } from '@/lib/wagmi'

import { attestationKeys } from './useIndexer'

interface NewAttestationData {
  schema: string
  recipient: string
  data: Record<string, string>
}

export function useAttestation() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()

  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hash, setHash] = useState<`0x${string}` | null>(null)

  const createAttestation = async (attestationData: NewAttestationData) => {
    if (!isConnected) {
      throw new Error('Please connect your wallet')
    }

    if (chainId !== localChain.id) {
      throw new Error(
        `Please switch to the local network (chain ID ${localChain.id})`
      )
    }

    setIsLoading(true)
    setIsSuccess(false)
    setError(null)
    setHash(null)

    try {
      // Validate input formats
      if (
        !attestationData.schema.startsWith('0x') ||
        attestationData.schema.length !== 66
      ) {
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

      const encodedData = encodeAttestationData(
        attestationData.schema,
        attestationData.data
      )

      // Helper function to execute transaction with fresh nonce
      const executeTransaction = async (retryCount = 0): Promise<void> => {
        const nonce = await publicClient!.getTransactionCount({
          address: address!,
          blockTag: retryCount === 0 ? 'pending' : 'latest',
        })

        const attestationRequest = {
          schema: attestationData.schema as `0x${string}`,
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

        // Invalidate all attestation-related queries to refresh the data
        queryClient.invalidateQueries({ queryKey: attestationKeys.all })

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
