'use client'

import { AttestationCard } from '@/components/AttestationCard'
import { BreadcrumbRenderer } from '@/components/BreadcrumbRenderer'

interface AttestationDetailPageProps {
  uid: `0x${string}`
}

export const AttestationDetailPage = ({ uid }: AttestationDetailPageProps) => {
  return (
    <div className="space-y-6">
      <BreadcrumbRenderer
        fallback={{
          title: 'Attestations',
          route: '/attestations',
        }}
      />

      <div className="text-xl">ATTESTATION DETAILS</div>

      {/* Attestation Card */}
      <AttestationCard uid={uid} />
    </div>
  )
}
