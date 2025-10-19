'use client'

import Clarity from '@microsoft/clarity'
import { PonderProvider } from '@ponder/react'
import { QueryClientProvider } from '@tanstack/react-query'
import PlausibleProvider from 'next-plausible'
import React from 'react'
import { WagmiProvider } from 'wagmi'

import { ponderClient } from '@/lib/ponder'
import { makeQueryClient } from '@/lib/query'
import { config } from '@/lib/wagmi'

import { Toaster } from './toasts/Toaster'
import { WalletConnectionProvider } from './WalletConnectionProvider'

Clarity.init('tjxevwhvhb')

const queryClient = makeQueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <PlausibleProvider domain="en0va.xyz" taggedEvents trackOutboundLinks>
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
    </PlausibleProvider>
  )
}
