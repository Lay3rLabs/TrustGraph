'use client'

import type React from 'react'
import { useState } from 'react'
import { useAccount } from 'wagmi'

import { useServiceData } from '@/hooks/useServiceData'
import { iWavsServiceManagerAddress } from '@/lib/contracts'

export default function ExplorerServicesPage() {
  const { isConnected } = useAccount()
  const { serviceURI, serviceData, workflows, isLoading, error } =
    useServiceData()
  const [selectedPackage, setSelectedPackage] = useState<string>('all')
  const [selectedChain, setSelectedChain] = useState<string>('all')

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="border border-gray-600 p-8 bg-gray-900/30 backdrop-blur-sm text-center">
          <h1 className="text-xl font-bold text-white mb-4">
            WAVS WORKFLOW DIRECTORY
          </h1>
          <div className="text-red-400 text-lg mb-4">
            ⚠️ WALLET NOT CONNECTED
          </div>
          <p className="text-gray-400 mb-6">
            Connect your wallet to view the service directory.
          </p>
          <div>Neural link required for service access.</div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border border-gray-600 p-8 bg-gray-900/30 backdrop-blur-sm text-center">
          <h1 className="text-xl font-bold text-white mb-4">
            WAVS WORKFLOW DIRECTORY
          </h1>
          <div className="text-blue-400 text-lg mb-4">
            ◉ LOADING SERVICE DATA...
          </div>
          <div>Synchronizing with IPFS network...</div>
        </div>
      </div>
    )
  }

  if (error || (!serviceData && !isLoading)) {
    return (
      <div className="space-y-6">
        <div className="border border-gray-600 p-8 bg-gray-900/30 backdrop-blur-sm text-center">
          <h1 className="text-xl font-bold text-white mb-4">
            WAVS WORKFLOW DIRECTORY
          </h1>
          <div className="text-red-400 text-lg mb-4">⚠️ SERVICE ERROR</div>
          <p className="text-gray-400 mb-6">
            {!serviceURI || serviceURI === ''
              ? 'Service URI not set on contract. Please contact admin.'
              : 'Failed to load service data from IPFS.'}
          </p>
          <div className="text-xs">
            {error?.message || 'Service URI is empty or not configured'}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Service URI: {serviceURI || 'Not set'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Contract: {iWavsServiceManagerAddress}
          </div>
        </div>
      </div>
    )
  }

  const filteredWorkflows = workflows.filter((workflow) => {
    const packageMatch =
      selectedPackage === 'all' || workflow.package.includes(selectedPackage)
    const chainMatch =
      selectedChain === 'all' || workflow.chain_name === selectedChain
    return packageMatch && chainMatch
  })

  const uniquePackages = [
    ...new Set(workflows.map((w) => w.package.split(':')[1] || w.package)),
  ]
  const uniqueChains = [...new Set(workflows.map((w) => w.chain_name))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <div className="text-lg mb-2">WAVS SERVICE DIRECTORY</div>
        <div className="text-sm">
          ◈ {serviceData?.name.toUpperCase()} SERVICE • STATUS:{' '}
          {serviceData?.status.toUpperCase()} ◈
        </div>
        {serviceURI && (
          <div className="text-xs text-gray-400 mt-2">
            Service URI: {serviceURI}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm mb-2 block">COMPONENT PACKAGE</label>
          <select
            value={selectedPackage}
            onChange={(e) => setSelectedPackage(e.target.value)}
            className="w-full bg-black/20 border border-gray-700 text-sm p-2 rounded-sm"
          >
            <option value="all">ALL PACKAGES</option>
            {uniquePackages.map((pkg) => (
              <option key={pkg} value={pkg}>
                {pkg.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm mb-2 block">CHAIN NETWORK</label>
          <select
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value)}
            className="w-full bg-black/20 border border-gray-700 text-sm p-2 rounded-sm"
          >
            <option value="all">ALL CHAINS</option>
            {uniqueChains.map((chain) => (
              <option key={chain} value={chain}>
                {chain.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="text-lg">{filteredWorkflows.length}</div>
          <div className="text-xs">WORKFLOWS</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="text-lg">{uniquePackages.length}</div>
          <div className="text-xs">PACKAGES</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="text-lg">{uniqueChains.length}</div>
          <div className="text-xs">CHAINS</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="text-xs font-mono break-all">
            {serviceData?.manager?.evm?.address || 'N/A'}
          </div>
          <div className="text-xs">MANAGER</div>
        </div>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {filteredWorkflows.map((workflow) => (
          <div
            key={workflow.id}
            className="bg-black/20 border border-gray-700 p-4 rounded-sm hover:bg-black/30 transition-colors"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base">{workflow.package}</h3>
                  <div className="text-xs mt-1">
                    v{workflow.version} • {workflow.chain_name} chain
                  </div>
                  <div className="text-xs mt-1 font-mono">
                    ID: {workflow.id}
                  </div>
                </div>
                <div className="px-3 py-1 border border-green-400 rounded-sm text-xs text-green-400">
                  ACTIVE
                </div>
              </div>

              {/* Registry Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs mb-1">REGISTRY DOMAIN</div>
                  <div className="text-sm font-mono">{workflow.domain}</div>
                </div>
                <div>
                  <div className="text-xs mb-1">DIGEST</div>
                  <div className="text-xs font-mono break-all">
                    {workflow.digest}
                  </div>
                </div>
              </div>

              {/* Trigger Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs mb-1">TRIGGER CONTRACT</div>
                  <div className="text-xs font-mono break-all">
                    {workflow.trigger_address}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1">EVENT HASH</div>
                  <div className="text-xs font-mono break-all">
                    {workflow.trigger_event}
                  </div>
                </div>
              </div>

              {/* Aggregator Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs mb-1">AGGREGATOR URL</div>
                  <div className="text-xs font-mono">
                    {workflow.aggregator_url}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1">AGGREGATOR ADDRESS</div>
                  <div className="text-xs font-mono break-all">
                    {workflow.aggregator_address}
                  </div>
                </div>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs mb-1">FUEL LIMIT</div>
                  <div className="text-sm">
                    {workflow.fuel_limit.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1">TIME LIMIT</div>
                  <div className="text-sm">{workflow.time_limit}s</div>
                </div>
                <div>
                  <div className="text-xs mb-1">ENV KEYS</div>
                  <div className="text-sm">{workflow.env_keys.length}</div>
                </div>
                <div>
                  <div className="text-xs mb-1">CONFIG KEYS</div>
                  <div className="text-sm">
                    {Object.keys(workflow.config).length}
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <div className="text-xs mb-2">PERMISSIONS</div>
                <div className="flex flex-wrap gap-2">
                  {workflow.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="text-xs px-2 py-1 bg-black/40 border border-gray-600 rounded-sm"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>

              {/* Environment Variables */}
              {workflow.env_keys.length > 0 && (
                <div>
                  <div className="text-xs mb-2">ENVIRONMENT VARIABLES</div>
                  <div className="bg-black/30 border border-gray-600 rounded-sm p-3">
                    <div className="space-y-1">
                      {workflow.env_keys.map((key) => (
                        <div key={key} className="flex items-center space-x-2">
                          <span className="text-xs font-mono">{key}</span>
                          <span className="text-xs">= [REDACTED]</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Configuration */}
              {Object.keys(workflow.config).length > 0 && (
                <div>
                  <div className="text-xs mb-2">CONFIGURATION</div>
                  <div className="bg-black/30 border border-gray-600 rounded-sm p-3">
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {Object.entries(workflow.config).map(([key, value]) => (
                        <div key={key} className="flex items-start space-x-2">
                          <span className="text-xs font-mono min-w-0 flex-shrink-0">
                            {key}:
                          </span>
                          <span className="text-xs font-mono break-all">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <div className="text-sm">NO WORKFLOWS MATCH CURRENT FILTERS</div>
          <div className="text-xs mt-2">◈ WAVS NETWORK ADAPTING ◈</div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-700 pt-4 mt-8">
        <div className="text-center text-sm">
          <div>∞ WAVS NETWORK ∞</div>
          <div className="font-mono text-xs mt-1 break-all">
            MANAGER: {serviceData?.manager?.evm?.address || 'N/A'}
          </div>
        </div>
      </div>
    </div>
  )
}
