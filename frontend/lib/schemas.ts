// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    '0xce8d0245f63b6f543227892aa10ba11106b80a834513972c431e93580eda3cd6',
  computeSchema:
    '0xa4a2d7bb0c15dcf8f445141e9e63785616c6d376101db82bbde05807de065f52',

  statementSchema:
    '0x5c8b64dc9e9ded88f33b0ae6e2646c81cc70addf5702b65ef460cea1ba61cc88',
  isTrueSchema:
    '0x9b227323ef32f6f6065642720db5bc0eb34b734c2b8c7acd26e640852b72cfc9',
  likeSchema:
    '0x6cf33f19e476e148597166db862426bd8418776557167518f24501786da69eca',
  vouchingSchema:
    '0x4fc977bde9eaa1c2af0ef6be69b6f0a72db3c27c7ea8b4acc8bf9e03150f4740',
} as const

// Schema definitions with metadata for UI
export const SCHEMA_OPTIONS = [
  {
    name: 'Basic Schema',
    uid: schemas.basicSchema,
    description: 'General purpose attestation',
    fields: ['message'],
  },
  {
    name: 'Compute Schema',
    uid: schemas.computeSchema,
    description: 'Computational verification',
    fields: ['result', 'computation_hash'],
  },
  {
    name: 'Vouching Schema',
    uid: schemas.vouchingSchema,
    description: 'Vouching',
    fields: ['weight'],
  },
] as const
