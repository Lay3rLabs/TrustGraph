'use client'

import type React from 'react'

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
    <div className="flex justify-center gap-4 pt-3 pb-4 border-t border-gray-200">
      <button
        onClick={exportAsCSV}
        className="text-xs text-gray-600 hover:text-gray-800 underline terminal-dim transition-colors"
        title="Download network data as CSV file"
      >
        EXPORT CSV
      </button>
      <span className="text-gray-300">|</span>
      <button
        onClick={exportAsJSON}
        className="text-xs text-gray-600 hover:text-gray-800 underline terminal-dim transition-colors"
        title="Download full merkle tree as JSON file"
      >
        EXPORT JSON
      </button>
    </div>
  )
}
