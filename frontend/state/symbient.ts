import { atomWithStorage } from 'jotai/utils'

import { ChatMessage } from '@/types'

export const symbientChat = atomWithStorage<ChatMessage[]>('symbient-chat', [])
