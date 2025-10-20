'use client'

import { useAtom } from 'jotai'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { AttestationCard } from '@/components/AttestationCard'
import { attestationBackAtom } from '@/state/nav'

interface AttestationDetailPageProps {
  uid: `0x${string}`
}

export const AttestationDetailPage = ({ uid }: AttestationDetailPageProps) => {
  const [breadcrumb, setBreadcrumb] = useState({
    title: 'Attestations',
    route: '/attestations',
  })

  // If there is a preset attestation back link, use it.
  const [attestationBack, setAttestationBack] = useAtom(attestationBackAtom)
  useEffect(() => {
    if (attestationBack) {
      setBreadcrumb({
        title: attestationBack.split('/').pop()!,
        route: attestationBack,
      })
      setAttestationBack(null)
    }
  }, [attestationBack, setBreadcrumb])

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <Link
        href={breadcrumb.route}
        className="flex items-center gap-2 text-sm text-brand hover:text-brand/80 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {breadcrumb.title}
      </Link>

      <div className="text-lg">ATTESTATION DETAILS</div>

      {/* Attestation Card */}
      <AttestationCard uid={uid} />
    </div>
  )
}
