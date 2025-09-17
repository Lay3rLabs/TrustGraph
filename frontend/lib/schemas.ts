// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

import { Hex, fromHex, stringToHex, toHex } from 'viem'

export const schemas = {
  basic: '0x9b9fce7e12ad60ec91a413996435b3db1ca988e6a623931680ecb4ad22ebe0ca',
  compute: '0x5dba5bf8782eb162689ca5baf4148a7145191770a7bc6de44a2683eb67e7cdbe',
  isTrue: '0x42e0aa833c6d1ca4f2cc8be8219e8ed176454370c025836bfe4f5a3de602b37e',
  like: '0xd08a940f2989de29aed3ca9527944927433017d82c2d6132a5c874afc1ac63b3',
  recognition:
    '0x28048dd864394ef46ff8110e2b0e26176f6f42cb9f6789634c8b603709533931',
  statement:
    '0x304744605ac3989e7dfd5fc0cdf9b9780b654a15762408c01c2ba9ec46e310ca',
  vouching:
    '0x3dff482449710cf743b77aeb7fc0c754fc4e7c80b7fbb79caa393ea6df7673a0',
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
