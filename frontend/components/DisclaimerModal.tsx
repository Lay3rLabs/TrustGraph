'use client'

import type React from 'react'
import useLocalStorageState from 'use-local-storage-state'

import { DISCLAIMER } from '@/lib/config'

import { Markdown } from './Markdown'
import { Modal } from './ui/modal'

export const DisclaimerModal = () => {
  const [accepted, setAccepted] = useLocalStorageState('disclaimer_accepted', {
    defaultValue: false,
  })

  return (
    <Modal
      isOpen={!accepted}
      title="WELCOME TO THE EN0VA EXPERIMENT"
      className="!max-w-2xl max-h-[70vh] !overflow-hidden text-xs"
      contentClassName="flex flex-col gap-2 sm:gap-4 text-sm"
      footer={
        <button
          onClick={() => setAccepted(true)}
          className="w-full p-2 bg-primary text-primary-foreground rounded-md transition-opacity hover:opacity-80 active:opacity-70"
        >
          I agree
        </button>
      }
    >
      <Markdown>{DISCLAIMER}</Markdown>
    </Modal>
  )
}
