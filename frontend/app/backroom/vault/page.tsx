'use client'

import type React from 'react'
import { useState } from 'react'
import { useAccount } from 'wagmi'

interface Chain {
  id: string
  name: string
  symbol: string
  icon: string
  color: string
  supported: boolean
}

const chains: Chain[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '◈',
    color: 'text-blue-400',
    supported: true,
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    icon: '◇',
    color: 'text-purple-400',
    supported: true,
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    symbol: 'ARB',
    icon: '▲',
    color: 'text-cyan-400',
    supported: true,
  },
  {
    id: 'optimism',
    name: 'Optimism',
    symbol: 'OP',
    icon: '●',
    color: 'text-red-400',
    supported: true,
  },
  {
    id: 'base',
    name: 'Base',
    symbol: 'BASE',
    icon: '■',
    color: 'text-blue-500',
    supported: true,
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    symbol: 'AVAX',
    icon: '▼',
    color: 'text-red-500',
    supported: false,
  },
  {
    id: 'bsc',
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    icon: '◆',
    color: 'text-yellow-400',
    supported: false,
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    icon: '◉',
    color: 'text-green-400',
    supported: false,
  },
]

interface Asset {
  symbol: string
  name: string
  balance: string
  usdValue: string
  icon: string
}

const mockAssets: Asset[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    balance: '0.0000',
    usdValue: '$0.00',
    icon: '◈',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    balance: '0.00',
    usdValue: '$0.00',
    icon: '◇',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    balance: '0.00',
    usdValue: '$0.00',
    icon: '◆',
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    balance: '0.00',
    usdValue: '$0.00',
    icon: '◉',
  },
]

export default function VaultPage() {
  const [selectedChain, setSelectedChain] = useState<Chain>(chains[0])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [isDepositing, setIsDepositing] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)

  const { address, isConnected } = useAccount()

  // Vault constants
  const VAULT_LIMIT = 1000000 // $1 Million
  const currentTVL = 0 // Current Total Value Locked
  const vaultCapacityUsed = (currentTVL / VAULT_LIMIT) * 100
  const remainingCapacity = VAULT_LIMIT - currentTVL

  const handleDeposit = async () => {
    if (!depositAmount || !selectedAsset) return

    const depositValue = parseFloat(depositAmount) * 2000 // Mock USD conversion (ETH @ $2000)

    // Check if deposit would exceed vault limit
    if (currentTVL + depositValue > VAULT_LIMIT) {
      alert(
        `Deposit would exceed vault limit of $${VAULT_LIMIT.toLocaleString()}. Maximum deposit: $${remainingCapacity.toLocaleString()}`
      )
      return
    }

    setIsDepositing(true)
    // Simulate deposit process
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
        <div className="border border-gray-600 p-6 bg-gray-900/30 backdrop-blur-sm">
          <h1 className="text-xl font-bold text-white mb-4">
            ◢◤◢◤◢◤ EN0 VAULT ◢◤◢◤◢◤
          </h1>
          <div className="text-center py-12">
            <div className="text-red-400 text-lg mb-4">
              ⚠️ WALLET NOT CONNECTED
            </div>
            <p className="text-gray-400 mb-6">
              Connect your wallet to access the EN0 multi-chain deposit vault.
            </p>
            <div className="system-message">
              Neural link required for vault access.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-gray-600 p-6 bg-gray-900/30 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-white mb-2">
          ◢◤◢◤◢◤ EN0 VAULT ◢◤◢◤◢◤
        </h1>
        <p className="text-gray-400 text-sm">
          Deposit funds into EN0 from multiple blockchain networks. All deposits
          are recorded on-chain and contribute to the collective treasury.
        </p>
      </div>

      {/* Vault Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-gray-600 p-4 bg-gray-900/20 backdrop-blur-sm">
          <div className="terminal-dim text-xs mb-1">TOTAL VALUE LOCKED</div>
          <div className="text-green-400 text-lg font-bold">
            ${currentTVL.toLocaleString()}
          </div>
          <div className="terminal-dim text-xs">◈ 0.0000 ETH</div>
        </div>
        <div className="border border-gray-600 p-4 bg-gray-900/20 backdrop-blur-sm">
          <div className="terminal-dim text-xs mb-1">VAULT LIMIT</div>
          <div className="text-red-400 text-lg font-bold">
            ${VAULT_LIMIT.toLocaleString()}
          </div>
          <div className="terminal-dim text-xs">◇ EXPERIMENTAL CAP</div>
        </div>
        <div className="border border-gray-600 p-4 bg-gray-900/20 backdrop-blur-sm">
          <div className="terminal-dim text-xs mb-1">YOUR DEPOSITS</div>
          <div className="text-blue-400 text-lg font-bold">$0.00</div>
          <div className="terminal-dim text-xs">◇ 0 TRANSACTIONS</div>
        </div>
        <div className="border border-gray-600 p-4 bg-gray-900/20 backdrop-blur-sm">
          <div className="terminal-dim text-xs mb-1">SUPPORTED CHAINS</div>
          <div className="text-purple-400 text-lg font-bold">
            {chains.filter((c) => c.supported).length}
          </div>
          <div className="terminal-dim text-xs">◆ {chains.length} TOTAL</div>
        </div>
      </div>

      {/* Vault Capacity Progress */}
      <div className="border border-gray-600 p-6 bg-gray-900/20 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-4">VAULT CAPACITY</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="terminal-dim">Progress</span>
            <span className="text-white">
              ${currentTVL.toLocaleString()} / ${VAULT_LIMIT.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 border border-gray-600">
            <div
              className="bg-gradient-to-r from-green-600 to-green-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(vaultCapacityUsed, 0.5)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-green-400">
              {vaultCapacityUsed.toFixed(1)}% FILLED
            </span>
            <span className="text-gray-400">
              ${remainingCapacity.toLocaleString()} REMAINING
            </span>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="border border-blue-600 p-6 bg-blue-900/10 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-blue-400 mb-4">
          ◉ IMPORTANT NOTICE
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-3">
            <span className="text-blue-400 text-lg">▲</span>
            <div>
              <div className="text-white font-medium mb-1">
                Hyperstition Market Participation
              </div>
              <div className="text-gray-300">
                Participants in the Hyperstition markets will receive
                attestations regardless of whether they vote yes or no. Your
                participation in the collective decision-making process is what
                matters for attestation rewards.
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-400 text-lg">◢</span>
            <div>
              <div className="text-white font-medium mb-1">
                Vault Capacity Limit
              </div>
              <div className="text-gray-300">
                This vault has a maximum capacity of $1,000,000 USD as part of
                the experimental protocol design. Deposits will be rejected once
                this limit is reached.
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-400 text-lg">◤</span>
            <div>
              <div className="text-white font-medium mb-1">
                Experimental Nature
              </div>
              <div className="text-gray-300">
                All deposits are contributions to an active experiment in
                collective intelligence and blockchain-based governance. Proceed
                with full understanding of the experimental risks involved.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chain Selector */}
      <div className="border border-gray-600 p-6 bg-gray-900/20 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-4">
          SELECT BLOCKCHAIN NETWORK
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => chain.supported && setSelectedChain(chain)}
              disabled={!chain.supported}
              className={`p-4 border rounded-sm transition-colors ${
                selectedChain.id === chain.id
                  ? 'border-green-400 bg-green-900/20'
                  : chain.supported
                  ? 'border-gray-600 hover:border-gray-500 bg-gray-900/10'
                  : 'border-gray-700 bg-gray-900/5 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className={`text-lg mb-2 ${chain.color}`}>{chain.icon}</div>
              <div className="text-sm font-medium text-white">{chain.name}</div>
              <div className="text-xs text-gray-400">{chain.symbol}</div>
              {!chain.supported && (
                <div className="text-xs text-red-400 mt-1">COMING SOON</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Asset List */}
      <div className="border border-gray-600 p-6 bg-gray-900/20 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-4">
          AVAILABLE ASSETS - {selectedChain.name.toUpperCase()}
        </h2>
        <div className="space-y-3">
          {mockAssets.map((asset) => (
            <div
              key={asset.symbol}
              className="flex items-center justify-between p-4 border border-gray-700 rounded-sm hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <span className="text-lg text-blue-400">{asset.icon}</span>
                <div>
                  <div className="text-white font-medium">{asset.symbol}</div>
                  <div className="text-xs text-gray-400">{asset.name}</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-white font-mono">{asset.balance}</div>
                  <div className="text-xs text-gray-400">{asset.usdValue}</div>
                </div>
                <button
                  onClick={() => openDepositModal(asset)}
                  className="px-4 py-2 border border-green-600 text-green-400 hover:bg-green-900/20 transition-colors text-sm"
                >
                  DEPOSIT
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Deposits */}
      <div className="border border-gray-600 p-6 bg-gray-900/20 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-4">RECENT DEPOSITS</h2>
        <div className="text-center py-8">
          <div className="text-gray-500 text-sm">NO DEPOSITS YET</div>
          <div className="text-xs text-gray-600 mt-2">
            Your deposit history will appear here once you make your first
            transaction.
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-gray-600 p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">
              DEPOSIT {selectedAsset.symbol}
            </h3>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-2">Network</div>
                <div className="flex items-center space-x-2">
                  <span className={selectedChain.color}>
                    {selectedChain.icon}
                  </span>
                  <span className="text-white">{selectedChain.name}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-2">Asset</div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-400">{selectedAsset.icon}</span>
                  <span className="text-white">{selectedAsset.name}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-2">Amount</div>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full p-3 bg-black border border-gray-600 text-white font-mono focus:border-green-400 focus:outline-none"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Balance: {selectedAsset.balance} {selectedAsset.symbol}
                </div>
              </div>

              <div className="border border-yellow-600 p-3 bg-yellow-900/10">
                <div className="text-xs text-yellow-400 space-y-2">
                  <div>
                    ⚠️ WARNING: This is experimental software. Deposits are
                    recorded on public blockchain and contribute to the EN0
                    experiment treasury. Proceed at your own risk.
                  </div>
                  <div>
                    📊 VAULT CAPACITY: ${currentTVL.toLocaleString()} / $
                    {VAULT_LIMIT.toLocaleString()}
                    (${remainingCapacity.toLocaleString()} remaining)
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleDeposit}
                  disabled={isDepositing || !depositAmount}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
