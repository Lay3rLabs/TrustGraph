'use client'

import clsx from 'clsx'
import { Check, LoaderCircle, X } from 'lucide-react'
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
import { useResolveEnsName } from '@/hooks/useEns'
import { Network } from '@/lib/network'
import { SCHEMAS, SchemaManager } from '@/lib/schemas'
import { mightBeEnsName } from '@/lib/utils'

import { CopyableText } from './CopyableText'
import { EnsIcon } from './icons/EnsIcon'
import { Tooltip } from './Tooltip'

interface CreateAttestationModalProps {
  trigger?: React.ReactNode
  title?: string
  onSuccess?: () => void
  isOpen?: boolean
  setIsOpen?: (value: boolean) => void
  network?: Network
  defaultRecipient?: string
}

export function CreateAttestationModal({
  trigger,
  title = 'Make Attestation',
  onSuccess,
  isOpen: externalIsOpen,
  setIsOpen: externalSetIsOpen,
  network,
  defaultRecipient = '',
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
      recipient: defaultRecipient,
      data: {},
    },
  })

  const recipient = form.watch('recipient', '')
  const shouldResolveEnsName = mightBeEnsName(recipient)
  const resolvedEnsName = useResolveEnsName(
    shouldResolveEnsName ? recipient : ''
  )
  const isResolvingEnsName = shouldResolveEnsName && resolvedEnsName.isLoading
  const validResolvedEnsAddress =
    shouldResolveEnsName &&
    !resolvedEnsName.isLoading &&
    !!resolvedEnsName.address
  const invalidResolvedEnsName =
    shouldResolveEnsName &&
    !resolvedEnsName.isLoading &&
    !resolvedEnsName.address

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
        recipient: defaultRecipient,
        data: {
          comment: '',
          confidence: '100',
        },
      })
    }
  }, [isOpen, clearTransactionState])

  const onSubmit = async (data: AttestationFormData) => {
    try {
      await createAttestation({
        ...data,
        recipient:
          (validResolvedEnsAddress && resolvedEnsName.address) ||
          data.recipient,
      })
    } catch (err) {
      console.error('Failed to create attestation:', err)
    }
  }

  const selectedSchemaKey = form.watch('schema')
  const selectedSchemaInfo = selectedSchemaKey
    ? SchemaManager.schemaForKey(selectedSchemaKey)
    : undefined

  const defaultTrigger = (
    <Tooltip
      title={!isConnected ? 'Connect your wallet to make attestations' : ''}
    >
      <Button onClick={() => setIsOpen(true)} disabled={!isConnected}>
        {title}
      </Button>
    </Tooltip>
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
        title={title}
        className="!max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-6">
          {/* Attestation Form */}
          <Form {...form}>
            <div className="flex flex-col gap-4">
              <div
                className={clsx(
                  'grid grid-cols-1 gap-4',
                  SCHEMAS.length > 1 && 'md:grid-cols-2'
                )}
              >
                <div className="flex flex-col gap-3">
                  <FormField
                    control={form.control}
                    name="recipient"
                    rules={{
                      required: 'Recipient is required',
                      pattern: shouldResolveEnsName
                        ? resolvedEnsName.isLoading || validResolvedEnsAddress
                          ? undefined
                          : {
                              value: /^$/,
                              message: 'Invalid ENS name',
                            }
                        : {
                            value: /^0x[a-fA-F0-9]{40}$/,
                            message: 'Invalid Ethereum address or ENS name',
                          },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold">
                          RECIPIENT
                        </FormLabel>
                        <FormControl>
                          <div className="h-10 w-full relative mt-1">
                            <Input
                              {...field}
                              placeholder="0x..."
                              className={clsx(
                                'text-sm h-full w-full',
                                shouldResolveEnsName && 'pr-9'
                              )}
                            />

                            {shouldResolveEnsName && (
                              <div className="absolute right-3 top-0 bottom-0 z-100 flex items-center">
                                <Tooltip
                                  title={
                                    invalidResolvedEnsName
                                      ? 'ENS name not found'
                                      : validResolvedEnsAddress
                                      ? 'ENS name resolved'
                                      : 'Resolving ENS name...'
                                  }
                                >
                                  {isResolvingEnsName ? (
                                    <LoaderCircle className="w-4 h-4 text-brand animate-spin" />
                                  ) : invalidResolvedEnsName ? (
                                    <X className="w-4 h-4 text-destructive" />
                                  ) : validResolvedEnsAddress ? (
                                    <Check className="w-4 h-4 text-brand" />
                                  ) : null}
                                </Tooltip>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {validResolvedEnsAddress && (
                    <div className="flex items-center gap-1.5 ml-2 md:hidden">
                      <EnsIcon className="w-5 h-5" />
                      <CopyableText
                        truncate
                        truncateEnds={[10, 8]}
                        text={resolvedEnsName.address}
                        className="text-brand text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Only show schema selection if there are multiple schemas */}
                {SCHEMAS.length > 1 && (
                  <FormField
                    control={form.control}
                    name="schema"
                    rules={{ required: 'Schema selection is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold">
                          SCHEMA
                        </FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value)}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="text-sm mt-1">
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
                )}
              </div>

              {validResolvedEnsAddress && (
                <div className="hidden md:flex items-center gap-2 -mt-2 ml-2">
                  <EnsIcon className="w-4 h-4" />
                  <CopyableText
                    truncate
                    truncateEnds={[7, 5]}
                    text={resolvedEnsName.address}
                    className="text-brand text-sm"
                  />
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
                        network={network}
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
                        network={network}
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="px-6 py-2 w-full"
                >
                  Cancel
                </Button>
              )}
            </div>
          </Form>
        </div>
      </Modal>
    </>
  )
}
