// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk'
import { Hex, stringToHex, toHex } from 'viem'

export const schemas = {
  basic: '0x4c40592488baa683d76390ac0dae5acef64ac5058b2333b13f0d296df45eb4de',
  compute: '0xbe1bab8d758cb909855241a1eba49ac64edb6e4778daafb944a063fb2d84b730',
  isTrue: '0xe193ebb45af3292801ede5eaceecb1ba23a31a117a0250babff4ee62eb3f33a4',
  like: '0x213c134a4d1c94c12ddcf4e710d2d6b32e4721dfc307a4a2b9370874fbcfe145',
  recognition:
    '0x2d337742fab51e458438a5eb974a25a5ff9ce35eba4127cbe7c6c83fd3fcab6f',
  statement:
    '0x2768487628948e3318d38cc29853646b07f3de72d81318eff487f7c25d7e391a',
  vouching:
    '0x5579c74e509b52fdbc3960c12691516c89e3da69436057c3ce834256c7e71fda',
} as const

// Schema definitions with metadata for UI
export type SchemaFieldType =
  | 'string'
  | 'bytes'
  | 'bytes32'
  | 'uint256'
  | 'address'

export const SCHEMA_OPTIONS: {
  name: string
  uid: string
  description: string
  fields: { name: string; type: SchemaFieldType }[]
}[] = [
  {
    name: 'Basic Schema',
    uid: schemas.basic,
    description: 'General purpose attestation',
    fields: [
      { name: 'triggerId', type: 'bytes32' },
      { name: 'data', type: 'string' },
      { name: 'timestamp', type: 'uint256' },
    ],
  },
  {
    name: 'Compute Schema',
    uid: schemas.compute,
    description: 'Computational verification',
    fields: [
      { name: 'triggerId', type: 'bytes32' },
      { name: 'computation', type: 'string' },
      { name: 'result', type: 'bytes' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'operator', type: 'address' },
    ],
  },
  {
    name: 'Statement Schema',
    uid: schemas.statement,
    description: 'Statement',
    fields: [{ name: 'statement', type: 'string' }],
  },
  {
    name: 'Vouching Schema',
    uid: schemas.vouching,
    description: 'Vouching',
    fields: [{ name: 'weight', type: 'uint256' }],
  },
  {
    name: 'Recognition Schema',
    uid: schemas.recognition,
    description: 'Recognize contributions',
    fields: [
      { name: 'reason', type: 'string' },
      { name: 'value', type: 'uint256' },
    ],
  },
]

export interface AttestationData {
  uid: string
  attester: string
  recipient: string
  time: bigint
  expirationTime: bigint
  revocationTime: bigint
  refUID: string
  schema: string
  data: string
  decodedData: Record<string, string | boolean>
}

export const encodeAttestationData = (
  schemaUid: string,
  data: Record<string, string | boolean>
): Hex => {
  // Validate schema and encode data
  const schema = SCHEMA_OPTIONS.find((s) => s.uid === schemaUid)
  if (!schema) {
    throw new Error(`Unknown schema: ${schemaUid}`)
  }

  // Ensure all data fields are present
  schema.fields.forEach((field) => {
    if (!(field.name in data)) {
      throw new Error(`Missing field: ${field.name}`)
    }
  })

  const encoder = new SchemaEncoder(
    schema.fields.map((field) => `${field.type} ${field.name}`).join(', ')
  )
  const encodedData = encoder.encodeData(
    schema.fields.map(({ name, type }) => {
      const value = data[name]
      let encodedValue =
        type.startsWith('bytes') &&
        typeof value === 'string' &&
        !value.startsWith('0x')
          ? stringToHex(value)
          : value

      // If bytes32 is not properly padded, right pad it with zeroes.
      if (
        type === 'bytes32' &&
        typeof encodedValue === 'string' &&
        encodedValue.length !== 66
      ) {
        encodedValue = encodedValue.padEnd(66, '0')
      }

      return {
        name,
        type,
        value: encodedValue,
      }
    })
  ) as Hex

  return encodedData
}

export const decodeAttestationData = (
  attestation: Pick<AttestationData, 'schema' | 'data'>
): Record<string, string | boolean> => {
  const schema = SCHEMA_OPTIONS.find((s) => s.uid === attestation.schema)
  if (!schema) {
    throw new Error(`Unknown schema: ${attestation.schema}`)
  }

  if (!attestation.data.startsWith('0x')) {
    throw new Error(`Invalid data format: ${attestation.data}`)
  }

  const encoder = new SchemaEncoder(
    schema.fields.map((field) => `${field.type} ${field.name}`).join(', ')
  )
  const decodedData = encoder.decodeData(attestation.data)
  const parsedData = decodedData.reduce(
    (acc, { name, value: { value } }) => ({
      ...acc,
      [name]:
        typeof value === 'bigint'
          ? BigInt(value).toString()
          : value instanceof Uint8Array
          ? toHex(value)
          : typeof value !== 'string'
          ? `${value}`
          : value,
    }),
    {} as Record<string, string | boolean>
  )

  return parsedData
}
