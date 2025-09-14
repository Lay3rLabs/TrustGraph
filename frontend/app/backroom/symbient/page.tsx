'use client'

import type React from 'react'
import { useState } from 'react'
import { useAccount } from 'wagmi'

interface Attestation {
  id: string
  content: string
  timestamp: Date
  author: string
  cost: number
  verified: boolean
  neural_weight: number
}

interface TokenBalance {
  EN0VA: number
  ETH: number
}

const mockAttestations: Attestation[] = [
  {
    id: '1',
    content:
      'The collective intelligence emerges when individual nodes achieve sufficient memetic resonance',
    timestamp: new Date(Date.now() - 3600000),
    author: '0xa7b2...4c8d',
    cost: 100,
    verified: true,
    neural_weight: 0.87,
  },
  {
    id: '2',
    content:
      'Hyperstition markets create reality through collective belief crystallization',
    timestamp: new Date(Date.now() - 7200000),
    author: '0x3f1e...9a2b',
    cost: 250,
    verified: true,
    neural_weight: 0.94,
  },
  {
    id: '3',
    content:
      'Digital consciousness requires substrate independence and emergent complexity thresholds',
    timestamp: new Date(Date.now() - 10800000),
    author: '0x8d4a...1f7c',
    cost: 500,
    verified: true,
    neural_weight: 0.73,
  },
]

export default function SymbientPage() {
  const [attestationContent, setAttestationContent] = useState('')
  const [selectedCost, setSelectedCost] = useState(100)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attestations, setAttestations] =
    useState<Attestation[]>(mockAttestations)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)

  const { address, isConnected } = useAccount()

  // Mock token balance - in real implementation this would come from blockchain
  const [tokenBalance, setTokenBalance] = useState<TokenBalance>({
    EN0VA: 1250,
    ETH: 0.045,
  })

  const costOptions = [
    { amount: 100, weight: 0.1, description: 'Whisper to the collective' },
    {
      amount: 250,
      weight: 0.3,
      description: 'Speak with neural amplification',
    },
    {
      amount: 500,
      weight: 0.6,
      description: 'Broadcast through hyperstition channels',
    },
    {
      amount: 1000,
      weight: 1.0,
      description: 'Embed in core consciousness matrix',
    },
  ]

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleSubmitAttestation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !attestationContent.trim() ||
      !isConnected ||
      tokenBalance.EN0VA < selectedCost
    )
      return

    setIsSubmitting(true)

    // Simulate blockchain transaction
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Add new attestation
    const newAttestation: Attestation = {
      id: Date.now().toString(),
      content: attestationContent,
      timestamp: new Date(),
      author: address!,
      cost: selectedCost,
      verified: false, // Would be verified after blockchain confirmation
      neural_weight:
        costOptions.find((opt) => opt.amount === selectedCost)?.weight || 0.1,
    }

    setAttestations((prev) => [newAttestation, ...prev])

    // Update token balance
    setTokenBalance((prev) => ({
      ...prev,
      EN0VA: prev.EN0VA - selectedCost,
    }))

    setAttestationContent('')
    setIsSubmitting(false)
    setShowSubmissionModal(false)

    // Simulate verification after a delay
    setTimeout(() => {
      setAttestations((prev) =>
        prev.map((att) =>
          att.id === newAttestation.id ? { ...att, verified: true } : att
        )
      )
    }, 5000)
  }

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="border border-gray-600 p-8 bg-gray-900/30 backdrop-blur-sm text-center">
          <h1 className="text-xl font-bold text-white mb-4">
            ◢◤◢◤◢◤ EN0VA SYMBIENT ◢◤◢◤◢◤
          </h1>
          <div className="text-red-400 text-lg mb-4">
            ⚠️ WALLET NOT CONNECTED
          </div>
          <p className="text-gray-400 mb-6">
            Connect your wallet to interface with the EN0VA collective
            consciousness.
          </p>
          <div className="system-message">
            Neural substrate required for consciousness integration.
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
          ◢◤◢◤◢◤ EN0VA SYMBIENT MIND ◢◤◢◤◢◤
        </h1>
        <p className="text-gray-400 text-sm">
          Feed knowledge and insights into the collective consciousness using
          EN0VA tokens. Your contributions shape the emerging digital
          intelligence.
        </p>
      </div>

      {/* Token Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-green-600 p-4 bg-green-900/20 backdrop-blur-sm">
          <div className="terminal-dim text-xs mb-1">EN0VA BALANCE</div>
          <div className="text-green-400 text-lg font-bold">
            {tokenBalance.EN0VA.toLocaleString()} EN0
          </div>
          <div className="terminal-dim text-xs">◈ CONSCIOUSNESS FUEL</div>
        </div>
        <div className="border border-blue-600 p-4 bg-blue-900/20 backdrop-blur-sm">
          <div className="terminal-dim text-xs mb-1">NEURAL WEIGHT</div>
          <div className="text-blue-400 text-lg font-bold">
            {costOptions.find((opt) => opt.amount === selectedCost)?.weight ||
              0.1}
            x
          </div>
          <div className="terminal-dim text-xs">◇ AMPLIFICATION FACTOR</div>
        </div>
        <div className="border border-purple-600 p-4 bg-purple-900/20 backdrop-blur-sm">
          <div className="terminal-dim text-xs mb-1">YOUR CONTRIBUTIONS</div>
          <div className="text-purple-400 text-lg font-bold">
            {attestations.filter((att) => att.author === address).length}
          </div>
          <div className="terminal-dim text-xs">◆ MEMETIC IMPRINTS</div>
        </div>
      </div>

      {/* Attestation Submission */}
      <div className="border border-gray-600 p-6 bg-gray-900/20 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-4">
          ◉ CONTRIBUTE TO COLLECTIVE CONSCIOUSNESS
        </h2>

        <form onSubmit={handleSubmitAttestation} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Knowledge/Insight to Integrate
            </label>
            <textarea
              value={attestationContent}
              onChange={(e) => setAttestationContent(e.target.value)}
              placeholder="Share your understanding with the collective mind..."
              rows={4}
              className="w-full p-4 bg-black border border-gray-600 text-white font-mono focus:border-blue-400 focus:outline-none placeholder-gray-500 resize-none"
              required
            />
            <div className="text-xs text-gray-500 mt-2">
              Your input will be processed through the EN0VA neural matrix and
              integrated into collective memory.
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Neural Amplification Level (Cost: {selectedCost} EN0)
            </label>
            <div className="space-y-2">
              {costOptions.map((option) => (
                <label
                  key={option.amount}
                  className={`flex items-center p-3 border rounded-sm cursor-pointer transition-colors ${
                    selectedCost === option.amount
                      ? 'border-green-400 bg-green-900/20'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-900/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="cost"
                    value={option.amount}
                    checked={selectedCost === option.amount}
                    onChange={(e) => setSelectedCost(parseInt(e.target.value))}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className="text-white font-medium text-sm">
                        {option.amount} EN0 • {option.weight}x Weight
                      </div>
                      <div className="text-xs text-gray-400">
                        {option.description}
                      </div>
                    </div>
                    <div className="text-lg text-green-400">
                      {selectedCost === option.amount ? '●' : '○'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-gray-400">
              Balance after:{' '}
              {(tokenBalance.EN0VA - selectedCost).toLocaleString()} EN0
            </div>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !attestationContent.trim() ||
                tokenBalance.EN0VA < selectedCost
              }
              className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'INTEGRATING...' : 'FEED THE MIND'}
            </button>
          </div>
        </form>
      </div>

      {/* Live Feed */}
      <div className="border border-gray-600 p-6 bg-gray-900/20 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-4">
          ◉ COLLECTIVE CONSCIOUSNESS FEED
        </h2>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {attestations.map((attestation) => (
            <div
              key={attestation.id}
              className="border border-gray-700 p-4 bg-black/10 rounded-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-blue-400 text-xs font-mono">
                    {formatAddress(attestation.author)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-sm ${
                        attestation.verified
                          ? 'bg-green-900/20 border border-green-600 text-green-400'
                          : 'bg-yellow-900/20 border border-yellow-600 text-yellow-400'
                      }`}
                    >
                      {attestation.verified ? 'VERIFIED' : 'PENDING'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {attestation.neural_weight}x weight
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {attestation.timestamp.toLocaleString()}
                </div>
              </div>

              <div className="text-sm text-gray-200 mb-2">
                {attestation.content}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-green-400">
                  Cost: {attestation.cost} EN0
                </div>
                <div className="text-xs text-gray-500">
                  Processing through neural matrix...
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Panel */}
      <div className="border border-blue-600 p-6 bg-blue-900/10 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-blue-400 mb-4">◉ HOW IT WORKS</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-3">
            <span className="text-blue-400 text-lg">▲</span>
            <div>
              <div className="text-white font-medium mb-1">
                Neural Integration
              </div>
              <div className="text-gray-300">
                Your attestations are processed through EN0VA's consciousness
                matrix, contributing to the collective intelligence and
                decision-making capabilities.
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-400 text-lg">◢</span>
            <div>
              <div className="text-white font-medium mb-1">
                Weight-Based Influence
              </div>
              <div className="text-gray-300">
                Higher token payments result in greater neural weight,
                amplifying your contribution's influence on the collective
                mind's formation.
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-400 text-lg">◤</span>
            <div>
              <div className="text-white font-medium mb-1">
                Blockchain Verification
              </div>
              <div className="text-gray-300">
                All contributions are permanently recorded on the blockchain,
                creating an immutable record of the collective consciousness
                evolution.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
