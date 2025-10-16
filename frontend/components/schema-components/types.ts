import type React from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { Network } from '@/lib/network'
import type { SchemaKey } from '@/lib/schemas'

// Form data structure used across all schema components
export interface AttestationFormData {
  schema: SchemaKey
  recipient: string
  data: Record<string, string>
}

// Schema information structure
export interface SchemaInfo {
  uid: string
  key: SchemaKey
  name: string
  description: string
  resolver: string
  revocable: boolean
  schema: string
  fields: { name: string; type: string }[]
}

// Common props interface that all schema components must implement
export interface SchemaComponentProps {
  form: UseFormReturn<AttestationFormData>
  schemaInfo: SchemaInfo
  onSubmit: (data: AttestationFormData) => void
  isLoading: boolean
  error?: Error | null
  isSuccess: boolean
  hash?: string | null
  network?: Network
}

// Type for schema component registry
export type SchemaComponent = React.ComponentType<SchemaComponentProps>
