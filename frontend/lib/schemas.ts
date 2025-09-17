// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

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
