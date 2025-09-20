'use client'

import { useQuery } from '@tanstack/react-query'
import { useReadContract } from 'wagmi'

import { iWavsServiceManagerAddress } from '@/lib/contracts'

interface Operator {
  address: string
  weight: number
  status: 'active'
}

export function useOperators() {
  // Get total operator count
  const { data: operatorCount } = useReadContract({
    address: iWavsServiceManagerAddress,
    abi: [
      {
        inputs: [],
        name: 'getOperatorCount',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'getOperatorCount',
  })

  // Get service URI
  const { data: serviceURI } = useReadContract({
    address: iWavsServiceManagerAddress,
    abi: [
      {
        inputs: [],
        name: 'getServiceURI',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'getServiceURI',
  })

  // Get total weight
  const { data: totalWeight } = useReadContract({
    address: iWavsServiceManagerAddress,
    abi: [
      {
        inputs: [],
        name: 'getTotalWeight',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'getTotalWeight',
  })

  // Get operators data
  const {
    data: operatorsData,
    isLoading,
    error,
  } = useReadContract({
    address: iWavsServiceManagerAddress,
    abi: [
      {
        inputs: [
          { name: 'start', type: 'uint256' },
          { name: 'length', type: 'uint256' },
          { name: 'reverseOrder', type: 'bool' },
        ],
        name: 'getOperators',
        outputs: [
          { name: 'operators', type: 'address[]' },
          { name: 'weights', type: 'uint256[]' },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'getOperators',
    args: [0n, operatorCount || 0n, false],
    query: {
      enabled: !!operatorCount && operatorCount > 0n,
    },
  })

  const operators = useQuery({
    queryKey: [
      'operators',
      operatorsData
        ? {
            addresses: operatorsData[0],
            weights: operatorsData[1].map((w) => w.toString()),
          }
        : null,
    ],
    queryFn: async (): Promise<Operator[]> => {
      if (!operatorsData) return []

      const [addresses, weights] = operatorsData

      return addresses.map((address, index) => ({
        address,
        weight: Number(weights[index]),
        status: 'active' as const,
      }))
    },
    enabled: !!operatorsData,
  })

  return {
    operators: operators.data || [],
    operatorCount: Number(operatorCount || 0),
    totalWeight: Number(totalWeight || 0),
    serviceURI: serviceURI || '',
    isLoading: isLoading || operators.isLoading,
    error: error || operators.error,
  }
}
