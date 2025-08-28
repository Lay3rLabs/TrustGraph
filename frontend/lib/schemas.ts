// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    '0xf2fe68d99fee20838d3ada79da157603bcdb36e76df870eb8f43b223d410510f',
  computeSchema:
    '0xd635d2b3ce9c9ee8161db3a4ab1215bdbee2db48fbece85551d4038293fa1164',

  statementSchema:
    '0x5bed3fba1b576bec1e85c0b58031630035637f5f0748b2cfe53340c49b3a4c8f',
  isTrueSchema:
    '0x170aea5d1ad68b3bc683641946ce7bc7fbc765c0274648f683cc04003a70f079',
  likeSchema:
    '0x972c6bca449af38758ca8204e986cf91a8c74b6b8355a892dbbc7bba41b2e1c6',
  vouchingSchema:
    '0x0e4d1488e59a079f99ffe9063348992f79eb26f9eb69adb0d8ccd9b33c94c63c',
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
