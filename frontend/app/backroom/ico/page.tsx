"use client";

import type React from "react";
import { useState } from "react";

interface UserContribution {
  attestations: number;
  operations: number;
  contributions: number;
  referrals: number;
}

export default function ICOPage() {
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [activeTab, setActiveTab] = useState<
    "purchase" | "details" | "tokenomics"
  >("purchase");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Mock user contribution data for discount calculation
  const userContributions: UserContribution = {
    attestations: 5,
    operations: 12,
    contributions: 8,
    referrals: 3,
  };

  // Calculate user discount based on contributions
  const calculateDiscount = (contributions: UserContribution): number => {
    let discount = 0;

    // Base discount for participation
    if (
      contributions.attestations > 0 ||
      contributions.operations > 0 ||
      contributions.contributions > 0 ||
      contributions.referrals > 0
    ) {
      discount += 5; // 5% base discount for any participation
    }

    // Additional discounts
    discount += Math.min(contributions.attestations * 2, 10); // Max 10% from attestations
    discount += Math.min(contributions.operations * 1.5, 15); // Max 15% from operations
    discount += Math.min(contributions.contributions * 2.5, 20); // Max 20% from contributions
    discount += Math.min(contributions.referrals * 3, 15); // Max 15% from referrals

    return Math.min(discount, 45); // Cap at 45% total discount
  };

  const userDiscount = calculateDiscount(userContributions);
  const basePrice = 0.001; // Base price: 1 ETH = 1000 $EN0
  const discountedPrice = basePrice * (1 - userDiscount / 100);

  const getTokenAmount = (ethAmount: string): number => {
    if (!ethAmount) return 0;
    const eth = parseFloat(ethAmount);
    return eth / discountedPrice;
  };

  const tokenomics = [
    {
      category: "Phase 1 ICO",
      percentage: "25%",
      allocation: "250M $EN0",
      color: "text-blue-400",
    },
    {
      category: "Development",
      percentage: "20%",
      allocation: "200M $EN0",
      color: "text-green-400",
    },
    {
      category: "Community Rewards",
      percentage: "20%",
      allocation: "200M $EN0",
      color: "text-yellow-400",
    },
    {
      category: "Liquidity",
      percentage: "15%",
      allocation: "150M $EN0",
      color: "text-purple-400",
    },
    {
      category: "Team & Advisors",
      percentage: "10%",
      allocation: "100M $EN0",
      color: "text-red-400",
    },
    {
      category: "Strategic Reserve",
      percentage: "10%",
      allocation: "100M $EN0",
      color: "text-gray-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Phase Emphasis */}
      <div className="p-6 rounded-sm">
        <div className="text-center space-y-4">
          <div className="ascii-art-title text-2xl text-blue-400">
            $EN0 ICO • PHASE 1
          </div>
          <div className="system-message text-lg">
            ◊ LIMITED TIME OFFERING • GENESIS PRICING ◊
          </div>
          <div className="terminal-text max-w-2xl mx-auto">
            Join the collective intelligence genesis. Phase 1 offers exclusive
            pricing and early access to the EN0VA ecosystem.
          </div>
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="terminal-bright">PHASE 1 ENDS IN:</div>
            <div className="bg-black/30 border border-gray-600 px-3 py-1 rounded-sm">
              <span className="text-red-400 text-lg font-mono">
                47h 23m 15s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Purchase Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Purchase Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Your Discount Section */}
          <div className="bg-green-900/20 border border-green-700 p-6 rounded-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="terminal-command text-lg">
                  YOUR CONTRIBUTION DISCOUNT
                </h3>
                <div className="text-green-400 text-2xl font-bold">
                  {userDiscount}%
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="terminal-bright text-lg">
                    {userContributions.attestations}
                  </div>
                  <div className="terminal-dim text-xs">Attestations</div>
                  <div className="text-green-400 text-xs">
                    +{Math.min(userContributions.attestations * 2, 10)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="terminal-bright text-lg">
                    {userContributions.operations}
                  </div>
                  <div className="terminal-dim text-xs">Operations</div>
                  <div className="text-green-400 text-xs">
                    +
                    {Math.min(
                      Math.floor(userContributions.operations * 1.5),
                      15,
                    )}
                    %
                  </div>
                </div>
                <div className="text-center">
                  <div className="terminal-bright text-lg">
                    {userContributions.contributions}
                  </div>
                  <div className="terminal-dim text-xs">Contributions</div>
                  <div className="text-green-400 text-xs">
                    +
                    {Math.min(
                      Math.floor(userContributions.contributions * 2.5),
                      20,
                    )}
                    %
                  </div>
                </div>
                <div className="text-center">
                  <div className="terminal-bright text-lg">
                    {userContributions.referrals}
                  </div>
                  <div className="terminal-dim text-xs">Referrals</div>
                  <div className="text-green-400 text-xs">
                    +{Math.min(userContributions.referrals * 3, 15)}%
                  </div>
                </div>
              </div>
              <div className="terminal-dim text-xs text-center">
                Your contributions have earned you a {userDiscount}% discount on
                $EN0 tokens!
              </div>
            </div>
          </div>

          {/* Purchase Interface */}
          <div className="border border-gray-700 bg-black/10 p-6 rounded-sm space-y-6">
            <h3 className="terminal-command text-lg">PURCHASE $EN0 TOKENS</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="terminal-dim text-sm">
                  PURCHASE AMOUNT (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  className="w-full bg-black/30 border border-gray-700 rounded-sm px-4 py-3 terminal-text text-lg focus:border-gray-500 focus:outline-none"
                  placeholder="0.100"
                />
                <div className="terminal-dim text-xs">Minimum: 0.001 ETH</div>
              </div>

              <div className="space-y-2">
                <div className="terminal-dim text-sm">YOU WILL RECEIVE</div>
                <div className="bg-black/30 border border-gray-700 rounded-sm px-4 py-3">
                  <div className="terminal-bright text-lg">
                    {purchaseAmount
                      ? getTokenAmount(purchaseAmount).toLocaleString(
                          undefined,
                          { maximumFractionDigits: 2 },
                        )
                      : "0"}{" "}
                    $EN0
                  </div>
                  <div className="terminal-dim text-xs mt-1">
                    {userDiscount > 0 && purchaseAmount && (
                      <span className="text-green-400">
                        Saved:{" "}
                        {(
                          (parseFloat(purchaseAmount) * (userDiscount / 100)) /
                          basePrice
                        ).toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}{" "}
                        $EN0
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Info */}
            <div className="bg-black/20 border border-gray-600 p-4 rounded-sm">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="terminal-dim text-xs">BASE PRICE</div>
                  <div className="terminal-text line-through">
                    {basePrice} ETH per $EN0
                  </div>
                </div>
                <div>
                  <div className="terminal-dim text-xs">YOUR PRICE</div>
                  <div className="text-green-400 font-bold">
                    {discountedPrice.toFixed(6)} ETH per $EN0
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase Button */}
            <button
              onClick={() => setShowPurchaseModal(true)}
              disabled={!purchaseAmount || parseFloat(purchaseAmount) < 0.001}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 border border-blue-500 px-6 py-4 rounded-sm transition-all duration-200"
            >
              <span className="terminal-command text-lg">
                {purchaseAmount
                  ? `PURCHASE ${getTokenAmount(purchaseAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })} $EN0`
                  : "ENTER AMOUNT TO PURCHASE"}
              </span>
            </button>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Phase 1 Stats */}
          <div className="border border-gray-700 bg-black/10 p-4 rounded-sm space-y-4">
            <div className="terminal-command text-sm">PHASE 1 STATUS</div>
            <div className="space-y-3">
              <div>
                <div className="terminal-dim text-xs mb-1">TOKENS SOLD</div>
                <div className="terminal-bright text-lg">127.3M $EN0</div>
                <div className="bg-gray-700 h-2 rounded mt-1">
                  <div className="bg-blue-400 h-2 rounded w-[51%]"></div>
                </div>
                <div className="terminal-dim text-xs mt-1">
                  51% of Phase 1 allocation
                </div>
              </div>

              <div>
                <div className="terminal-dim text-xs mb-1">RAISED</div>
                <div className="terminal-bright text-lg">1,247 ETH</div>
                <div className="terminal-dim text-xs">
                  of 2,500 ETH Phase 1 goal
                </div>
              </div>

              <div>
                <div className="terminal-dim text-xs mb-1">PARTICIPANTS</div>
                <div className="terminal-bright text-lg">1,837</div>
              </div>

              <div>
                <div className="terminal-dim text-xs mb-1">AVG DISCOUNT</div>
                <div className="text-green-400 text-lg">18.3%</div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border border-gray-700 bg-black/10 rounded-sm">
            <div className="flex border-b border-gray-700">
              {[
                { key: "purchase", label: "PURCHASE" },
                { key: "details", label: "DETAILS" },
                { key: "tokenomics", label: "TOKENOMICS" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 px-3 py-2 text-xs transition-colors ${
                    activeTab === tab.key
                      ? "terminal-bright bg-black/20"
                      : "terminal-dim hover:terminal-text"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === "purchase" && (
                <div className="space-y-3 text-xs">
                  <div className="terminal-text">
                    Phase 1 offers the lowest prices and highest contributor
                    discounts. Early participants get:
                  </div>
                  <div className="space-y-1">
                    <div>• Genesis member status</div>
                    <div>• Governance voting rights</div>
                    <div>• Priority access to features</div>
                    <div>• Exclusive community channels</div>
                  </div>
                </div>
              )}

              {activeTab === "details" && (
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="terminal-dim">TOTAL SUPPLY</div>
                    <div className="terminal-bright">1B $EN0</div>
                  </div>
                  <div>
                    <div className="terminal-dim">PHASE 1 ALLOCATION</div>
                    <div className="terminal-bright">250M $EN0 (25%)</div>
                  </div>
                  <div>
                    <div className="terminal-dim">NETWORK LAUNCH</div>
                    <div className="terminal-bright">Q2 2024</div>
                  </div>
                  <div>
                    <div className="terminal-dim">TOKEN UTILITY</div>
                    <div className="terminal-text">
                      Governance, staking, network fees, incentive rewards
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "tokenomics" && (
                <div className="space-y-2 text-xs">
                  {tokenomics.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <div className="terminal-text">{item.category}</div>
                        <div className="terminal-dim text-xs">
                          {item.allocation}
                        </div>
                      </div>
                      <div className={item.color}>{item.percentage}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Confirmation Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-gray-700 p-6 rounded-sm max-w-md w-full space-y-4">
            <h3 className="terminal-command text-lg">CONFIRM PURCHASE</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="terminal-dim">Amount:</span>
                <span className="terminal-bright">{purchaseAmount} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="terminal-dim">You receive:</span>
                <span className="terminal-bright">
                  {getTokenAmount(purchaseAmount).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  $EN0
                </span>
              </div>
              <div className="flex justify-between">
                <span className="terminal-dim">Your discount:</span>
                <span className="text-green-400">{userDiscount}%</span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-2">
                <span className="terminal-dim">Price per token:</span>
                <span className="text-green-400">
                  {discountedPrice.toFixed(6)} ETH
                </span>
              </div>
            </div>

            <div className="system-message text-xs p-3 border border-gray-600 rounded-sm">
              This will initiate a Web3 transaction. Make sure you have
              sufficient ETH for gas fees.
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 mobile-terminal-btn px-4 py-2"
              >
                <span className="terminal-command text-sm">CANCEL</span>
              </button>
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 border border-blue-500 px-4 py-2 rounded-sm">
                <span className="terminal-command text-sm">
                  CONFIRM PURCHASE
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Notice */}
      <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
        <div className="system-message text-xs mb-2">IMPORTANT NOTICE</div>
        <div className="terminal-dim text-xs space-y-2">
          <p>
            This is Phase 1 of the $EN0 token generation event. Phase 1 pricing
            and discounts are limited time offers. Ensure you are legally
            permitted to participate in your jurisdiction.
          </p>
        </div>
      </div>
    </div>
  );
}
