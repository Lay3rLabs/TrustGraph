'use client'

import clsx from 'clsx'
import { Check, LoaderCircle, X } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Hex } from 'viem'
import { useAccount } from 'wagmi'

import { Button, ButtonProps } from '@/components/Button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/Form'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import {
  AttestationFormData,
  GenericSchemaComponent,
  schemaComponentRegistry,
} from '@/components/schema-components'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/Select'
import { useAccountNetworkProfile } from '@/hooks/useAccountProfile'
import { useAttestation } from '@/hooks/useAttestation'
import { useResolveEnsName } from '@/hooks/useEns'
import { useNetwork } from '@/hooks/useNetwork'
import { AttestationData } from '@/lib/attestation'
import { parseErrorMessage } from '@/lib/error'
import { Network } from '@/lib/network'
import { SCHEMAS, SchemaManager } from '@/lib/schemas'
import {
  areAddressesEqual,
  formatBigNumber,
  formatPercentage,
  mightBeEnsName,
} from '@/lib/utils'

import { Card } from './Card'
import { CopyableText } from './CopyableText'
import { EnsIcon } from './icons/EnsIcon'
import { Markdown } from './Markdown'
import { Column, Table } from './Table'
import { Tooltip } from './Tooltip'

interface CreateAttestationModalProps {
  trigger?: React.ReactNode
  title?: string
  onSuccess?: () => void
  isOpen?: boolean
  setIsOpen?: (value: boolean) => void
  network?: Network
  defaultRecipient?: string
  variant?: ButtonProps['variant']
  className?: string
}

export function CreateAttestationModal({
  trigger,
  title = 'Make Attestation',
  onSuccess,
  isOpen: externalIsOpen,
  setIsOpen: externalSetIsOpen,
  network,
  defaultRecipient = '',
  variant = 'default',
  className,
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

  const { address: connectedAddress = '0x', isConnected } = useAccount()
  const { totalValue } = useNetwork()
  const { networkProfile, allAttestationsGiven } =
    useAccountNetworkProfile(connectedAddress)
  const {
    createAttestation,
    revokeAttestation,
    clearTransactionState,
    isCreating,
    isCreated,
    isRevoking,
    error,
    hash,
  } = useAttestation()

  const noteText =
    totalValue > 0 && networkProfile && networkProfile.trustScore !== '0'
      ? '**Note:**\n' +
        [
          (networkProfile.attestationsGiven > 0 ? '- ' : '') +
            `Your **TrustScore** determines how much influence your attestations carry — currently **${formatPercentage(
              (Number(networkProfile.trustScore) / totalValue) * 100
            )} of total network trust**.`,
          ...(networkProfile.attestationsGiven > 0
            ? [
                `- You've made **${formatBigNumber(
                  networkProfile.attestationsGiven,
                  undefined,
                  true
                )} attestations** — adding another will reduce each attestation's weight by **${formatPercentage(
                  (1 / networkProfile.attestationsGiven -
                    1 / (networkProfile.attestationsGiven + 1)) *
                    100
                )}**.`,
              ]
            : []),
        ].join('\n')
      : null

  const [isRevokingUid, setIsRevokingUid] = useState<Hex | null>(null)
  const [revoked, setRevoked] = useState<Record<Hex, boolean>>({})
  const handleRevoke = async (
    e: React.MouseEvent,
    attestation: AttestationData
  ) => {
    e.stopPropagation() // Prevent card click when revoking

    setIsRevokingUid(attestation.uid)
    try {
      await revokeAttestation(attestation.uid, attestation.schema)
      setRevoked((r) => ({ ...r, [attestation.uid]: true }))
    } catch (err) {
      console.error('Failed to revoke attestation:', err)
      toast.error(parseErrorMessage(err))
    } finally {
      setIsRevokingUid(null)
    }
  }

  // Monitor transaction state
  useEffect(() => {
    if (hash && isCreated) {
      console.log(`✅ Transaction successful: ${hash}`)
      onSuccess?.()
      setIsOpen(false)
      form.reset()
    }
  }, [hash, isCreated, onSuccess, form])

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
      <Button
        onClick={() => setIsOpen(true)}
        disabled={!isConnected}
        variant={variant}
        className={className}
      >
        {title}
      </Button>
    </Tooltip>
  )

  const attestationsGivenToRecipient =
    recipient.startsWith('0x') && selectedSchemaInfo
      ? allAttestationsGiven.filter(
          (attestation) =>
            areAddressesEqual(attestation.recipient, recipient as Hex) &&
            areAddressesEqual(attestation.schema, selectedSchemaInfo.uid) &&
            // At least 10 seconds old, so we don't show the one we just made.
            attestation.time < BigInt(Math.floor(Date.now() / 1000) - 10)
        )
      : []

  const attestationsGivenColumns: Column<AttestationData>[] = [
    {
      key: 'confidence',
      header: 'CONFIDENCE',
      tooltip: 'The strength of the attestation as specified by the attester.',
      sortable: true,
      accessor: (row) => Number(row.decodedData?.confidence || '0'),
      render: (row) =>
        formatBigNumber(row.decodedData?.confidence || '0', undefined, true),
    },
    {
      key: 'time',
      header: 'TIME',
      tooltip: 'The time the attestation was made.',
      sortable: true,
      accessor: (row) => Number(row.time),
      render: (row) => (
        <div className="text-gray-800">
          <div>{row.formattedTime}</div>
          <div className="text-xs text-gray-600">{row.formattedTimeAgo}</div>
        </div>
      ),
    },
    {
      key: 'revoke',
      header: 'REVOKE',
      tooltip: 'Revoke the attestation.',
      render: (row) => (
        <button
          onClick={(e) => handleRevoke(e, row)}
          disabled={isRevoking || isRevokingUid === row.uid || revoked[row.uid]}
          className="px-3 py-1 bg-destructive/80 text-destructive-foreground rounded-md text-xs font-medium hover:bg-destructive/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRevokingUid === row.uid
            ? 'Revoking...'
            : revoked[row.uid]
            ? 'Revoked'
            : 'Revoke'}
        </button>
      ),
    },
  ]

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
              {noteText && (
                <Card type="accent" size="sm">
                  <Markdown className="text-sm gap-1">{noteText}</Markdown>
                </Card>
              )}

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

              {attestationsGivenToRecipient.length > 0 && (
                <Card type="outline" size="sm" className="border-yellow-700">
                  <p className="text-sm text-yellow-700">
                    <span className="font-bold">Note:</span> You may want to
                    revoke your other attestation
                    {attestationsGivenToRecipient.length > 1 ? 's' : ''} for
                    this recipient before making a new one.
                  </p>

                  <Table
                    columns={attestationsGivenColumns}
                    data={attestationsGivenToRecipient}
                    cellClassName="text-sm !py-2"
                    defaultSortColumn="time"
                    defaultSortDirection="desc"
                    onRowClick={(row) =>
                      window.open(`/attestation/${row.uid}`, '_blank')
                    }
                    getRowKey={(row) => row.uid}
                  />
                </Card>
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
                        isLoading={isCreating}
                        error={error}
                        isSuccess={isCreated}
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
                        isLoading={isCreating}
                        error={error}
                        isSuccess={isCreated}
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
                  disabled={isCreating || isRevoking}
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
