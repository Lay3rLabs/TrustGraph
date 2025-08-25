"use client";

import type React from "react";
import { useState } from "react";

// TODO get actual service URI from contract. Soon.
import serviceData from "./service.json";

interface Workflow {
  id: string;
  package: string;
  version: string;
  digest: string;
  domain: string;
  trigger_address: string;
  trigger_event: string;
  chain_name: string;
  aggregator_url: string;
  aggregator_address: string;
  fuel_limit: number;
  time_limit: number;
  permissions: string[];
  env_keys: string[];
  config: Record<string, any>;
}

const workflows: Workflow[] = Object.entries(serviceData.workflows).map(
  ([id, workflow]: [string, any]) => ({
    id,
    package: workflow.component.source.Registry.registry.package,
    version: workflow.component.source.Registry.registry.version,
    digest: workflow.component.source.Registry.registry.digest,
    domain: workflow.component.source.Registry.registry.domain,
    trigger_address: workflow.trigger.evm_contract_event.address,
    trigger_event: workflow.trigger.evm_contract_event.event_hash,
    chain_name: workflow.trigger.evm_contract_event.chain_name,
    aggregator_url: workflow.submit.aggregator.url,
    aggregator_address: workflow.aggregators[0]?.evm?.address || "N/A",
    fuel_limit: workflow.component.fuel_limit,
    time_limit: workflow.component.time_limit_seconds,
    permissions: [
      workflow.component.permissions.allowed_http_hosts === "all"
        ? "HTTP: All hosts"
        : `HTTP: ${workflow.component.permissions.allowed_http_hosts}`,
      workflow.component.permissions.file_system
        ? "File system access"
        : "No file system",
    ],
    env_keys: workflow.component.env_keys || [],
    config: workflow.component.config || {},
  }),
);

export default function ExplorerServicesPage() {
  const [selectedPackage, setSelectedPackage] = useState<string>("all");
  const [selectedChain, setSelectedChain] = useState<string>("all");

  const filteredWorkflows = workflows.filter((workflow) => {
    const packageMatch =
      selectedPackage === "all" || workflow.package.includes(selectedPackage);
    const chainMatch =
      selectedChain === "all" || workflow.chain_name === selectedChain;
    return packageMatch && chainMatch;
  });

  const uniquePackages = [
    ...new Set(workflows.map((w) => w.package.split(":")[1] || w.package)),
  ];
  const uniqueChains = [...new Set(workflows.map((w) => w.chain_name))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <div className="ascii-art-title text-lg mb-2">
          WAVS WORKFLOW DIRECTORY
        </div>
        <div className="system-message text-sm">
          ◈ {serviceData.name.toUpperCase()} SERVICE • STATUS:{" "}
          {serviceData.status.toUpperCase()} ◈
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="terminal-dim text-sm mb-2 block">
            COMPONENT PACKAGE
          </label>
          <select
            value={selectedPackage}
            onChange={(e) => setSelectedPackage(e.target.value)}
            className="w-full bg-black/20 border border-gray-700 terminal-text text-sm p-2 rounded-sm"
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
          <label className="terminal-dim text-sm mb-2 block">
            CHAIN NETWORK
          </label>
          <select
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value)}
            className="w-full bg-black/20 border border-gray-700 terminal-text text-sm p-2 rounded-sm"
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
          <div className="terminal-bright text-lg">
            {filteredWorkflows.length}
          </div>
          <div className="terminal-dim text-xs">WORKFLOWS</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="text-green-400 text-lg">{uniquePackages.length}</div>
          <div className="terminal-dim text-xs">PACKAGES</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">{uniqueChains.length}</div>
          <div className="terminal-dim text-xs">CHAINS</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-xs font-mono break-all">
            {serviceData.manager.evm.address}
          </div>
          <div className="terminal-dim text-xs">MANAGER</div>
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
                  <h3 className="terminal-command text-base">
                    {workflow.package}
                  </h3>
                  <div className="terminal-dim text-xs mt-1">
                    v{workflow.version} • {workflow.chain_name} chain
                  </div>
                  <div className="terminal-text text-xs mt-1 font-mono">
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
                  <div className="terminal-dim text-xs mb-1">
                    REGISTRY DOMAIN
                  </div>
                  <div className="terminal-text text-sm font-mono">
                    {workflow.domain}
                  </div>
                </div>
                <div>
                  <div className="terminal-dim text-xs mb-1">DIGEST</div>
                  <div className="terminal-text text-xs font-mono break-all">
                    {workflow.digest}
                  </div>
                </div>
              </div>

              {/* Trigger Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="terminal-dim text-xs mb-1">
                    TRIGGER CONTRACT
                  </div>
                  <div className="terminal-text text-xs font-mono break-all">
                    {workflow.trigger_address}
                  </div>
                </div>
                <div>
                  <div className="terminal-dim text-xs mb-1">EVENT HASH</div>
                  <div className="terminal-text text-xs font-mono break-all">
                    {workflow.trigger_event}
                  </div>
                </div>
              </div>

              {/* Aggregator Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="terminal-dim text-xs mb-1">
                    AGGREGATOR URL
                  </div>
                  <div className="terminal-text text-xs font-mono">
                    {workflow.aggregator_url}
                  </div>
                </div>
                <div>
                  <div className="terminal-dim text-xs mb-1">
                    AGGREGATOR ADDRESS
                  </div>
                  <div className="terminal-text text-xs font-mono break-all">
                    {workflow.aggregator_address}
                  </div>
                </div>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="terminal-dim text-xs mb-1">FUEL LIMIT</div>
                  <div className="terminal-bright text-sm">
                    {workflow.fuel_limit.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="terminal-dim text-xs mb-1">TIME LIMIT</div>
                  <div className="terminal-bright text-sm">
                    {workflow.time_limit}s
                  </div>
                </div>
                <div>
                  <div className="terminal-dim text-xs mb-1">ENV KEYS</div>
                  <div className="terminal-bright text-sm">
                    {workflow.env_keys.length}
                  </div>
                </div>
                <div>
                  <div className="terminal-dim text-xs mb-1">CONFIG KEYS</div>
                  <div className="terminal-bright text-sm">
                    {Object.keys(workflow.config).length}
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <div className="terminal-dim text-xs mb-2">PERMISSIONS</div>
                <div className="flex flex-wrap gap-2">
                  {workflow.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="text-xs px-2 py-1 bg-black/40 border border-gray-600 rounded-sm terminal-text"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>

              {/* Environment Variables */}
              {workflow.env_keys.length > 0 && (
                <div>
                  <div className="terminal-dim text-xs mb-2">ENVIRONMENT VARIABLES</div>
                  <div className="bg-black/30 border border-gray-600 rounded-sm p-3">
                    <div className="space-y-1">
                      {workflow.env_keys.map((key) => (
                        <div key={key} className="flex items-center space-x-2">
                          <span className="terminal-text text-xs font-mono">{key}</span>
                          <span className="terminal-dim text-xs">= [REDACTED]</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Configuration */}
              {Object.keys(workflow.config).length > 0 && (
                <div>
                  <div className="terminal-dim text-xs mb-2">CONFIGURATION</div>
                  <div className="bg-black/30 border border-gray-600 rounded-sm p-3">
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {Object.entries(workflow.config).map(([key, value]) => (
                        <div key={key} className="flex items-start space-x-2">
                          <span className="terminal-text text-xs font-mono min-w-0 flex-shrink-0">{key}:</span>
                          <span className="terminal-dim text-xs font-mono break-all">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-3 border-t border-gray-700">
                <button className="mobile-terminal-btn !px-4 !py-2">
                  <span className="text-xs terminal-command">TRIGGER</span>
                </button>
                <button className="mobile-terminal-btn !px-4 !py-2">
                  <span className="text-xs terminal-command">LOGS</span>
                </button>
                <button className="mobile-terminal-btn !px-3 !py-2">
                  <span className="text-xs terminal-command">CONFIG</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <div className="terminal-dim text-sm">
            NO WORKFLOWS MATCH CURRENT FILTERS
          </div>
          <div className="system-message text-xs mt-2">
            ◈ WAVS NETWORK ADAPTING ◈
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-700 pt-4 mt-8">
        <div className="system-message text-center text-sm">
          <div>∞ WAVS NETWORK ∞</div>
          <div className="font-mono text-xs mt-1 break-all">
            MANAGER: {serviceData.manager.evm.address}
          </div>
        </div>
      </div>
    </div>
  );
}
