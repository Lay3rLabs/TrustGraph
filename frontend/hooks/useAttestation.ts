'use client'

import { useEffect, useState } from 'react'
import { encodePacked, stringToHex } from 'viem'
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import { easAbi, easAddress } from '@/lib/contracts'
import { SCHEMA_OPTIONS } from '@/lib/schemas'
import { writeEthContractAndWait } from '@/lib/utils'
import { localChain } from '@/lib/wagmi'

interface AttestationData {
  schema: string
  recipient: string
  data: Record<string, string>
}

export function useAttestation() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const [isLoading, setIsLoading] = useState(false)

  const {
    data: hash,
    error,
    isPending,
  } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        console.log(`✅ Transaction submitted: ${hash}`)
      },
      onError: (error) => {
        console.error('Transaction failed:', error)
      },
    },
  })

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
    timeout: 60_000, // 60 second timeout
    pollingInterval: 1_000, // Poll every 1 second
  })

  // Transaction success logging
  useEffect(() => {
    if (isSuccess && receipt) {
      console.log(`✅ Transaction confirmed: ${receipt.transactionHash}`)
    }
  }, [isSuccess, receipt])

  useEffect(() => {
    if (error) {
      console.error('Transaction error:', error.message)
    }
  }, [error])

  useEffect(() => {
    if (receiptError) {
      console.error('Receipt error:', receiptError.message)
    }
  }, [receiptError])

  useEffect(() => {
    if (receipt && receipt.status === 'reverted') {
      console.error('Transaction was reverted!')
    }
  }, [receipt])

  // Manual transaction check when stuck in confirming state
  useEffect(() => {
    if (hash && isConfirming && publicClient && !isSuccess && !receiptError) {
      const timeoutId = setTimeout(async () => {
        try {
          await publicClient.getTransaction({
            hash: hash as `0x${string}`,
          })
          // Silent check - no logging unless there's an error
        } catch (err) {
          console.error('Manual transaction check failed:', err)
        }
      }, 10_000) // Check after 10 seconds of being stuck

      return () => clearTimeout(timeoutId)
    }
  }, [hash, isConfirming, publicClient, isSuccess, receiptError])

  const createAttestation = async (attestationData: AttestationData) => {
    if (!isConnected) {
      throw new Error('Please connect your wallet')
    }

    if (chainId !== localChain.id) {
      throw new Error(
        `Please switch to the local network (chain ID ${localChain.id})`
      )
    }

    // Declare variables in higher scope for retry logic
    let encodedData: `0x${string}` | undefined
    let gasEstimate: bigint | undefined

    try {
      setIsLoading(true)

      // Encode the attestation data as bytes based on schema type
      const schema = SCHEMA_OPTIONS.find(
        (s) => s.uid === attestationData.schema
      )
      if (!schema) {
        throw new Error(`Unknown schema: ${attestationData.schema}`)
      }

      // Ensure all data fields are present
      schema.fields.forEach((field) => {
        if (!(field.name in attestationData.data)) {
          throw new Error(`Missing field: ${field.name}`)
        }
      })

      // Encode the data fields based on schema type
      encodedData = encodePacked(
        schema.fields.map((field) => field.type),
        schema.fields.map((field) => {
          const value = attestationData.data[field.name]
          return field.type.startsWith('uint')
            ? BigInt(value)
            : field.type.startsWith('bytes')
            ? value.startsWith('0x')
              ? value
              : stringToHex(value)
            : value
        })
      )

      // Validate inputs before calling contract
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

      // Get current nonce for the account (important for local networks)
      const nonce = await publicClient!.getTransactionCount({
        address: address!,
        blockTag: 'pending', // Use pending to get the most up-to-date nonce
      })

      // Create the AttestationRequest struct for EAS
      const attestationRequest = {
        schema: attestationData.schema as `0x${string}`,
        data: {
          recipient: attestationData.recipient as `0x${string}`,
          expirationTime: BigInt(0), // No expiration
          revocable: true,
          refUID:
            '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
          data: encodedData,
          value: BigInt(0), // No ETH value
        },
      }

      // Estimate gas for the transaction
      try {
        gasEstimate = await publicClient!.estimateContractGas({
          address: easAddress,
          abi: easAbi,
          functionName: 'attest',
          args: [attestationRequest],
          account: address!,
        })

        // Try to simulate the contract call first to catch any revert issues
        await publicClient!.simulateContract({
          address: easAddress as `0x${string}`,
          abi: easAbi,
          functionName: 'attest',
          args: [attestationRequest],
          account: address!,
        })

        // Add gas price for local anvil - it requires explicit gas pricing
        const gasPrice = await publicClient!.getGasPrice()

        try {
          await writeEthContractAndWait({
            address: easAddress as `0x${string}`,
            abi: easAbi,
            functionName: 'attest',
            args: [attestationRequest],
            gas: (gasEstimate * BigInt(120)) / BigInt(100), // Add 20% buffer to gas estimate
            gasPrice: gasPrice, // Explicitly set gas price for anvil
            nonce, // Explicitly set nonce to prevent conflicts on local networks
            type: 'legacy',
          })
        } catch (writeError) {
          console.error('Transaction failed:', writeError)
          throw writeError
        }
      } catch (gasError) {
        console.error('Gas estimation or simulation failed:', gasError)

        // Check if this is a nonce error
        const errorMessage =
          gasError instanceof Error ? gasError.message.toLowerCase() : ''
        if (
          errorMessage.includes('nonce') ||
          errorMessage.includes('transaction underpriced')
        ) {
          throw new Error(`Nonce conflict detected: ${errorMessage}`)
        }

        // Check if this is an Anvil-specific error
        const isAnvilError =
          errorMessage.includes('internal json-rpc error') ||
          errorMessage.includes('internal error') ||
          errorMessage.includes('execution reverted')

        if (isAnvilError) {
          // Try a simple eth_blockNumber call to test Anvil responsiveness
          try {
            await publicClient!.getBlockNumber()
          } catch (nodeErr) {
            console.error('Anvil node appears unresponsive:', nodeErr)
            throw new Error(
              'Anvil node appears to be unresponsive. Please restart anvil and try again.'
            )
          }
        }

        throw new Error(
          `Transaction simulation failed: ${
            gasError instanceof Error ? gasError.message : 'Unknown error'
          }${isAnvilError ? ' (Anvil node issue detected)' : ''}`
        )
      }
    } catch (err) {
      console.error('Error creating attestation:', err)

      // Enhanced error handling for Anvil and nonce issues
      const errorMessage = err instanceof Error ? err.message.toLowerCase() : ''

      // Check for Anvil-specific errors first
      const isAnvilError =
        errorMessage.includes('internal json-rpc error') ||
        errorMessage.includes('internal error')

      if (isAnvilError && !errorMessage.includes('retry')) {
        try {
          // Test if Anvil is still responsive
          await publicClient!.getBlockNumber()

          // Wait a bit for Anvil to recover and try once more
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Get fresh nonce and retry
          const recoveryNonce = await publicClient!.getTransactionCount({
            address: address!,
            blockTag: 'latest',
          })

          if (encodedData !== undefined && gasEstimate !== undefined) {
            const gasPrice = await publicClient!.getGasPrice()

            // Recreate the attestation request for retry
            const retryAttestationRequest = {
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

            await writeEthContractAndWait({
              address: easAddress as `0x${string}`,
              abi: easAbi,
              functionName: 'attest',
              args: [retryAttestationRequest],
              gas: (gasEstimate * BigInt(120)) / BigInt(100),
              gasPrice: gasPrice,
              nonce: recoveryNonce,
              type: 'legacy',
            })
            return
          }
        } catch (recoveryErr) {
          console.error('Anvil recovery failed:', recoveryErr)
          throw new Error(
            'Anvil node error - please restart anvil and try again'
          )
        }
      }

      // Check for nonce-related errors
      if (
        (errorMessage.includes('nonce') ||
          errorMessage.includes('transaction underpriced')) &&
        !errorMessage.includes('retry') &&
        encodedData !== undefined &&
        gasEstimate !== undefined
      ) {
        try {
          // Get a fresh nonce and retry
          const freshNonce = await publicClient!.getTransactionCount({
            address: address!,
            blockTag: 'latest', // Use latest instead of pending for retry
          })

          const gasPrice = await publicClient!.getGasPrice()

          // Recreate the attestation request for final retry
          const finalRetryAttestationRequest = {
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

          await writeEthContractAndWait({
            address: easAddress as `0x${string}`,
            abi: easAbi,
            functionName: 'attest',
            args: [finalRetryAttestationRequest],
            gas: (gasEstimate * BigInt(120)) / BigInt(100),
            gasPrice: gasPrice,
            nonce: freshNonce, // Use fresh nonce for retry
            type: 'legacy',
          })
          return // Exit early on successful retry initiation
        } catch (retryErr) {
          console.error('Retry failed:', retryErr)
          throw new Error(
            `Transaction failed after nonce retry: ${
              retryErr instanceof Error ? retryErr.message : 'Unknown error'
            }`
          )
        }
      }

      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createAttestation,
    isLoading: isLoading || isPending || isConfirming,
    isSuccess,
    error,
    hash,
    isConnected,
    userAddress: address,
  }
}
