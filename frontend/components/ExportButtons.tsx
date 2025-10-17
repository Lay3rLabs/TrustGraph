'use client'

import type React from 'react'

import { Button } from './Button'

interface MerkleEntry {
  account: string
  received?: number
  sent?: number
  value: string
  proof?: string[]
}

interface ExportButtonsProps {
  data: MerkleEntry[]
  filename?: string
}

export function ExportButtons({
  data,
  filename = 'trust-graph-network',
}: ExportButtonsProps) {
  const downloadFile = (
    content: string,
    fileName: string,
    contentType: string
  ) => {
    const blob = new Blob([content], { type: contentType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const exportAsCSV = () => {
    if (!data || data.length === 0) {
      console.warn('No data available for export')
      return
    }

    // CSV header
    const headers = ['Rank', 'Account', 'Received', 'Sent', 'Score']

    // CSV rows
    const rows = data.map((entry, index) => [
      (index + 1).toString(),
      entry.account,
      (entry.received || 0).toString(),
      (entry.sent || 0).toString(),
      entry.value,
    ])

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n')

    downloadFile(csvContent, `${filename}.csv`, 'text/csv')
  }

  const exportAsJSON = () => {
    if (!data || data.length === 0) {
      console.warn('No data available for export')
      return
    }

    // Create enriched data with rankings
    const enrichedData = data.map((entry, index) => ({
      rank: index + 1,
      account: entry.account,
      received: entry.received || 0,
      sent: entry.sent || 0,
      score: entry.value,
    }))

    const jsonContent = JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        totalParticipants: data.length,
        network: enrichedData,
      },
      null,
      2
    )

    downloadFile(jsonContent, `${filename}.json`, 'application/json')
  }

  if (!data || data.length === 0) {
    return null
  }

  return (
    <>
      <Button variant="outline" onClick={exportAsCSV}>
        Export CSV
      </Button>

      <Button variant="outline" onClick={exportAsJSON}>
        Export JSON
      </Button>
    </>
  )
}
