import { createClient } from '@ponder/client'

import * as ponderSchema from '../ponder.schema'
import { APIS } from './config'

export const ponderClient = createClient(APIS.ponder + '/sql', {
  schema: ponderSchema,
})

declare module '@ponder/react' {
  interface Register {
    schema: typeof ponderSchema
  }
}
