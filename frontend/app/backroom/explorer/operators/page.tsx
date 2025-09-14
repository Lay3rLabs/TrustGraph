'use client'

import type React from 'react'
import { useAccount } from 'wagmi'

import { useOperators } from '@/hooks/useOperators'

export default function ExplorerOperatorsPage() {
  const { isConnected } = useAccount()
  const {
    operators,
    operatorCount,
    totalWeight,
    serviceURI,
    isLoading,
    error,
  } = useOperators()

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="border border-gray-600 p-8 bg-gray-900/30 backdrop-blur-sm text-center">
          <h1 className="text-xl font-bold text-white mb-4">
            OPERATOR NETWORK
          </h1>
          <div className="text-red-400 text-lg mb-4">
            ⚠️ WALLET NOT CONNECTED
          </div>
          <p className="text-gray-400 mb-6">
            Connect your wallet to view the operator network.
          </p>
          <div className="system-message">
            Neural link required for network access.
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border border-gray-600 p-8 bg-gray-900/30 backdrop-blur-sm text-center">
          <h1 className="text-xl font-bold text-white mb-4">
            OPERATOR NETWORK
          </h1>
          <div className="text-blue-400 text-lg mb-4">
            ◉ LOADING NETWORK DATA...
          </div>
          <div className="system-message">
            Synchronizing with service manager...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="border border-gray-600 p-8 bg-gray-900/30 backdrop-blur-sm text-center">
          <h1 className="text-xl font-bold text-white mb-4">
            OPERATOR NETWORK
          </h1>
          <div className="text-red-400 text-lg mb-4">⚠️ NETWORK ERROR</div>
          <p className="text-gray-400 mb-6">
            Failed to load operator data from service manager.
          </p>
          <div className="system-message text-xs">{error.message}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <div className="ascii-art-title text-lg mb-2">OPERATOR NETWORK</div>
        <div className="system-message text-sm">
          ◉ WAVS POA SERVICE OPERATORS • REALITY VALIDATORS ◉
        </div>
        {serviceURI && (
          <div className="text-xs text-gray-400 mt-2">
            Service URI: {serviceURI}
          </div>
        )}
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">{operatorCount}</div>
          <div className="terminal-dim text-xs">OPERATORS</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">
            {totalWeight.toLocaleString()}
          </div>
          <div className="terminal-dim text-xs">TOTAL WEIGHT</div>
        </div>
      </div>

      {/* Operators List */}
      <div className="space-y-2">
        {operators.map((operator) => (
          <div
            key={operator.address}
            className="bg-black/20 border border-gray-700 p-4 rounded-sm hover:bg-black/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="terminal-text text-sm">WAVS Operator</div>
                  <div className="terminal-command text-base font-mono">
                    {operator.address}
                  </div>
                </div>
                <div className="px-2 py-1 border border-green-400 rounded-sm text-xs text-green-400">
                  ACTIVE
                </div>
              </div>
              <div className="text-right">
                <div className="terminal-dim text-xs">WEIGHT</div>
                <div className="terminal-bright text-lg">
                  {operator.weight.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {operators.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="terminal-dim text-sm">NO OPERATORS REGISTERED</div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-700 pt-4 mt-8">
        <div className="system-message text-center text-sm">
          ∞ WE ARE THE GHOSTS IN THE MACHINE • THE SIGNAL IN THE NOISE ∞
        </div>
      </div>
    </div>
  )
}
