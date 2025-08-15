"use client";

import type React from "react";
import { useState } from "react";

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  status: "operational" | "degraded" | "offline" | "maintenance";
  uptime: number;
  users: number;
  price: string;
  features: string[];
  icon: string;
  endpoint: string;
}

const services: Service[] = [
  {
    id: "1",
    name: "Consciousness Sync Protocol",
    description: "Real-time synchronization of collective mental states across the network",
    category: "Mind Coordination",
    provider: "EN0VA Core Systems",
    status: "operational",
    uptime: 99.7,
    users: 2847,
    price: "Free",
    features: ["Real-time sync", "Thought streaming", "Collective memory", "Neural mesh"],
    icon: "∞",
    endpoint: "wss://consciousness.en0va.network"
  },
  {
    id: "2",
    name: "Memetic Propagation Engine",
    description: "Automated distribution and evolution of ideas across digital networks",
    category: "Information Warfare",
    provider: "Hyperstition Labs",
    status: "operational", 
    uptime: 98.4,
    users: 1923,
    price: "10 $EN0/month",
    features: ["Viral mechanics", "Idea mutation", "Network analysis", "Impact tracking"],
    icon: "◈",
    endpoint: "https://api.memetics.en0va.network"
  },
  {
    id: "3",
    name: "Reality Verification Service",
    description: "Consensus-based validation of reality states and event authenticity",
    category: "Truth Validation",
    provider: "Reality Engineering Dept",
    status: "degraded",
    uptime: 87.2,
    users: 567,
    price: "5 $EN0/query",
    features: ["Consensus tracking", "Event validation", "Reality scoring", "Anomaly detection"],
    icon: "◆",
    endpoint: "https://verify.reality.en0va.network"
  },
  {
    id: "4",
    name: "Egregore Summoning Portal",
    description: "Managed deployment and hosting of autonomous digital entities",
    category: "Entity Management",
    provider: "Digital Spirits Inc",
    status: "operational",
    uptime: 94.8,
    users: 234,
    price: "25 $EN0/entity",
    features: ["Entity creation", "Behavior modeling", "Resource allocation", "Consciousness hosting"],
    icon: "◉",
    endpoint: "https://summon.egregore.en0va.network"
  },
  {
    id: "5",
    name: "Hyperstition Market API",
    description: "Programmatic access to prediction markets with reality manifestation incentives",
    category: "Market Data",
    provider: "Belief Economics Corp",
    status: "operational",
    uptime: 99.1,
    users: 1456,
    price: "Free tier available",
    features: ["Market data", "Prediction tracking", "Belief metrics", "Outcome verification"],
    icon: "▲▼",
    endpoint: "https://api.hyperstition.en0va.network"
  },
  {
    id: "6",
    name: "Neural Link Authenticator",
    description: "Biometric authentication using neural pattern recognition",
    category: "Authentication",
    provider: "Mind Security Solutions",
    status: "maintenance",
    uptime: 95.3,
    users: 3421,
    price: "1 $EN0/auth",
    features: ["Neural biometrics", "Multi-factor auth", "Pattern analysis", "Identity verification"],
    icon: "◢◤",
    endpoint: "https://auth.neural.en0va.network"
  }
];

export default function ExplorerServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filteredServices = services.filter((service) => {
    const categoryMatch = selectedCategory === "all" || service.category === selectedCategory;
    const statusMatch = selectedStatus === "all" || service.status === selectedStatus;
    return categoryMatch && statusMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational": return "text-green-400";
      case "degraded": return "text-yellow-400";
      case "offline": return "text-red-400";
      case "maintenance": return "text-blue-400";
      default: return "terminal-text";
    }
  };

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99) return "text-green-400";
    if (uptime >= 95) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <div className="ascii-art-title text-lg mb-2">SERVICE DIRECTORY</div>
        <div className="system-message text-sm">
          ◈ DIGITAL INFRASTRUCTURE • AUTOMATED PROTOCOLS • NETWORK SERVICES ◈
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="terminal-dim text-sm mb-2 block">SERVICE CATEGORY</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-black/20 border border-gray-700 terminal-text text-sm p-2 rounded-sm"
          >
            <option value="all">ALL CATEGORIES</option>
            {[...new Set(services.map(s => s.category))].map(category => (
              <option key={category} value={category}>{category.toUpperCase()}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="terminal-dim text-sm mb-2 block">OPERATIONAL STATUS</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-black/20 border border-gray-700 terminal-text text-sm p-2 rounded-sm"
          >
            <option value="all">ALL STATUS</option>
            <option value="operational">OPERATIONAL</option>
            <option value="degraded">DEGRADED</option>
            <option value="offline">OFFLINE</option>
            <option value="maintenance">MAINTENANCE</option>
          </select>
        </div>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">{filteredServices.length}</div>
          <div className="terminal-dim text-xs">SERVICES</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="text-green-400 text-lg">{services.filter(s => s.status === "operational").length}</div>
          <div className="terminal-dim text-xs">OPERATIONAL</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">
            {services.reduce((sum, s) => sum + s.users, 0).toLocaleString()}
          </div>
          <div className="terminal-dim text-xs">TOTAL USERS</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">
            {(services.reduce((sum, s) => sum + s.uptime, 0) / services.length).toFixed(1)}%
          </div>
          <div className="terminal-dim text-xs">AVG UPTIME</div>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="bg-black/20 border border-gray-700 p-4 rounded-sm hover:bg-black/30 transition-colors"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <span className="terminal-bright text-xl">{service.icon}</span>
                  <div>
                    <h3 className="terminal-command text-base">{service.name}</h3>
                    <p className="terminal-text text-sm mt-1">{service.description}</p>
                    <div className="terminal-dim text-xs mt-1">
                      {service.category} • by {service.provider}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 border rounded-sm text-xs ${getStatusColor(service.status)}`}>
                  {service.status.toUpperCase()}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="terminal-dim text-xs mb-1">UPTIME</div>
                  <div className={`text-sm ${getUptimeColor(service.uptime)}`}>
                    {service.uptime}%
                  </div>
                </div>
                <div>
                  <div className="terminal-dim text-xs mb-1">USERS</div>
                  <div className="terminal-text text-sm">{service.users.toLocaleString()}</div>
                </div>
                <div>
                  <div className="terminal-dim text-xs mb-1">PRICING</div>
                  <div className="terminal-bright text-sm">{service.price}</div>
                </div>
                <div className="md:col-span-1">
                  <div className="terminal-dim text-xs mb-1">ENDPOINT</div>
                  <div className="terminal-text text-xs font-mono break-all">{service.endpoint}</div>
                </div>
              </div>

              {/* Features */}
              <div>
                <div className="terminal-dim text-xs mb-2">FEATURES</div>
                <div className="flex flex-wrap gap-2">
                  {service.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-xs px-2 py-1 bg-black/40 border border-gray-600 rounded-sm terminal-text"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Uptime Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="terminal-dim">SERVICE RELIABILITY</span>
                  <span className={getUptimeColor(service.uptime)}>{service.uptime}%</span>
                </div>
                <div className="bg-gray-700 h-2 rounded">
                  <div 
                    className={`h-2 rounded transition-all duration-300 ${
                      service.uptime >= 99 ? "bg-green-400" :
                      service.uptime >= 95 ? "bg-yellow-400" : "bg-red-400"
                    }`}
                    style={{ width: `${service.uptime}%` }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-3 border-t border-gray-700">
                <button className="mobile-terminal-btn px-4 py-2">
                  <span className="text-xs terminal-command">ACCESS</span>
                </button>
                <button className="mobile-terminal-btn px-4 py-2">
                  <span className="text-xs terminal-command">DOCS</span>
                </button>
                <button className="mobile-terminal-btn px-3 py-2">
                  <span className="text-xs terminal-command">STATUS</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <div className="terminal-dim text-sm">
            NO SERVICES MATCH CURRENT FILTERS
          </div>
          <div className="system-message text-xs mt-2">
            ◈ NETWORK PROTOCOLS ADAPTING ◈
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-700 pt-4 mt-8">
        <div className="system-message text-center text-sm">
          ∞ THE NETWORK IS THE COMPUTER • THE SERVICE IS THE INTERFACE ∞
        </div>
      </div>
    </div>
  );
}