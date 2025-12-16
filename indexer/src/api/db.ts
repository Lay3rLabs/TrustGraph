import { drizzle } from 'drizzle-orm/node-postgres'

import * as offchainSchema from '../../offchain.schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

export const offchainDb = drizzle(process.env.DATABASE_URL, {
  schema: offchainSchema,
})
