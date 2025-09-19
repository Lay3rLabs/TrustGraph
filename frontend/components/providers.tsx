'use client'

import { PonderProvider } from '@ponder/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { WagmiProvider } from 'wagmi'
import { hashFn } from 'wagmi/query'

import { ponderClient } from '@/lib/ponder'
import { config } from '@/lib/wagmi'

import { Toaster } from './toasts/Toaster'
import { WalletConnectionProvider } from './WalletConnectionProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time for blockchain data - keep fresh for 30 seconds
      staleTime: 30 * 1000,
      // Cache blockchain data for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry on failure (network issues common in blockchain apps)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="min-h-screen bg-black" />
  }

  return (
    <WagmiProvider config={config}>
      <PonderProvider client={ponderClient}>
        <QueryClientProvider client={queryClient}>
          <WalletConnectionProvider>
            {children}

            <Toaster />

            {/* {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )} */}
          </WalletConnectionProvider>
        </QueryClientProvider>
      </PonderProvider>
    </WagmiProvider>
  )
}
