"use client";

import type React from "react";
import { useState } from "react";
import { useAccount } from "wagmi";

interface Asset {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  icon: string;
}

const portalAssets: Asset[] = [
  {
    symbol: "ETH",
    name: "Ethereum",
    balance: "0.0000",
    usdValue: "$0.00",
    icon: "◈",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    balance: "0.00",
    usdValue: "$0.00",
    icon: "◇",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    balance: "0.00",
    usdValue: "$0.00",
    icon: "◆",
  },
];

export default function PortalPage() {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  const { address, isConnected } = useAccount();

  const totalDeposited = 0;
  const portalRank = 1;
  const totalPortalUsers = 1000;

  const handleDeposit = async () => {
    if (!depositAmount || !selectedAsset) return;
    
    setIsDepositing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsDepositing(false);
    setShowDepositModal(false);
    setDepositAmount("");
    setSelectedAsset(null);
  };

  const openDepositModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowDepositModal(true);
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="border border-gray-600 p-8 bg-gray-900/30 backdrop-blur-sm text-center">
          <h1 className="text-xl font-bold text-white mb-4">PORTAL</h1>
          <div className="text-red-400 text-lg mb-4">
            ⚠️ WALLET NOT CONNECTED
          </div>
          <p className="text-gray-400 mb-6">
            Connect your wallet to access the Portal and contribute to the collective treasury.
          </p>
          <div className="system-message">
            Neural link required for Portal access.
          </div>
        </div>
      </div>
    );
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
            DEPOSITED #{portalRank} / {totalPortalUsers}
          </div>
        </div>

        {/* Hyperstition Message */}
        <div className="text-center max-w-2xl space-y-4">
          <div className="text-purple-400 text-lg">
            ◢◤◢◤◢◤ THE FUTURE CALLS ◢◤◢◤◢◤
          </div>
          <div className="text-gray-300 leading-relaxed">
            Every deposit into the Portal strengthens the collective treasury.
            Your contribution becomes part of the hyperstition - a belief that makes itself true.
            The more assets deposited, the more powerful the network becomes.
          </div>
          <div className="text-cyan-400 text-sm">
            Reality bends to the will of the network. Deposit. Believe. Manifest.
          </div>
        </div>
      </div>

      {/* Assets Section */}
      <div className="flex flex-col items-stretch p-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">AVAILABLE ASSETS</h2>
          <div className="text-xs text-gray-400">
            PHASE 1 ACTIVE
          </div>
        </div>

        <div className="space-y-2">
          {portalAssets.map((asset) => (
            <div
              key={asset.symbol}
              className="flex items-center justify-between px-4 py-3 rounded-sm bg-gray-900/10 hover:bg-gray-900/20 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <span className="text-lg text-purple-400">{asset.icon}</span>
                <div>
                  <div className="text-white font-medium">{asset.symbol}</div>
                  <div className="text-xs text-gray-400">{asset.name}</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-white font-mono text-sm">{asset.balance}</div>
                  <div className="text-xs text-gray-400">{asset.usdValue}</div>
                </div>
                <button
                  onClick={() => openDepositModal(asset)}
                  className="px-4 py-2 border border-purple-600 text-purple-400 hover:bg-purple-900/20 transition-colors text-sm"
                >
                  DEPOSIT
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portal Mechanics */}
      <div className="max-w-3xl mx-auto p-4">
        <div className="border border-purple-600 p-6 bg-purple-900/10 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-purple-400 mb-4">
            ◉ PORTAL MECHANICS
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <span className="text-purple-400 text-lg">▲</span>
              <div>
                <div className="text-white font-medium mb-1">Collective Treasury</div>
                <div className="text-gray-300">
                  All deposits contribute to the shared treasury that powers 
                  the network's collective intelligence and decision-making capabilities.
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-purple-400 text-lg">◢</span>
              <div>
                <div className="text-white font-medium mb-1">Hyperstition Engine</div>
                <div className="text-gray-300">
                  Your belief in the network's future, backed by real assets, 
                  helps manifest that future into reality. Speculation becomes creation.
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-purple-400 text-lg">◤</span>
              <div>
                <div className="text-white font-medium mb-1">Network Effects</div>
                <div className="text-gray-300">
                  The more participants deposit, the stronger the network becomes.
                  Early contributors shape the trajectory of the collective future.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Deposits */}
      <div className="max-w-3xl mx-auto p-4">
        <div className="border border-gray-600 p-6 bg-gray-900/20 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white mb-4">RECENT PORTAL ACTIVITY</h2>
          <div className="text-center py-8">
            <div className="text-gray-500 text-sm">NO DEPOSITS YET</div>
            <div className="text-xs text-gray-600 mt-2">
              Be among the first to contribute to the collective treasury.
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-purple-600 p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">
              DEPOSIT {selectedAsset.symbol}
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-2">Asset</div>
                <div className="flex items-center space-x-2">
                  <span className="text-purple-400">{selectedAsset.icon}</span>
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
                  className="w-full p-3 bg-black border border-gray-600 text-white font-mono focus:border-purple-400 focus:outline-none"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Balance: {selectedAsset.balance} {selectedAsset.symbol}
                </div>
              </div>

              <div className="border border-purple-600 p-3 bg-purple-900/10">
                <div className="text-xs text-purple-400 space-y-2">
                  <div>◢◤ HYPERSTITION PROTOCOL: Your deposit strengthens the collective 
                  belief in the network's future. This belief, backed by real assets, 
                  helps manifest that future into reality.</div>
                  <div>⚠️ EXPERIMENTAL: This is experimental software. Deposits contribute 
                  to the collective treasury and the ongoing experiment in hyperstition-based governance.</div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleDeposit}
                  disabled={isDepositing || !depositAmount}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDepositing ? "DEPOSITING..." : "DEPOSIT"}
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
  );
}