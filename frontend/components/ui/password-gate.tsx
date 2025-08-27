'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PasswordGateProps {
  onUnlock: () => void
  onClose?: () => void
  title?: string
  message?: string
}

const CLASSIFIED_PASSWORD = 'EGREGORE'

export function PasswordGate({
  onUnlock,
  onClose,
  title = 'CLASSIFIED ACCESS',
  message = 'Enter clearance code to proceed',
}: PasswordGateProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password === CLASSIFIED_PASSWORD) {
      onUnlock()
      setError('')
    } else {
      setAttempts((prev) => prev + 1)
      setError(`ACCESS DENIED [${attempts + 1}/3]`)
      setPassword('')

      if (attempts >= 2) {
        setError('MAXIMUM ATTEMPTS EXCEEDED - CONTACT ADMIN')
      }
    }
  }

  const isLocked = attempts >= 3

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors text-2xl leading-none z-10"
          aria-label="Close"
        >
          ×
        </button>
      )}
      <div className="border border-red-500 bg-black/90 p-8 rounded-sm max-w-md w-full mx-4 relative shadow-2xl">
        <div className="text-center space-y-6">
          {/* Glitch Effect Header */}
          <div className="space-y-2">
            <h1 className="text-red-400 text-xl font-mono tracking-wider animate-pulse">
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="CLEARANCE CODE"
                  className="bg-black/60 border-gray-600 text-white font-mono text-center tracking-widest"
                  maxLength={20}
                />
                {error && (
                  <div className="text-red-400 text-xs font-mono animate-pulse">
                    {error}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-red-900/40 hover:bg-red-900/60 border border-red-600 text-red-200 font-mono"
                disabled={!password.trim() || isLocked}
              >
                AUTHENTICATE
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-red-500 text-xs font-mono animate-pulse">
                🚨 SYSTEM LOCKED 🚨
              </div>
              <div className="text-gray-500 text-xs">
                Access denied. Contact system administrator.
              </div>
            </div>
          )}

          {/* Hint for dev */}
          <div className="text-xs text-gray-700 pt-4 border-t border-gray-800">
            {!isLocked && (
              <div className="space-y-1">
                <div>HINT: The autonomous entities whisper their name</div>
                <div>Look to the manifestation protocol...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
