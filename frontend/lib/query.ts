import { QueryClient } from '@tanstack/react-query'
import { hashFn } from 'wagmi/query'

export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time for blockchain data - keep fresh for 30 seconds
        staleTime: 30 * 1000,
        // Cache blockchain data for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry on failure (network issues common in blockchain apps)
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch right away on page load.
        refetchOnMount: true,
        // Refetch on window focus for real-time blockchain data
        refetchOnWindowFocus: true,
        // Serialize BigInts in parameters
        queryKeyHashFn: hashFn,
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
      },
    },
  })
