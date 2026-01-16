'use client'

import Clarity from '@microsoft/clarity'
import { PonderProvider } from '@ponder/react'
import { QueryClientProvider } from '@tanstack/react-query'
import PlausibleProvider from 'next-plausible'
import React from 'react'
import { WagmiProvider } from 'wagmi'

import { ponderClient } from '@/lib/ponder'
import { makeQueryClient } from '@/lib/query'
import { makeWagmiConfig } from '@/lib/wagmi'

import { BreadcrumbSync } from './BreadcrumbSync'
import { Toaster } from './toasts/Toaster'
import { WalletConnectionProvider } from './WalletConnectionProvider'

Clarity.init('tjxevwhvhb')

const queryClient = makeQueryClient()
const wagmiConfig = makeWagmiConfig()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PlausibleProvider
      domain="trustgraph.network"
      taggedEvents
      trackOutboundLinks
    >
      <WagmiProvider config={wagmiConfig}>
        <PonderProvider client={ponderClient}>
          <QueryClientProvider client={queryClient}>
            <WalletConnectionProvider>
              {children}

              <Toaster />
              <BreadcrumbSync />

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
