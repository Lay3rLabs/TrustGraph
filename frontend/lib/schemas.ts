// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    '0x463660fef97e54d048b56a0ac6008014fa31aca5a828b7c773cb88588db36b3a',
  computeSchema:
    '0x742b34916f08653c7055d12863579ea5de1c42bb1c43660463e974fff329f4d5',

  statementSchema:
    '0xe2774d72e983714aabb444f74b4d58d12ad16ee47b95494997f188e7c28e83d6',
  isTrueSchema:
    '0x69acf6a88569377da14b7efb5b63b03d28e3a2dd99078097c0ff47d8a7f49945',
  likeSchema:
    '0x721c0271d8263a986fd889968ed20ff715f587b731cf725ee4ddea15de395832',
  vouchingSchema:
    '0x9b8c274779a9f2e2e3713a24e594a35038717030fee887bb83a6447b53108320',
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
    name: 'Statement Schema',
    uid: schemas.statementSchema,
    description: 'Statement',
    fields: ['statement'],
  },
  {
    name: 'Vouching Schema',
    uid: schemas.vouchingSchema,
    description: 'Vouching',
    fields: ['weight'],
  },
] as const
