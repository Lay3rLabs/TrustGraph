// Schema Components Registry and Exports
// This file manages the registration of custom schema components
// and provides exports for use throughout the application

import { SCHEMA_CONFIG } from '@/lib/config'

// Import components and registry for registration
import { CreateVouchingSchema } from './CreateVouchingSchema'
import { schemaComponentRegistry } from './SchemaComponentRegistry'

// Register custom schema components
// Vouching Schema UID loaded from config
schemaComponentRegistry.register(
  SCHEMA_CONFIG.vouching.uid,
  CreateVouchingSchema
)

// Future custom schema registrations can be added here:
// schemaComponentRegistry.register('0x...', CustomReputationSchema)
// schemaComponentRegistry.register('0x...', CustomIdentitySchema)

export * from './types'
export { schemaComponentRegistry } from './SchemaComponentRegistry'
export { GenericSchemaComponent } from './GenericSchemaComponent'
export { CreateVouchingSchema } from './CreateVouchingSchema'
