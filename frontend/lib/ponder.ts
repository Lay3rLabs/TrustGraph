import { createClient } from '@ponder/client'

import * as ponderSchema from '../ponder.schema'

export const ponderClient = createClient('http://localhost:42069/sql', {
  schema: ponderSchema,
})

declare module '@ponder/react' {
  interface Register {
    schema: typeof ponderSchema
  }
}
