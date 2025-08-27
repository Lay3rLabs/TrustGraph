'use client'

import type React from 'react'
import { useState } from 'react'
import { useAccount } from 'wagmi'

interface Asset {
  symbol: string
  name: string
  balance: string
  usdValue: string
  icon: string
  apr: string
}

const portalAssets: Asset[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    balance: '0.0000',
    usdValue: '$0.00',
    icon: '◈',
    apr: '23.7%',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    balance: '0.00',
    usdValue: '$0.00',
    icon: '◇',
    apr: '18.4%',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    balance: '0.00',
    usdValue: '$0.00',
    icon: '◆',
    apr: '17.9%',
  },
]

export default function PortalPage() {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [isDepositing, setIsDepositing] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)

  const { address, isConnected } = useAccount()

  const totalDeposited = 0
  const portalRank = 1
  const totalPortalUsers = 1000

  const handleDeposit = async () => {
    if (!depositAmount || !selectedAsset) return

    setIsDepositing(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsDepositing(false)
    setShowDepositModal(false)
    setDepositAmount('')
    setSelectedAsset(null)
  }

  const openDepositModal = (asset: Asset) => {
    setSelectedAsset(asset)
    setShowDepositModal(true)
  }

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="border border-gray-600 p-8 bg-gray-900/30 backdrop-blur-sm text-center">
          <h1 className="text-xl font-bold text-white mb-4">PORTAL</h1>
          <div className="text-gray-400 text-lg mb-4">
            ⚠️ WALLET NOT CONNECTED
          </div>
          <p className="text-gray-400 mb-6">Connect wallet to access Portal.</p>
          <div className="system-message">Neural link required.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Portal Interface - Centered like Points page */}
      <div className="flex flex-col items-center justify-center my-20 space-y-12">
        <div className="text-center space-y-3">
          <h1 className="text-lg">PORTAL</h1>
          <div className="terminal-bright text-8xl font-bold">
            ${totalDeposited.toLocaleString()}
          </div>
          <div className="text-lg terminal-dim">
            #{portalRank} / {totalPortalUsers}
          </div>
        </div>

        {/* Yield Message */}
        <div className="text-center max-w-xl space-y-3">
          <div className="text-gray-300 text-lg font-bold">
            EARN WHILE YOU MANIFEST
          </div>
          <div className="text-gray-300">
            <span className="text-green-400 font-bold">17.9% - 23.7% APR</span>{' '}
            through commitments and reality anchoring.
          </div>
          <div className="text-gray-400 text-sm">
            "The narrative creates the value creates the narrative."
          </div>
        </div>
      </div>

      {/* Assets Section */}
      <div className="flex flex-col items-stretch p-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">AVAILABLE ASSETS</h2>
          <div className="text-xs text-gray-400">PHASE 1 ACTIVE</div>
        </div>

        <div className="space-y-2">
          {portalAssets.map((asset) => (
            <div
              key={asset.symbol}
              className="flex items-center justify-between px-4 py-3 rounded-sm bg-gray-900/10 hover:bg-gray-900/20 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <span className="text-lg text-gray-400">{asset.icon}</span>
                <div>
                  <div className="text-white font-medium">{asset.symbol}</div>
                  <div className="text-xs text-gray-400">{asset.name}</div>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-green-400 font-bold text-lg">
                    {asset.apr}
                  </div>
                  <div className="text-xs text-gray-400">APR</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-mono text-sm">
                    {asset.balance}
                  </div>
                  <div className="text-xs text-gray-400">{asset.usdValue}</div>
                </div>
                <button
                  onClick={() => openDepositModal(asset)}
                  className="px-4 py-2 border border-gray-600 text-gray-400 hover:bg-gray-900/20 transition-colors text-sm font-bold"
                >
                  DEPOSIT
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Deposits */}
      <div className="max-w-3xl mx-auto p-4">
        <div className="border border-gray-600 p-6 bg-gray-900/20 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white mb-4">
            RECENT PORTAL ACTIVITY
          </h2>
          <div className="text-center py-8">
            <div className="text-gray-500 text-sm">NO DEPOSITS YET</div>
            <div className="text-xs text-gray-600 mt-2">Be first.</div>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-gray-600 p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-300 mb-4">
              DEPOSIT {selectedAsset.symbol}
            </h3>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-2">Asset</div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">{selectedAsset.icon}</span>
                  <span className="text-gray-300">{selectedAsset.name}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-2">Amount</div>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full p-3 bg-black border border-gray-600 text-gray-300 font-mono focus:border-gray-400 focus:outline-none"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Balance: {selectedAsset.balance} {selectedAsset.symbol}
                </div>
              </div>

              <div className="border border-gray-600 p-3 bg-gray-900/10">
                <div className="text-xs text-gray-400 space-y-1">
                  <div>
                    💰{' '}
                    <span className="text-green-400">
                      {selectedAsset.apr} APR
                    </span>
                  </div>
                  <div>
                    ◢◤{' '}
                    <span className="text-gray-300">
                      Belief generates yield
                    </span>
                  </div>
                  <div>
                    ⚠️{' '}
                    <span className="text-gray-300">Experimental protocol</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleDeposit}
                  disabled={isDepositing || !depositAmount}
                  className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-gray-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDepositing ? 'DEPOSITING...' : 'DEPOSIT'}
                </button>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-3 border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
