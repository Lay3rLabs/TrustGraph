'use client'

import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import {
  ArrowRightLeft,
  Check,
  Copy,
  LoaderCircle,
  LogOut,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { usePlausible } from 'next-plausible'
import type React from 'react'
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAccount, useBalance, useConnect, useDisconnect } from 'wagmi'

import { erc20Address } from '@/lib/contracts'
import { parseErrorMessage } from '@/lib/error'
import { formatBigNumber } from '@/lib/utils'
import { pointsQueries } from '@/queries/points'

import { EthIcon } from './icons/EthIcon'
import { PointsIcon } from './icons/PointsIcon'
import { UsdcIcon } from './icons/UsdcIcon'
import { Popup } from './Popup'

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

  const { data: { total: totalPoints = 0 } = {}, isLoading: isLoadingPoints } =
    useQuery({
      ...pointsQueries.points(address || '0x0'),
      enabled: !!address,
      refetchInterval: 30_000,
    })

  const { data: usdcBalance, isLoading: isLoadingUsdcBalance } = useBalance({
    address: address,
    token: erc20Address,
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

  // Open popup on successful connection.
  useEffect(() => {
    if (isConnected) {
      setOpenRef.current?.(true)
    }
  }, [isConnected])

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
                'flex items-center gap-2.5 rounded-full transition-[background-color,box-shadow] hover:shadow-lg px-4 sm:px-5 text-sm text-primary-foreground h-10 sm:h-12',
                open
                  ? 'bg-popover-foreground'
                  : 'bg-popover-foreground/30 hover:bg-popover-foreground/40'
              )}
            >
              {isConnecting ? (
                <LoaderCircle
                  size={20}
                  className="animate-spin text-primary-foreground/80"
                />
              ) : (
                <Wallet className="w-5 h-5 text-primary-foreground/80" />
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
            <Link
              href="/points"
              className="flex flex-row items-center gap-2 pl-5 p-2 rounded-sm bg-primary text-primary-foreground transition-colors hover:bg-primary/70 active:bg-primary/90 -m-1.5"
            >
              <PointsIcon className="w-5 h-5 text-green" />
              <span className="">
                {isLoadingPoints ? '...' : formatBigNumber(totalPoints)} points
              </span>
            </Link>

            <div className="flex flex-col gap-2 bg-primary p-3 rounded-sm -mx-1.5">
              <p className="text-xs text-primary-foreground/60 font-medium mb-1">
                Base Network Balances
              </p>

              <div className="flex flex-row items-center gap-2 pl-2">
                <EthIcon className="w-5 h-5" />
                <p>
                  {isLoadingEthBalance
                    ? '...'
                    : ethBalance
                    ? formatBigNumber(ethBalance.value, ethBalance.decimals)
                    : '?'}{' '}
                  {ethBalance?.symbol}
                </p>
              </div>

              <div className="flex flex-row items-center gap-2 pl-2">
                <UsdcIcon className="w-5 h-5" />
                <p>
                  {isLoadingUsdcBalance
                    ? '...'
                    : usdcBalance
                    ? formatBigNumber(usdcBalance.value, usdcBalance.decimals)
                    : '?'}{' '}
                  {usdcBalance?.symbol}
                </p>
              </div>
            </div>

            <div className="flex flex-col">
              <a
                href="https://superbridge.app/base"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-row items-center gap-3 p-2 rounded-sm bg-transparent text-primary-foreground transition-colors hover:bg-primary/70 active:bg-primary/90"
              >
                <ArrowRightLeft className="w-4 h-4 text-primary-foreground/80" />
                <p>Bridge to Base</p>
              </a>

              <button
                className="flex flex-row items-center gap-3 p-2 rounded-sm bg-transparent text-primary-foreground transition-colors hover:bg-primary/70 active:bg-primary/90"
                onClick={(e) => {
                  navigator.clipboard.writeText(address)
                  setCopied(true)
                  // Don't close the popup. Updating the copied state causes this to re-render, which causes the original event target to no longer be contained by the popup, which causes the popup to close.
                  e.stopPropagation()
                }}
              >
                <CopyIcon className="w-4 h-4 text-primary-foreground/80" />
                <p>Copy address</p>
              </button>

              <button
                className="flex flex-row items-center gap-3 p-2 rounded-sm bg-transparent text-primary-foreground transition-colors hover:bg-primary/70 active:bg-primary/90"
                onClick={() => {
                  setOpenRef.current?.(false)
                  // Wait for the popup to close before disconnecting to avoid flickering as the popup classes change.
                  setTimeout(() => disconnect(), 200)
                }}
              >
                <LogOut className="w-4 h-4 text-destructive-foreground" />
                <p className="text-destructive-foreground">Disconnect</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {connectors && connectors.length > 0 ? (
              <div className="flex flex-col text-sm">
                {connectors.map((connector) => (
                  <button
                    key={connector.id}
                    className="flex flex-row gap-2 p-2 rounded-sm bg-transparent text-primary-foreground transition-colors hover:bg-primary/70 active:bg-primary/90"
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
              <div className="terminal-dim text-xs">No wallets detected.</div>
            )}
          </div>
        )}
      </Popup>
    </>
  )
}
