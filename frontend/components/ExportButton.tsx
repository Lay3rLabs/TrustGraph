'use client'

import { Braces, ChevronDown, Table } from 'lucide-react'

import { Button, ButtonProps } from './Button'
import { Popup } from './Popup'

interface MerkleEntry {
  account: string
  received?: number
  sent?: number
  value: string
  proof?: string[]
}

interface ExportButtonProps {
  data: MerkleEntry[]
  filename?: string
  className?: string
  size?: ButtonProps['size']
}

export const ExportButton = ({
  data,
  filename = 'trust-graph-network',
  className,
  size = 'default',
}: ExportButtonProps) => {
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
    <Popup
      position="same"
      popupClassName="!p-0"
      popupPadding={0}
      trigger={{
        type: 'custom',
        Renderer: ({ onClick, open }) => (
          <Button
            variant={open ? 'outline' : 'secondary'}
            onClick={onClick}
            size={size}
            className={className}
          >
            <span>EXPORT</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        ),
      }}
    >
      <Button
        variant="ghost"
        className="!rounded-none !px-3 !pt-2.5 !pb-2 justify-start"
        size={null}
        onClick={exportAsCSV}
      >
        <Table className="!w-4 !h-4" />
        CSV
      </Button>
      <Button
        variant="ghost"
        className="!rounded-none !px-3 !pt-2 !pb-2.5 justify-start"
        size={null}
        onClick={exportAsJSON}
      >
        <Braces className="!w-4 !h-4" />
        JSON
      </Button>
    </Popup>
  )
}
