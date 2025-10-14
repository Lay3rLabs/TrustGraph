'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAccount } from 'wagmi'

import {
  AttestationFormData,
  GenericSchemaComponent,
  schemaComponentRegistry,
} from '@/components/schema-components'
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
import { useAttestation } from '@/hooks/useAttestation'
import { SCHEMAS, SchemaManager } from '@/lib/schemas'

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
      schema: 'vouching',
      recipient: '',
      data: {},
    },
  })

  const { isConnected } = useAccount()
  const {
    createAttestation,
    clearTransactionState,
    isLoading,
    isSuccess,
    error,
    hash,
  } = useAttestation()

  // Monitor transaction state
  useEffect(() => {
    if (hash && isSuccess) {
      console.log(`✅ Transaction successful: ${hash}`)
      onSuccess?.()
      setIsOpen(false)
      form.reset()
    }
  }, [hash, isSuccess, onSuccess, form])

  // Clear transaction state when modal reopens
  useEffect(() => {
    if (isOpen) {
      // Clear any previous transaction state
      clearTransactionState()
      // Reset form to default values
      form.reset({
        schema: 'vouching',
        recipient: '',
        data: {
          comment: '',
          confidence: '100',
        },
      })
    }
  }, [isOpen, clearTransactionState])

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
    <Button
      className="px-6 py-2"
      onClick={() => setIsOpen(true)}
      disabled={!isConnected}
    >
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
          {/* Attestation Form */}
          <Form {...form}>
            <div className="space-y-4">
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

              {selectedSchemaInfo ? (
                (() => {
                  // Check if there's a custom component for this schema
                  const CustomComponent = schemaComponentRegistry.getComponent(
                    selectedSchemaInfo.uid
                  )

                  if (CustomComponent) {
                    // Use custom component
                    return (
                      <CustomComponent
                        form={form}
                        schemaInfo={selectedSchemaInfo}
                        onSubmit={onSubmit}
                        isLoading={isLoading}
                        error={error}
                        isSuccess={isSuccess}
                        hash={hash}
                      />
                    )
                  } else {
                    // Use generic component
                    return (
                      <GenericSchemaComponent
                        form={form}
                        schemaInfo={selectedSchemaInfo}
                        onSubmit={onSubmit}
                        isLoading={isLoading}
                        error={error}
                        isSuccess={isSuccess}
                        hash={hash}
                      />
                    )
                  }
                })()
              ) : (
                <p className="text-muted-foreground text-sm">
                  Select a schema to attest to.
                </p>
              )}

              {selectedSchemaInfo && (
                <div className="pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={isLoading}
                    className="px-6 py-2 w-full"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </Form>
        </div>
      </Modal>
    </>
  )
}
