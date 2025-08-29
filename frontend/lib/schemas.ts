// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    '0x8b36fd1a57b0039bf29d3d8f95927f10c7b6d48c879bacf0894a65882963b7ed',
  computeSchema:
    '0x74f8dd1a009b7b50d7777dcf3cf23e442981444d8df2fc6ab17e299998663be8',

  statementSchema:
    '0x37d2dcb0d7779aeddfee906e64fff6f80bb2249e25898df323b1079095320054',
  isTrueSchema:
    '0x1c643fc31f51ced1ea76f7ebe114d06661d3f302266f6a6ed721fed2a4f70ced',
  likeSchema:
    '0x725f3888abae2d79cbef3fbdefc519271c33ab61968177e8b3b821160493e566',
  vouchingSchema:
    '0xefe873dcd5e56533daa49d16bded8d693a683326d206d6400daa5bafba9b9f25',
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
