import { Hex } from 'viem'

import { easAttestation } from '@/ponder.schema'

import { SchemaManager } from './schemas'
import { formatTimeAgo } from './utils'

export enum AttestationStatus {
  VERIFIED = 'verified',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export const ATTESTATION_STATUSES = Object.values(AttestationStatus)

export interface AttestationData {
  uid: Hex
  schema: Hex
  schemaName: string
  attester: Hex
  recipient: Hex
  ref: Hex
  time: bigint
  formattedTime: string
  formattedTimeAgo: string
  revocable: boolean
  expirationTime: bigint
  revocationTime: bigint
  data: Hex
  decodedData: Record<string, any>
  status: `${AttestationStatus}`
}

/**
 * Convert Ponder attestation table data to AttestationData.
 */
export function intoAttestationData(): null
export function intoAttestationData(ponderData: undefined): null
export function intoAttestationData(ponderData: null): null
export function intoAttestationData(
  ponderData: typeof easAttestation.$inferSelect
): AttestationData
export function intoAttestationData(
  ponderData: typeof easAttestation.$inferSelect | undefined
): AttestationData
export function intoAttestationData(
  ponderData?: typeof easAttestation.$inferSelect | null
): AttestationData | null {
  if (!ponderData) {
    return null
  }

  const schemaName =
    SchemaManager.maybeSchemaForUid(ponderData.schema)?.name || 'Unknown'

  const status =
    ponderData.revocationTime > 0
      ? AttestationStatus.REVOKED
      : ponderData.expirationTime > 0 &&
        ponderData.expirationTime < Math.floor(Date.now() / 1000)
      ? AttestationStatus.EXPIRED
      : AttestationStatus.VERIFIED

  // Decode the attestation data using SchemaManager
  let decodedData
  try {
    decodedData = SchemaManager.decode(ponderData.schema, ponderData.data)
  } catch (error) {
    console.error('Error decoding attestation data', ponderData, error)
    decodedData = {}
  }

  const date = new Date(Number(ponderData.timestamp) * 1000)
  const formattedTime =
    ponderData.timestamp <= 0n || isNaN(Number(ponderData.timestamp))
      ? '<invalid timestamp>'
      : isNaN(date.getTime())
      ? '<invalid date>'
      : date.toISOString().replace('T', ' ').split('.')[0]

  return {
    uid: ponderData.uid,
    schema: ponderData.schema,
    schemaName,
    attester: ponderData.attester,
    recipient: ponderData.recipient,
    time: ponderData.timestamp,
    formattedTime,
    formattedTimeAgo: formattedTime.includes('invalid')
      ? '<invalid>'
      : formatTimeAgo(Number(ponderData.timestamp) * 1000),
    ref:
      ponderData.ref ||
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    revocable: ponderData.revocable || false,
    expirationTime: ponderData.expirationTime,
    revocationTime: ponderData.revocationTime,
    data: ponderData.data,
    decodedData,
    status,
  }
}

export const intoAttestationsData = (
  ponderData: (typeof easAttestation.$inferSelect)[]
): AttestationData[] => ponderData.map(intoAttestationData)
