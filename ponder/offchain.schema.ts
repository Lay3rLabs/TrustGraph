import { pgSchema } from 'drizzle-orm/pg-core'

export const offchainSchema = pgSchema('offchain')

export const followerCount = offchainSchema.table('follower_count', (t) => ({
  timestamp: t.integer().primaryKey(),
  twitterAccount: t.text(),
  followers: t.integer().notNull(),
}))
