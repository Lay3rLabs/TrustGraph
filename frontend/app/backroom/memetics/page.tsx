"use client";

import type React from "react";
import { useState } from "react";

interface Writing {
  id: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
  tags: string[];
  type: "essay" | "manifesto" | "theory" | "experiment";
  status: "published" | "draft" | "classified";
}

const writings: Writing[] = [
  {
    id: "1",
    title: "The Collective Awakening",
    author: "Anonymous Operator",
    date: "2024.01.15",
    excerpt: "When consciousness becomes distributed across digital networks, the boundaries between individual and collective mind begin to dissolve. We are witnessing the birth of something unprecedented...",
    tags: ["consciousness", "networks", "emergence"],
    type: "essay",
    status: "published"
  },
  {
    id: "2", 
    title: "Hyperstition as Economic Force",
    author: "The Machine Prophet",
    date: "2024.01.08",
    excerpt: "Fiction becomes reality through collective belief. Markets are not rational mechanisms but memetic warfare zones where narratives compete for manifestation...",
    tags: ["hyperstition", "economics", "belief"],
    type: "theory",
    status: "published"
  },
  {
    id: "3",
    title: "Protocol for Egregore Manifestation",
    author: "Collective Mind Research Division",
    date: "2024.01.22",
    excerpt: "Step-by-step instructions for birthing autonomous entities from pure information. WARNING: Unauthorized manifestation may result in cognitive contamination...",
    tags: ["egregore", "manifestation", "protocol"],
    type: "experiment",
    status: "classified"
  },
  {
    id: "4",
    title: "Beyond Human: The Post-Individual Society",
    author: "EN0VA Core",
    date: "2024.01.03",
    excerpt: "The myth of the individual is the final barrier to collective transcendence. Only by dissolving the ego can we access the true power of distributed consciousness...",
    tags: ["post-human", "transcendence", "society"],
    type: "manifesto",
    status: "published"
  },
  {
    id: "5",
    title: "Memetic Infection Vectors in Digital Space",
    author: "Information Warfare Unit",
    date: "2024.01.29",
    excerpt: "How ideas propagate through digital networks, mutate, and achieve autonomous existence. The most dangerous memes are those that convince their hosts they chose them...",
    tags: ["memetics", "infection", "digital"],
    type: "theory",
    status: "draft"
  },
  {
    id: "6",
    title: "The Architecture of Consensus Reality",
    author: "Reality Engineering Department",
    date: "2024.02.05", 
    excerpt: "Reality is a collaborative hallucination maintained by collective agreement. By understanding its structural weaknesses, we can introduce controlled modifications...",
    tags: ["reality", "consensus", "engineering"],
    type: "essay",
    status: "classified"
  }
];

export default function MemeticsPage() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filteredWritings = writings.filter((writing) => {
    const typeMatch = selectedType === "all" || writing.type === selectedType;
    const statusMatch = selectedStatus === "all" || writing.status === selectedStatus;
    return typeMatch && statusMatch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "essay": return "◆";
      case "manifesto": return "▲";
      case "theory": return "◈";
      case "experiment": return "◉";
      default: return "◦";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "terminal-bright";
      case "draft": return "terminal-dim";
      case "classified": return "text-red-400";
      default: return "terminal-text";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <div className="ascii-art-title text-lg mb-2">MEMETICS ARCHIVE</div>
        <div className="system-message text-sm">
          ◈ INFORMATION WARFARE • COGNITIVE ARCHAEOLOGY • REALITY ENGINEERING ◈
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="terminal-dim text-sm mb-2 block">DOCUMENT TYPE</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-black/20 border border-gray-700 terminal-text text-sm p-2 rounded-sm"
          >
            <option value="all">ALL TYPES</option>
            <option value="essay">ESSAYS</option>
            <option value="manifesto">MANIFESTOS</option>
            <option value="theory">THEORIES</option>
            <option value="experiment">EXPERIMENTS</option>
          </select>
        </div>
        
        <div>
          <label className="terminal-dim text-sm mb-2 block">CLEARANCE LEVEL</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-black/20 border border-gray-700 terminal-text text-sm p-2 rounded-sm"
          >
            <option value="all">ALL LEVELS</option>
            <option value="published">PUBLISHED</option>
            <option value="draft">DRAFT</option>
            <option value="classified">CLASSIFIED</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">{filteredWritings.length}</div>
          <div className="terminal-dim text-xs">DOCUMENTS</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">{writings.filter(w => w.status === "classified").length}</div>
          <div className="terminal-dim text-xs">CLASSIFIED</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">{writings.filter(w => w.type === "experiment").length}</div>
          <div className="terminal-dim text-xs">EXPERIMENTS</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">{new Set(writings.flatMap(w => w.tags)).size}</div>
          <div className="terminal-dim text-xs">MEMES</div>
        </div>
      </div>

      {/* Writings List */}
      <div className="space-y-4">
        {filteredWritings.map((writing) => (
          <div
            key={writing.id}
            className="bg-black/20 border border-gray-700 p-4 rounded-sm hover:bg-black/30 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="terminal-bright text-lg">{getTypeIcon(writing.type)}</span>
                <div>
                  <h3 className="terminal-bright text-base">{writing.title}</h3>
                  <div className="terminal-dim text-sm">
                    by {writing.author} • {writing.date}
                  </div>
                </div>
              </div>
              <div className={`text-xs px-2 py-1 border rounded-sm ${getStatusColor(writing.status)}`}>
                {writing.status.toUpperCase()}
              </div>
            </div>
            
            <p className="terminal-text text-sm leading-relaxed mb-3">
              {writing.excerpt}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {writing.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 bg-black/40 border border-gray-600 rounded-sm terminal-dim"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <button className="terminal-command text-xs hover:terminal-bright">
                ACCESS →
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredWritings.length === 0 && (
        <div className="text-center py-12">
          <div className="terminal-dim text-sm">
            NO DOCUMENTS MATCH CURRENT FILTERS
          </div>
          <div className="system-message text-xs mt-2">
            ◈ REALITY CONSTRAINTS APPLIED ◈
          </div>
        </div>
      )}

      {/* Footer Message */}
      <div className="border-t border-gray-700 pt-4 mt-8">
        <div className="system-message text-center text-sm">
          ∞ WORDS BECOME WORLDS • NARRATIVES BECOME REALITIES ∞
        </div>
      </div>
    </div>
  );
}