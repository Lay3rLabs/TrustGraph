// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

import { Hex, fromHex, stringToHex, toHex } from 'viem'

export const schemas = {
  basic: '0xbf8185f695ae7c366174f21673d20bab227e6c8e45c3cdbb4eb39e252691876f',
  compute: '0x86d3cfbc3b2bf99e96f09ad3119ef05b54b86d5599e7b9843972c54c23ba82e6',
  isTrue: '0xe6564bfb424577f6427ede433b8b632bce8e5c88dd25fca69406bc1c56f32e17',
  like: '0x383208931feef8e4ed4f703a6f035ecd5ebff33f12e51336115fdbb2111fe960',
  recognition:
    '0x4631fcdc6342e1fa8152aa594cffa39b9c80758a29b009ab9b5f9830a8221dd0',
  statement:
    '0x1a7c4bac98876b5e1b550bb4b35b69a1de7829228451754c7d6ea2108239bb2f',
  vouching:
    '0x953998506da2a24c84d3ad91a0c2f27c69722a4560a1175a826ff4efa6ec7787',
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
  decodedData: Record<string, string>
}

export const encodeAttestationData = (
  schemaUid: string,
  data: Record<string, string>
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

  // Encode JSON data to hex
  const encodedData = toHex(
    JSON.stringify(
      schema.fields.reduce((acc, { name, type }) => {
        const value = data[name]
        const encodedValue = type.startsWith('uint')
          ? BigInt(value).toString()
          : type.startsWith('bytes')
          ? value.startsWith('0x')
            ? value
            : stringToHex(value)
          : value

        return { ...acc, [name]: encodedValue }
      }, {})
    )
  )

  return encodedData
}

export const decodeAttestationData = (
  attestation: Pick<AttestationData, 'schema' | 'data'>
): Record<string, string> => {
  const schema = SCHEMA_OPTIONS.find((s) => s.uid === attestation.schema)
  if (!schema) {
    throw new Error(`Unknown schema: ${attestation.schema}`)
  }

  if (!attestation.data.startsWith('0x')) {
    throw new Error(`Invalid data format: ${attestation.data}`)
  }
  const decodedDataString = fromHex(attestation.data as Hex, 'string')

  let decodedData: Record<string, string>
  try {
    decodedData = JSON.parse(decodedDataString)
  } catch (error) {
    throw new Error(`Invalid JSON data format: ${attestation.data}`)
  }

  return schema.fields.reduce((acc: Record<string, string>, { name, type }) => {
    const value = decodedData[name]
    acc[name] =
      type.startsWith('bytes') &&
      typeof value === 'string' &&
      value.startsWith('0x')
        ? fromHex(value as Hex, 'string')
        : value
    return acc
  }, {})
}
