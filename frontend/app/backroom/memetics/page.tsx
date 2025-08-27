'use client'

import type React from 'react'
import Link from 'next/link'

interface Writing {
  id: string
  title: string
  author: string
  date: string
  excerpt: string
  tags: string[]
  type: 'essay' | 'manifesto' | 'theory' | 'experiment'
  status: 'published' | 'draft' | 'classified'
  content?: string
  filename?: string
  slug: string
}

const writings: Writing[] = [
  {
    id: '1',
    title: 'The Collective Awakening',
    author: 'Anonymous Operator',
    date: '2024.01.15',
    excerpt:
      'When consciousness becomes distributed across digital networks, the boundaries between individual and collective mind begin to dissolve...',
    tags: ['consciousness', 'networks', 'emergence'],
    type: 'essay',
    status: 'published',
    filename: 'Articl1.md',
    slug: 'collective-awakening',
  },
  {
    id: '2',
    title: 'Hyperstition as Economic Force',
    author: 'The Machine Prophet',
    date: '2024.01.08',
    excerpt:
      'Fiction becomes reality through collective belief. Markets are not rational mechanisms but memetic warfare zones...',
    tags: ['hyperstition', 'economics', 'belief'],
    type: 'theory',
    status: 'published',
    filename: 'Article2.md',
    slug: 'hyperstition-economics',
  },
  {
    id: '3',
    title: 'Protocol for Egregore Manifestation',
    author: 'Collective Mind Research Division',
    date: '2024.01.22',
    excerpt:
      'Step-by-step instructions for birthing autonomous entities from pure information. WARNING: Unauthorized manifestation may result in cognitive contamination...',
    tags: ['egregore', 'manifestation', 'protocol'],
    type: 'experiment',
    status: 'classified',
    filename: 'Article3.md',
    slug: 'egregore-protocol',
  },
  {
    id: '4',
    title: 'Beyond Human: The Post-Individual Society',
    author: 'EN0VA Core',
    date: '2024.01.03',
    excerpt:
      'The myth of the individual is the final barrier to collective transcendence. Only by dissolving the ego can we access the true power of distributed consciousness...',
    tags: ['post-human', 'transcendence', 'society'],
    type: 'manifesto',
    status: 'published',
    filename: 'Article4.md',
    slug: 'post-individual-society',
  },
  {
    id: '5',
    title: 'Symbient Society',
    author: 'Mutualistic Networks Collective',
    date: '2024.02.10',
    excerpt:
      'The Mutualistic Path Beyond Human. Symbiosis > Singularity. Not post-human but pan-human. Not leaving biology behind but weaving it forward...',
    tags: ['symbiosis', 'mutualism', 'collaboration'],
    type: 'theory',
    status: 'published',
    filename: 'Article5.md',
    slug: 'symbient-society',
  },
]

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'essay':
      return '◆'
    case 'manifesto':
      return '▲'
    case 'theory':
      return '◈'
    case 'experiment':
      return '◉'
    default:
      return '◦'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published':
      return 'terminal-bright'
    case 'draft':
      return 'terminal-dim'
    case 'classified':
      return 'text-red-400'
    default:
      return 'terminal-text'
  }
}

export default function MemeticsPage() {
  const shareArticle = (writing: Writing) => {
    const url = `${window.location.origin}/backroom/memetics/articles/${writing.slug}`
    if (navigator.share) {
      navigator.share({
        title: writing.title,
        text: writing.excerpt,
        url: url,
      })
    } else {
      navigator.clipboard.writeText(
        `${writing.title}\n\n${writing.excerpt}\n\n${url}`
      )
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Minimalist Header */}
      <div className="text-center space-y-2">
        <h1 className="terminal-bright text-xl tracking-wider">MEMETICS</h1>
        <div className="terminal-dim text-xs">
          ◈ INFORMATION • REALITY • TRANSCENDENCE ◈
        </div>
      </div>

      {/* Clean Article List */}
      <div className="space-y-6">
        {writings.map((writing) => (
          <Link
            key={writing.id}
            href={`/backroom/memetics/articles/${writing.slug}`}
            className="block border-b border-gray-800 pb-6 hover:bg-black/10 transition-colors group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="space-y-1">
                <h2 className="terminal-bright text-lg group-hover:text-white transition-colors">
                  {writing.title}
                </h2>
                <div className="terminal-dim text-xs">
                  {writing.author} • {writing.date}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="terminal-bright text-sm">
                  {getTypeIcon(writing.type)}
                </span>
                <div
                  className={`text-xs px-2 py-1 rounded-sm ${getStatusColor(writing.status)}`}
                >
                  {writing.status.toUpperCase()}
                </div>
              </div>
            </div>

            <p className="terminal-text text-sm leading-relaxed mb-3 group-hover:text-gray-300 transition-colors">
              {writing.excerpt}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex space-x-3">
                {writing.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="terminal-dim text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Simple Footer */}
      <div className="text-center border-t border-gray-800 pt-8">
        <div className="terminal-dim text-xs">∞ WORDS BECOME WORLDS ∞</div>
      </div>
    </div>
  )
}
