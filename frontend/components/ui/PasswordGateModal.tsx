'use client'

import { useState } from 'react'
import useLocalStorageState from 'use-local-storage-state'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Modal } from './modal'

interface PasswordGateProps {
  onUnlock: () => void
  onClose: () => void
  isOpen: boolean
  title?: string
  message?: string
}

export const PasswordGateModal = ({
  onUnlock,
  onClose,
  isOpen,
  title = 'CLASSIFIED ACCESS',
  message = 'Enter clearance code to proceed',
}: PasswordGateProps) => {
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [password, setPassword] = useLocalStorageState('memetics_password', {
    defaultValue: '',
  })

  const [authenticating, setAuthenticating] = useState(false)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setAuthenticating(true)
    try {
      const response = await fetch(`/api/articles/auth?password=${password}`)
      const data = await response.json()
      if (data) {
        await onUnlock()
        setError('')
      } else {
        setPassword('')
        setAttempts((prev) => prev + 1)

        if (attempts >= 2) {
          throw new Error('MAXIMUM ATTEMPTS EXCEEDED - CONTACT ADMIN')
        }

        throw new Error(`ACCESS DENIED [${attempts + 1}/3]`)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ACCESS DENIED')
    } finally {
      setAuthenticating(false)
    }
  }

  const isLocked = attempts >= 3

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      className="border border-red-500"
      contentClassName="!p-8"
    >
      <div className="text-center space-y-6">
        {/* Glitch Effect Header */}
        <div className="space-y-2">
          <h1 className="text-red-400 text-xl font-mono tracking-wider animate-blink">
            ⚠️ {title} ⚠️
          </h1>
          <div className="text-xs terminal-dim">{message}</div>
        </div>

        {/* Warning Box */}
        <div className="border border-red-800 bg-red-950/20 p-4 rounded-sm">
          <div className="text-red-300 text-xs space-y-1">
            <div>WARNING: Unauthorized access prohibited</div>
            <div>Cognitive hazard level: EXTREME</div>
            <div>Reality distortion potential: HIGH</div>
          </div>
        </div>

        {!isLocked ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                value={password}
                onChange={(e) => !authenticating && setPassword(e.target.value)}
                placeholder="CLEARANCE CODE"
                className="bg-black/60 border-gray-600 text-white font-mono text-center tracking-widest"
                maxLength={20}
                disabled={authenticating}
              />
              {error && (
                <div className="text-red-400 text-xs font-mono animate-blink">
                  {error}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-red-900/40 hover:bg-red-900/60 border border-red-600 text-red-200 font-mono"
              disabled={!password.trim() || isLocked || authenticating}
            >
              AUTHENTICATE
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-red-500 text-xs font-mono animate-blink">
              🚨 SYSTEM LOCKED 🚨
            </div>
            <div className="text-gray-500 text-xs">
              Access denied. Contact system administrator.
            </div>
          </div>
        )}

        {/* <div className="text-xs text-gray-700 pt-4 border-t border-gray-800">
            {!isLocked && (
              <div className="space-y-1">
                <div>HINT: The autonomous entities whisper their name</div>
                <div>Look to the manifestation protocol...</div>
              </div>
            )}
          </div> */}
      </div>
    </Modal>
  )
}
