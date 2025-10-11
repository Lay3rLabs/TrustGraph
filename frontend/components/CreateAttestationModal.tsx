'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAccount, useConnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAttestation } from '@/hooks/useAttestation'
import { SCHEMAS, SchemaKey, SchemaManager } from '@/lib/schemas'

interface AttestationFormData {
  schema: SchemaKey
  recipient: string
  data: Record<string, string>
}

interface CreateAttestationModalProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
  isOpen?: boolean
  setIsOpen?: (value: boolean) => void
}

export function CreateAttestationModal({
  trigger,
  onSuccess,
  isOpen: externalIsOpen,
  setIsOpen: externalSetIsOpen,
}: CreateAttestationModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = (value: boolean) => {
    if (externalIsOpen !== undefined && externalSetIsOpen) {
      externalSetIsOpen(value)
    } else {
      setInternalIsOpen(value)
    }
  }

  const form = useForm<AttestationFormData>({
    defaultValues: {
      schema: 'recognition',
      recipient: '',
      data: {},
    },
  })

  const { isConnected } = useAccount()
  const { connect } = useConnect()
  const { createAttestation, isLoading, isSuccess, error, hash } =
    useAttestation()

  // Monitor transaction state
  useEffect(() => {
    if (hash && isSuccess) {
      console.log(`✅ Transaction successful: ${hash}`)
      onSuccess?.()
      setIsOpen(false)
      form.reset()
    }
  }, [hash, isSuccess, onSuccess, form])

  const handleConnect = () => {
    try {
      connect({ connector: injected() })
    } catch (err) {
      console.error('Failed to connect wallet:', err)
    }
  }

  const onSubmit = async (data: AttestationFormData) => {
    try {
      await createAttestation(data)
    } catch (err) {
      console.error('Failed to create attestation:', err)
    }
  }

  const selectedSchemaKey = form.watch('schema')
  const selectedSchemaInfo = selectedSchemaKey
    ? SchemaManager.schemaForKey(selectedSchemaKey)
    : undefined

  const defaultTrigger = (
    <Button className="px-6 py-2" onClick={() => setIsOpen(true)}>
      Create Attestation
    </Button>
  )

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        defaultTrigger
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create Attestation"
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-1 mb-6">
          <div className="text-muted-foreground text-sm">
            Create verifiable on-chain attestations
          </div>
        </div>

        <div className="space-y-6">
          {/* Wallet Connection Status */}
          {!isConnected && (
            <div className="border border-border bg-muted p-4 rounded-md">
              <div className="flex flex-col space-y-3">
                <div className="text-foreground text-center">
                  Wallet connection required
                </div>
                <Button onClick={handleConnect} className="px-4 py-2">
                  Connect Wallet
                </Button>
              </div>
            </div>
          )}

          {/* Attestation Form */}
          {isConnected && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recipient"
                    rules={{
                      required: 'Recipient address is required',
                      pattern: {
                        value: /^0x[a-fA-F0-9]{40}$/,
                        message: 'Invalid Ethereum address',
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Recipient Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="0x..."
                            className="text-sm"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="schema"
                    rules={{ required: 'Schema selection is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Schema Type
                        </FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value)}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select schema..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SCHEMAS.map((schema) => (
                              <SelectItem key={schema.key} value={schema.key}>
                                {schema.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedSchemaInfo && (
                  <div className="text-muted-foreground text-sm">
                    {SchemaManager.schemaHelperText(selectedSchemaInfo.key)}
                  </div>
                )}

                {selectedSchemaInfo?.fields.map(({ name, type }) => (
                  <FormField
                    key={selectedSchemaInfo.uid + ':' + name}
                    control={form.control}
                    name={`data.${name}`}
                    rules={{ required: `Field ${name} is required` }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          {name.charAt(0).toUpperCase() +
                            name.slice(1).replace(/([A-Z])/g, ' $1')}
                        </FormLabel>

                        <FormControl>
                          {type.startsWith('uint') ? (
                            <Input
                              {...field}
                              type="number"
                              className="text-sm"
                              required
                            />
                          ) : (
                            <Textarea
                              {...field}
                              className="text-sm min-h-20"
                              required
                            />
                          )}
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                )) || (
                  <p className="text-muted-foreground text-sm">
                    Select a schema to attest to.
                  </p>
                )}

                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                      disabled={isLoading}
                      className="px-6 py-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2 flex-1"
                    >
                      {isLoading ? 'Creating...' : 'Create Attestation'}
                    </Button>
                  </div>

                  {error && (
                    <div className="text-destructive text-sm border border-destructive/50 bg-destructive/10 p-3 rounded-md">
                      {error.message.toLowerCase().includes('nonce') ? (
                        <div className="space-y-1">
                          <div className="font-medium">
                            ⚠️ Nonce Conflict Detected
                          </div>
                          <div className="text-xs opacity-75">
                            Local network transaction ordering issue - retrying
                            automatically...
                          </div>
                        </div>
                      ) : error.message
                          .toLowerCase()
                          .includes('internal json-rpc error') ||
                        error.message
                          .toLowerCase()
                          .includes('internal error') ? (
                        <div className="space-y-1">
                          <div className="font-medium">🔧 Anvil Node Error</div>
                          <div className="text-xs opacity-75">
                            Local blockchain node issue - attempting automatic
                            recovery...
                          </div>
                          <div className="text-xs opacity-75 mt-1">
                            If this persists, restart anvil with:{' '}
                            <code className="bg-muted px-1 rounded">
                              make start-all-local
                            </code>
                          </div>
                        </div>
                      ) : (
                        <div>Error: {error.message}</div>
                      )}
                    </div>
                  )}

                  {isSuccess && hash && (
                    <div className="text-sm border border-green-600 bg-green-50 text-green-700 p-3 rounded-md">
                      <div>
                        ✓ Attestation created! Tx: {hash.slice(0, 10)}...
                        {hash.slice(-8)}
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </Form>
          )}
        </div>
      </Modal>
    </>
  )
}
