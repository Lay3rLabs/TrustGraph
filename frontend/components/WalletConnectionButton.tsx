'use client'

import clsx from 'clsx'
import { Check, Copy, LoaderCircle, LogOut, Wallet } from 'lucide-react'
import type React from 'react'
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

import { parseErrorMessage } from '@/lib/error'

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

  return (
    <>
      <Popup
        position={isConnected ? 'same' : 'left'}
        setOpenRef={setOpenRef}
        popupPadding={24}
        popupClassName={clsx('!p-2', isConnected && '!rounded-full')}
        sideOffset={isConnected ? 0 : 4}
        wrapperClassName={className}
        trigger={{
          type: 'custom',
          Renderer: ({ onClick, open }) => (
            <button
              onClick={onClick}
              className={clsx(
                'flex items-center gap-2.5 rounded-full transition-[background-color,box-shadow] hover:shadow-lg px-5 text-sm text-primary-foreground h-12',
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
              <span>
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
          <div className="flex flex-row justify-around items-center px-2 gap-1">
            <button
              className="flex flex-row items-center gap-2 cursor-pointer p-2 transition-opacity hover:opacity-80 active:opacity-70"
              onClick={(e) => {
                navigator.clipboard.writeText(address)
                setCopied(true)
                // Don't close the popup. Updating the copied state causes this to re-render, which causes the original event target to no longer be contained by the popup, which causes the popup to close.
                e.stopPropagation()
              }}
            >
              <CopyIcon className="w-4 h-4 text-primary-foreground/80" />
            </button>

            <button
              onClick={() => {
                setOpenRef.current?.(false)
                // Wait for the popup to close before disconnecting to avoid flickering as the popup classes change.
                setTimeout(() => disconnect(), 200)
              }}
              className="flex items-center justify-center shrink-0 p-2 transition-opacity hover:opacity-80 active:opacity-70"
            >
              <LogOut className="w-4 h-4 text-destructive-foreground" />
            </button>
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
