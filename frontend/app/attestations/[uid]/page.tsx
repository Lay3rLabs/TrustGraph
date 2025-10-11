'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { AttestationCard } from '@/components/AttestationCard'

interface AttestationDetailPageProps {
  params: {
    uid: `0x${string}`
  }
}

export default function AttestationDetailPage({
  params,
}: AttestationDetailPageProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="border-b border-gray-700 pb-4">
        <button
          onClick={() => router.push('/attestations')}
          className="inline-flex items-center gap-2 text-sm terminal-dim hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Attestations
        </button>
        <div className="ascii-art-title text-lg">ATTESTATION DETAILS</div>
      </div>

      {/* Attestation Card */}
      <AttestationCard uid={params.uid} />
    </div>
  )
}
