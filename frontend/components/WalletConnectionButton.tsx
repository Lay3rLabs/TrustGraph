'use client'

import clsx from 'clsx'
import { Check, Copy, LoaderCircle, LogOut, Wallet } from 'lucide-react'
import { usePlausible } from 'next-plausible'
import type React from 'react'
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAccount, useBalance, useConnect, useDisconnect } from 'wagmi'

import { testAddress } from '@/lib/contracts'
import { parseErrorMessage } from '@/lib/error'
import { formatBigNumber } from '@/lib/utils'

import { Popup } from './Popup'
import { EthIcon } from './tokens/EthIcon'
import { UsdcIcon } from './tokens/UsdcIcon'

export interface WalletConnectionButtonProps {
  className?: string
}

export const WalletConnectionButton = ({
  className,
}: WalletConnectionButtonProps) => {
  const { address, isConnected } = useAccount()
  const { connectors, connectAsync, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const plausible = usePlausible()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 5)}..${addr.slice(-3)}`
  }

  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) {
      return
    }
    const timeout = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timeout)
  }, [copied])
  const CopyIcon = copied ? Check : Copy

  const setOpenRef = useRef<Dispatch<SetStateAction<boolean>> | null>(null)

  // Use mock USDC for collateral balance
  const { data: usdcBalance, isLoading: isLoadingUsdcBalance } = useBalance({
    address: address,
    token: testAddress,
    query: {
      enabled: !!address,
      refetchInterval: 30_000,
    },
  })
  const { data: ethBalance, isLoading: isLoadingEthBalance } = useBalance({
    address: address,
    query: {
      enabled: !!address,
      refetchInterval: 30_000,
    },
  })

  return (
    <>
      <Popup
        position="left"
        setOpenRef={setOpenRef}
        popupPadding={24}
        popupClassName={isConnected ? '!p-3' : '!p-2'}
        sideOffset={4}
        wrapperClassName={className}
        trigger={{
          type: 'custom',
          Renderer: ({ onClick, open }) => (
            <button
              onClick={onClick}
              className={clsx(
                'flex items-center gap-2.5 rounded-full transition-all hover:shadow-sm px-4 sm:px-5 text-sm text-foreground h-10 sm:h-12 border',
                open
                  ? 'bg-card shadow-sm border-primary/20'
                  : 'bg-card hover:bg-secondary border-border'
              )}
            >
              {isConnecting ? (
                <LoaderCircle
                  size={20}
                  className="animate-spin text-muted-foreground"
                />
              ) : (
                <Wallet className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="hidden sm:block">
                {isConnected && address
                  ? formatAddress(address)
                  : isConnecting
                  ? 'Connecting...'
                  : 'Connect'}
              </span>
            </button>
          ),
        }}
      >
        {isConnected && address ? (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex flex-col gap-2 bg-secondary p-3 rounded-md border border-border">
              <p className="text-xs text-muted-foreground font-medium mb-1">
                Base Network Balances
              </p>

              <div className="flex flex-row items-center gap-2 pl-2">
                <EthIcon className="w-5 h-5" />
                <p className="text-foreground font-medium">
                  {isLoadingEthBalance
                    ? '...'
                    : ethBalance
                    ? formatBigNumber(ethBalance.value, ethBalance.decimals)
                    : '?'}{' '}
                  <span className="text-muted-foreground">
                    {ethBalance?.symbol}
                  </span>
                </p>
              </div>

              <div className="flex flex-row items-center gap-2 pl-2">
                <UsdcIcon className="w-5 h-5" />
                <p className="text-foreground font-medium">
                  {isLoadingUsdcBalance
                    ? '...'
                    : usdcBalance
                    ? formatBigNumber(usdcBalance.value, usdcBalance.decimals)
                    : '?'}{' '}
                  <span className="text-muted-foreground">
                    {usdcBalance?.symbol}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <button
                className="flex flex-row items-center gap-3 p-2 rounded-md bg-transparent text-foreground transition-all hover:bg-secondary active:bg-muted"
                onClick={(e) => {
                  navigator.clipboard.writeText(address)
                  setCopied(true)
                  // Don't close the popup. Updating the copied state causes this to re-render, which causes the original event target to no longer be contained by the popup, which causes the popup to close.
                  e.stopPropagation()
                }}
              >
                <CopyIcon className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm">Copy address</p>
              </button>

              <button
                className="flex flex-row items-center gap-3 p-2 rounded-md bg-transparent transition-all hover:bg-destructive/10 active:bg-destructive/15"
                onClick={() => {
                  setOpenRef.current?.(false)
                  // Wait for the popup to close before disconnecting to avoid flickering as the popup classes change.
                  setTimeout(() => disconnect(), 200)
                }}
              >
                <LogOut className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive">Disconnect</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {connectors && connectors.length > 0 ? (
              <div className="flex flex-col gap-1 text-sm">
                {connectors.map((connector) => (
                  <button
                    key={connector.id}
                    className="flex flex-row gap-2 p-2 rounded-md bg-transparent text-foreground transition-all hover:bg-secondary active:bg-muted"
                    onClick={() => {
                      // Close the popup as connection begins.
                      setOpenRef.current?.(false)

                      plausible('wallet_connect', {
                        props: {
                          wallet: connector.id,
                        },
                      })

                      // Start connection.
                      connectAsync({ connector }).catch((err) => {
                        console.error('Connection errored:', err)
                        toast.error(parseErrorMessage(err))
                        // Reopen the popup on error.
                        setOpenRef.current?.(true)
                      })
                    }}
                    disabled={isConnecting}
                  >
                    {connector.icon ? (
                      <img
                        alt={connector.name}
                        src={connector.icon}
                        className="!w-5 !h-5"
                      />
                    ) : (
                      <Wallet className="w-5 h-5" />
                    )}
                    <p>{connector.name}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                No wallets detected.
              </div>
            )}
          </div>
        )}
      </Popup>
    </>
  )
}
