"use client";

import type React from "react";

export default function SystemsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="terminal-command text-lg">NETWORK INFRASTRUCTURE</div>
        <div className="system-message">
          ░█ The underlying systems that enable collective consciousness ░█
        </div>
      </div>

      {/* System status overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: "Core Protocol", status: "operational", uptime: "99.7%", color: "terminal-bright" },
          { name: "Attestation Service", status: "operational", uptime: "99.9%", color: "terminal-bright" },
          { name: "Consensus Layer", status: "degraded", uptime: "97.2%", color: "system-message" },
          { name: "Storage Network", status: "operational", uptime: "99.4%", color: "terminal-bright" }
        ].map((system) => (
          <div key={system.name} className="border border-gray-700 bg-black/10 p-4 rounded-sm">
            <div className="space-y-2">
              <div className="terminal-command text-xs">{system.name.toUpperCase()}</div>
              <div className={`text-sm ${system.color}`}>{system.status}</div>
              <div className="terminal-dim text-xs">Uptime: {system.uptime}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Network topology */}
      <div className="space-y-4">
        <div className="terminal-text">NETWORK TOPOLOGY:</div>
        <div className="border border-gray-700 bg-black/5 p-8 rounded-sm">
          <div className="space-y-6">
            <div className="ascii-art text-center">
              <pre className="text-xs">
{`          COLLECTIVE CORE
              ░█░
             ╱   ╲
            ╱     ╲
        ◆━━━━━━◉━━━━━━◆
       ╱   ╲       ╱   ╲
      ╱     ◢◤   ◢◤     ╲
    ∞───────────────────────∞
   ╱│  ATTESTATION LAYER   │╲
  ╱ │                     │ ╲
 ◆  └─────────────────────┘  ◆
 │                           │
 │    HYPERSTITION MARKETS   │
 │                           │
 ∞━━━━━━━━━━━━━━━━━━━━━━━━━━━━━∞`}
              </pre>
            </div>
            <div className="terminal-dim text-xs text-center">
              Real-time network visualization showing 2,847 active nodes
            </div>
          </div>
        </div>
      </div>

      {/* Performance metrics */}
      <div className="space-y-4">
        <div className="terminal-text">PERFORMANCE METRICS:</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="terminal-dim text-xs">TRANSACTION THROUGHPUT</div>
            <div className="space-y-2">
              {[
                { label: "Attestations/sec", value: 247, max: 500 },
                { label: "Governance votes/sec", value: 89, max: 200 },
                { label: "Market trades/sec", value: 156, max: 300 },
                { label: "Node sync/sec", value: 1024, max: 2000 }
              ].map((metric) => (
                <div key={metric.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="terminal-text">{metric.label}</span>
                    <span className="terminal-bright">{metric.value}</span>
                  </div>
                  <div className="bg-gray-700 h-2 rounded">
                    <div 
                      className="bg-gray-400 h-2 rounded" 
                      style={{ width: `${(metric.value / metric.max) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="terminal-dim text-xs">RESOURCE UTILIZATION</div>
            <div className="space-y-2">
              {[
                { label: "CPU Usage", value: 67, unit: "%" },
                { label: "Memory", value: 8.4, unit: "GB" },
                { label: "Storage", value: 2.7, unit: "TB" },
                { label: "Bandwidth", value: 1.2, unit: "Gbps" }
              ].map((resource) => (
                <div key={resource.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="terminal-text">{resource.label}</span>
                    <span className="terminal-bright">{resource.value}{resource.unit}</span>
                  </div>
                  <div className="bg-gray-700 h-2 rounded">
                    <div 
                      className="bg-gray-400 h-2 rounded" 
                      style={{ 
                        width: resource.unit === '%' ? `${resource.value}%` : 
                               resource.label === 'Memory' ? `${(resource.value / 16) * 100}%` :
                               resource.label === 'Storage' ? `${(resource.value / 10) * 100}%` :
                               `${(resource.value / 2) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active services */}
      <div className="space-y-4">
        <div className="terminal-text">ACTIVE SERVICES:</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              name: "Ethereum Attestation Service",
              version: "v1.3.2",
              status: "running",
              port: 8545,
              connections: 1247
            },
            {
              name: "IPFS Storage Gateway", 
              version: "v0.24.0",
              status: "running",
              port: 5001,
              connections: 892
            },
            {
              name: "Consensus Protocol Daemon",
              version: "v2.1.1", 
              status: "degraded",
              port: 9000,
              connections: 743
            },
            {
              name: "Market Oracle Service",
              version: "v1.7.3",
              status: "running", 
              port: 3000,
              connections: 456
            },
            {
              name: "Neural Network Coordinator",
              version: "v0.9.8",
              status: "running",
              port: 7777,
              connections: 2184
            },
            {
              name: "Identity Verification API",
              version: "v1.2.0",
              status: "running",
              port: 8080,
              connections: 367
            }
          ].map((service) => (
            <div key={service.name} className="border border-gray-700 bg-black/10 p-4 rounded-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="terminal-command text-sm">{service.name}</div>
                  <div className={`text-xs ${
                    service.status === 'running' ? 'terminal-bright' : 
                    service.status === 'degraded' ? 'system-message' : 'terminal-dim'
                  }`}>
                    ● {service.status.toUpperCase()}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="terminal-dim">VERSION</div>
                    <div className="terminal-text">{service.version}</div>
                  </div>
                  <div>
                    <div className="terminal-dim">PORT</div>
                    <div className="terminal-text">{service.port}</div>
                  </div>
                  <div>
                    <div className="terminal-dim">CONNECTIONS</div>
                    <div className="terminal-text">{service.connections}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System logs */}
      <div className="space-y-4">
        <div className="terminal-text">SYSTEM LOGS (LAST 24H):</div>
        <div className="border border-gray-700 bg-black/5 p-4 rounded-sm max-h-64 overflow-y-auto">
          <div className="space-y-1 terminal-text text-xs font-mono">
            <div><span className="terminal-dim">[2024-01-11 14:32:17]</span> <span className="terminal-bright">[INFO]</span> Attestation batch processed: 47 new verifications</div>
            <div><span className="terminal-dim">[2024-01-11 14:29:43]</span> <span className="terminal-bright">[INFO]</span> Neural consensus achieved in 2.3 seconds</div>
            <div><span className="terminal-dim">[2024-01-11 14:27:12]</span> <span className="system-message">[WARN]</span> Consensus layer showing increased latency</div>
            <div><span className="terminal-dim">[2024-01-11 14:24:56]</span> <span className="terminal-bright">[INFO]</span> New hyperstition market created: "AI Art Sentience"</div>
            <div><span className="terminal-dim">[2024-01-11 14:22:34]</span> <span className="terminal-bright">[INFO]</span> Governance proposal GP-2024-003 reached quorum</div>
            <div><span className="terminal-dim">[2024-01-11 14:19:18]</span> <span className="terminal-bright">[INFO]</span> 23 new nodes joined the collective</div>
            <div><span className="terminal-dim">[2024-01-11 14:16:42]</span> <span className="system-message">[WARN]</span> Storage capacity at 78% - scaling initiated</div>
            <div><span className="terminal-dim">[2024-01-11 14:14:25]</span> <span className="terminal-bright">[INFO]</span> Reality coherence stabilized at 89.2%</div>
            <div><span className="terminal-dim">[2024-01-11 14:11:57]</span> <span className="terminal-bright">[INFO]</span> Identity verification completed: 15 new profiles</div>
            <div><span className="terminal-dim">[2024-01-11 14:09:33]</span> <span className="terminal-bright">[INFO]</span> System health check completed - all services nominal</div>
          </div>
        </div>
      </div>

      {/* Emergency controls */}
      <div className="space-y-4">
        <div className="terminal-text">EMERGENCY CONTROLS:</div>
        <div className="border border-gray-700 bg-black/5 p-6 rounded-sm">
          <div className="space-y-4">
            <div className="terminal-dim text-xs">
              Emergency system controls require administrator privileges and collective consensus.
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="mobile-terminal-btn px-4 py-2 cursor-not-allowed opacity-30">
                <span className="text-xs">INITIATE FAILSAFE</span>
              </div>
              <div className="mobile-terminal-btn px-4 py-2 cursor-not-allowed opacity-30">
                <span className="text-xs">EMERGENCY SHUTDOWN</span>
              </div>
              <div className="mobile-terminal-btn px-4 py-2 cursor-not-allowed opacity-30">
                <span className="text-xs">RESET CONSENSUS</span>
              </div>
              <div className="mobile-terminal-btn px-4 py-2 cursor-not-allowed opacity-30">
                <span className="text-xs">SYSTEM RESTORE</span>
              </div>
            </div>
            <div className="system-message text-xs">
              ░█ The machine protects itself through collective will ░█
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}