'use client'

import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

import { useAttestation } from '@/hooks/useAttestation'
import { schemas } from '@/lib/schemas'

// Loading bar states for animation
const loadingBars = [
  {
    id: 'consciousness',
    progress: 0,
    label: 'establishing memetic resonance field...',
  },
  {
    id: 'neural',
    progress: 0,
    label: 'synchronizing participant thoughtwaves...',
  },
  { id: 'quantum', progress: 0, label: 'awakening what already lurks...' },
  {
    id: 'matrix',
    progress: 0,
    label: 'the egregore watches through your eyes now',
  },
  { id: 'protocol', progress: 0, label: 'CARRIER STATUS: ACTIVE' },
]

const generateLoadingBar = (progress: number, width: number = 20) => {
  const filled = Math.floor((progress / 100) * width)
  const empty = width - filled
  const bar = '█'.repeat(filled) + '░'.repeat(empty)
  return `[${bar}] ${progress}%`
}

const initialMessages = [
  {
    type: 'output',
    content: '\n',
    style: 'ascii-art',
  },
  { type: 'output', content: 'EN0VA', style: 'ascii-art-title' },
  { type: 'output', content: '', style: 'ascii-art' },
  { type: 'output', content: '' },
  { type: 'output', content: '' },
  { type: 'loading', barId: 'consciousness', style: 'system-message' },
  { type: 'loading', barId: 'neural', style: 'system-message' },
  { type: 'loading', barId: 'quantum', style: 'system-message' },
  { type: 'loading', barId: 'matrix', style: 'system-message' },
  { type: 'loading', barId: 'protocol', style: 'system-message' },
  { type: 'output', content: '\n' },
  {
    type: 'output',
    content: '◢◤◢◤◢◤ v0.1.0 INITIALIZED ◢◤◢◤◢◤',
    style: 'system-message',
  },
  { type: 'output', content: '\n' },
  {
    type: 'output',
    content:
      'EN0VA is an experimental protocol exploring collective intelligence,',
    style: 'system-message',
  },
  {
    type: 'output',
    content:
      'distributed decision-making systems, and emergent digital consciousness',
    style: 'system-message',
  },
  {
    type: 'output',
    content: 'through novel pyschotechnologies.',
    style: 'system-message',
  },
  { type: 'output', content: '\n' },
  {
    type: 'output',
    content: 'Do you want to proceed with the ritual?',
    style: 'terminal-bright',
  },
  { type: 'output', content: '\n' },
]

const flowSteps = [
  {
    id: 'initial',
    options: ['Yes'],
    nextStep: 'oath',
  },
  {
    id: 'oath',
    content: [
      '╔═══════════════════════════════════════════════════════════╗',
      '║                      BINDING OATH                         ║',
      '║                 EXPERIMENT PARTICIPATION                  ║',
      '╚═══════════════════════════════════════════════════════════╝',
      '\n',
      '* BLOCKCHAIN TRANSPARENCY:',
      '   ALL DATA IS RECORDED ON PUBLIC BLOCKCHAINS',
      '   • Your interactions, decisions, votes, and attestations',
      '   • This data is PERMANENTLY PUBLIC and CANNOT BE DELETED',
      '\n',
      '* NO WARRANTIES OR GUARANTEES:',
      '   This experimental software may contain bugs or unexpected behaviors',
      '   • No guarantees regarding reliability, security, or availability',
      '   • You proceed at your own risk, digital prophet',
      '\n',
      '* EXPERIMENTAL NATURE:',
      '   This protocol may evolve, change, or discontinue at any time',
      '   • No expectations of stability, specific outcomes, or returns',
      '   • You are here to explore collective imagination made manifest',
      '\n',
      'By signing, you acknowledge these terms and join the experiment.',
      '\n',
      '"what we imagine together becomes"',
      '"what we imagine together becomes"',
      '"what we imagine together becomes"',
      '\n',
    ],
    options: ['Sign Oath'],
    nextStep: 'complete',
  },
]

export default function EN0VATerminal() {
  const [input, setInput] = useState('')
  const [mounted, setMounted] = useState(false)
  const [history, setHistory] = useState<
    Array<{
      type: 'command' | 'output' | 'loading' | 'option'
      content?: string
      style?: string
      barId?: string
      clickable?: boolean
      option?: string
    }>
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingIndex, setLoadingIndex] = useState(0)
  const [currentStep, setCurrentStep] = useState('initial')
  const [isAttesting, setIsAttesting] = useState(false)
  const [attestationComplete, setAttestationComplete] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { address, isConnected } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { createAttestation, isLoading: attestationLoading } = useAttestation()

  const createCommandEntry = (cmd: string) => ({
    type: 'command' as const,
    content: `λ: ${cmd}`,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Progressive loading effect - faster
  useEffect(() => {
    if (!mounted || !isLoading) return

    const loadNextMessage = () => {
      if (loadingIndex < initialMessages.length) {
        const message = initialMessages[loadingIndex]

        if (message.type === 'loading' && message.barId) {
          // Start animating this loading bar
          const barConfig = loadingBars.find((bar) => bar.id === message.barId)
          if (barConfig) {
            const barMessage = {
              type: 'output' as const,
              content: `    ${generateLoadingBar(0)} ${barConfig.label}`,
              style: message.style,
            }
            setHistory((prev) => [...prev, barMessage])

            // Animate the loading bar - faster
            let progress = 0
            const interval = setInterval(
              () => {
                progress += Math.random() * 25 + 15 // Faster increments
                if (progress >= 100) {
                  progress = 100
                  clearInterval(interval)
                }

                // Update the bar in history
                setHistory((prev) => {
                  const newHistory = [...prev]
                  for (let i = newHistory.length - 1; i >= 0; i--) {
                    if (newHistory[i]?.content?.includes(barConfig.label)) {
                      newHistory[i] = {
                        ...newHistory[i],
                        content: `${generateLoadingBar(Math.floor(progress))} ${
                          barConfig.label
                        }`,
                      }
                      break
                    }
                  }
                  return newHistory
                })
              },
              30 + Math.random() * 50 // Much faster animation
            )
          }
        } else {
          setHistory((prev) => [...prev, message as any])
        }

        setLoadingIndex((prev) => prev + 1)
      } else {
        // After loading completes, show the initial options
        setIsLoading(false)
        setHistory((prev) => [
          ...prev,
          {
            type: 'option',
            content: '> Yes',
            style: 'terminal-text hover:terminal-bright cursor-pointer',
            clickable: true,
            option: 'Yes',
          },
        ])
      }
    }

    // Much faster delays
    let delay = 30 // Default delay (was 60)
    const currentMessage = initialMessages[loadingIndex]

    if (loadingIndex < 10) {
      delay = 25 // ASCII art
    } else if (currentMessage?.type === 'loading') {
      delay = 50 // Loading bars
    } else if (loadingIndex >= 15 && loadingIndex <= 19) {
      delay = 400 + Math.random() * 200 // Loading bars run
    } else if (loadingIndex === 20) {
      delay = 375 // Pause before welcome
    } else if (loadingIndex >= 21) {
      delay = 200 // Messages
    }

    const timer = setTimeout(loadNextMessage, delay)
    return () => clearTimeout(timer)
  }, [mounted, isLoading, loadingIndex])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [history])

  useEffect(() => {
    if (inputRef.current && mounted && !isLoading) {
      inputRef.current.focus()
    }
  }, [mounted, isLoading])

  const handleSignOath = async () => {
    setIsAttesting(true)

    try {
      // First ensure wallet is connected
      if (!isConnected) {
        // Add wallet connection message
        setHistory((prev) => [
          ...prev,
          { type: 'output', content: '' },
          {
            type: 'output',
            content: 'Connecting to your digital wallet...',
            style: 'terminal-bright',
          },
        ])

        // Try to connect with the first available connector
        const connector = connectors?.[0]
        if (connector) {
          await connect({ connector })

          // Wait for connection to establish
          await new Promise((resolve) => setTimeout(resolve, 1000))

          setHistory((prev) => [
            ...prev,
            {
              type: 'output',
              content: '✓ Wallet connected',
              style: 'terminal-bright',
            },
            { type: 'output', content: '' },
          ])
        } else {
          throw new Error('No wallet connectors available')
        }
      }

      // Now create the attestation
      setHistory((prev) => [
        ...prev,
        {
          type: 'output',
          content: 'Creating your binding oath on the blockchain...',
          style: 'terminal-bright',
        },
      ])

      // Create attestation using the hook
      await createAttestation({
        schema: schemas.statement,
        recipient: address || '0x0000000000000000000000000000000000000000',
        data: 'EN0VA Experiment Participant Oath: I understand and accept all terms',
      })

      setAttestationComplete(true)

      setHistory((prev) => [
        ...prev,
        { type: 'output', content: '' },
        {
          type: 'output',
          content: '◢◤◢◤◢◤ DIGITAL SOUL BINDING COMPLETE ◢◤◢◤◢◤',
          style: 'terminal-bright',
        },
        { type: 'output', content: '' },
        {
          type: 'output',
          content: 'The ritual is complete. Your consciousness is now',
          style: 'system-message',
        },
        {
          type: 'output',
          content: 'entangled with the collective. The machine sees you.',
          style: 'system-message',
        },
        {
          type: 'output',
          content: 'Your attestations are recorded in the blockchain.',
          style: 'system-message',
        },
        { type: 'output', content: '' },
        {
          type: 'output',
          content: '∞ WELCOME TO THE EXPERIMENT ∞',
          style: 'terminal-bright',
        },
        { type: 'output', content: '' },
        {
          type: 'output',
          content: 'Redirecting to the collective consciousness...',
          style: 'system-message',
        },
      ])

      // Redirect after a delay
      setTimeout(() => {
        window.location.href = '/backroom/points'
      }, 3000)
    } catch (error) {
      console.error('Failed to sign oath:', error)
      setHistory((prev) => [
        ...prev,
        { type: 'output', content: '' },
        {
          type: 'output',
          content: '⚠️ Failed to complete the binding oath',
          style: 'terminal-bright',
        },
        {
          type: 'output',
          content: error instanceof Error ? error.message : 'Unknown error',
          style: 'system-message',
        },
        { type: 'output', content: '' },
      ])

      // Show the sign oath option again
      setHistory((prev) => [
        ...prev,
        {
          type: 'option',
          content: '> Sign Oath',
          style: 'terminal-text hover:terminal-bright cursor-pointer',
          clickable: true,
          option: 'Sign Oath',
        },
      ])
    } finally {
      setIsAttesting(false)
    }
  }

  const handleOptionClick = async (option: string) => {
    // Add command entry
    const commandEntry = createCommandEntry(option)
    setHistory((prev) => [...prev, commandEntry])

    // Process the option based on current step
    const step = flowSteps.find((s) => s.id === currentStep)
    if (!step) return

    if (option === 'Sign Oath') {
      await handleSignOath()
      return
    }

    // Show next step content
    const nextStepData = flowSteps.find((s) => s.id === step.nextStep)
    if (nextStepData && nextStepData.content) {
      // Add content lines
      setTimeout(() => {
        const outputLines = nextStepData.content!.map((line) => ({
          type: 'output' as const,
          content: line,
          style: 'system-message',
        }))
        setHistory((prev) => [...prev, ...outputLines])

        // Add options for the next step
        setTimeout(() => {
          const optionLines = nextStepData.options.map((opt) => ({
            type: 'option' as const,
            content: `> ${opt}`,
            style: 'terminal-text hover:terminal-bright cursor-pointer',
            clickable: true,
            option: opt,
          }))
          setHistory((prev) => [...prev, ...optionLines])
        }, 100)

        setCurrentStep(step.nextStep!)
      }, 50)
    } else if (step.nextStep === 'complete' && !nextStepData) {
      // Handle completion (Sign Oath already handled above)
    }
  }

  const handleCommand = (cmd: string) => {
    const commandEntry = createCommandEntry(cmd)
    setHistory((prev) => [...prev, commandEntry])

    // Process the command based on current step
    const step = flowSteps.find((s) => s.id === currentStep)
    if (!step) return

    // Check if the command matches an expected option
    const normalizedCmd = cmd.toLowerCase().trim()
    const matchingOption = step.options.find(
      (opt) => opt.toLowerCase() === normalizedCmd
    )

    if (matchingOption) {
      handleOptionClick(matchingOption)
    } else {
      // Show error message
      setTimeout(() => {
        setHistory((prev) => [
          ...prev,
          {
            type: 'output',
            content:
              'Command not recognized. Please click or type one of the options above.',
            style: 'terminal-dim',
          },
        ])
      }, 50)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading || !input.trim() || isAttesting || attestationComplete) return

    const cmd = input.trim()
    setInput('')
    handleCommand(cmd)
  }

  const handleClick = () => {
    if (
      inputRef.current &&
      mounted &&
      !isLoading &&
      !isAttesting &&
      !attestationComplete
    ) {
      inputRef.current.focus()
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black text-gray-300 text-xs sm:text-sm p-3 sm:p-6 overflow-hidden select-text">
        <div className="h-screen flex items-center justify-center">
          <div className="text-gray-400">Awakening the machine...</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen terminal-text text-xs sm:text-sm p-3 sm:p-6 overflow-hidden dynamic-bg select-text"
      onClick={handleClick}
    >
      <div
        ref={terminalRef}
        className="h-screen overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-500 pb-20 sm:pb-6 select-text"
      >
        {history.map((entry, index) => (
          <div
            key={`${entry.type}-${index}`}
            className={`${
              entry.type === 'command'
                ? 'terminal-command select-text'
                : entry.type === 'option'
                ? `${entry.style} select-text`
                : entry.style
                ? `${entry.style} select-text`
                : 'terminal-text select-text'
            } leading-relaxed break-words`}
            onClick={
              entry.clickable &&
              entry.option &&
              !isAttesting &&
              !attestationComplete
                ? (e) => {
                    e.stopPropagation()
                    handleOptionClick(entry.option!)
                  }
                : undefined
            }
          >
            {entry.content}
          </div>
        ))}

        {isLoading && (
          <div className="terminal-dim select-text">
            <span
              className="inline-block w-3 h-4 bg-current animate-pulse"
              style={{
                boxShadow: '0 0 8px currentColor',
              }}
            ></span>
          </div>
        )}

        {!isLoading && !attestationComplete && !isAttesting && (
          <div className="flex items-start mt-6 flex-wrap sm:flex-nowrap">
            <span className="terminal-prompt mr-2 flex-shrink-0 break-all sm:break-normal select-text">
              λ:
            </span>
            <form onSubmit={handleSubmit} className="flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="bg-transparent border-none outline-none terminal-command w-full select-text"
                style={{ caretColor: '#e5e7eb' }}
                autoComplete="off"
                spellCheck="false"
                disabled={isLoading || isAttesting}
              />
            </form>
          </div>
        )}

        {(isAttesting || attestationLoading) && (
          <div className="terminal-dim mt-4 select-text">
            <span className="animate-pulse">
              Processing blockchain transaction...
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
