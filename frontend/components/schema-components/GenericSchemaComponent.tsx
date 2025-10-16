'use client'

import type React from 'react'

import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import type { SchemaComponentProps } from './types'

/**
 * Generic schema component that dynamically renders form fields
 * based on the schema definition. Used as fallback for schemas
 * that don't have custom components.
 */
export function GenericSchemaComponent({
  form,
  schemaInfo,
  onSubmit,
  isLoading,
  error,
  isSuccess,
  hash,
}: SchemaComponentProps) {
  const handleSubmit = form.handleSubmit(onSubmit)

  return (
    <div className="space-y-4">
      {/* Dynamic Schema Fields */}
      {schemaInfo.fields.map(({ name, type }) => (
        <FormField
          key={schemaInfo.uid + ':' + name}
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
                  <Textarea {...field} className="text-sm min-h-20" required />
                )}
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      ))}

      {/* Submit Section */}
      <div className="pt-4 border-t border-border space-y-3">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-2 w-full"
        >
          {isLoading ? 'Creating...' : 'Create Attestation'}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="text-destructive text-sm border border-destructive/50 bg-destructive/10 p-3 rounded-md">
            {error.message.toLowerCase().includes('nonce') ? (
              <div className="space-y-1">
                <div className="font-medium">⚠️ Nonce Conflict Detected</div>
                <div className="text-xs opacity-75">
                  Local network transaction ordering issue - retrying
                  automatically...
                </div>
              </div>
            ) : error.message
                .toLowerCase()
                .includes('internal json-rpc error') ||
              error.message.toLowerCase().includes('internal error') ? (
              <div className="space-y-1">
                <div className="font-medium">🔧 Anvil Node Error</div>
                <div className="text-xs opacity-75">
                  Local blockchain node issue - attempting automatic recovery...
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

        {/* Success Display */}
        {isSuccess && hash && (
          <div className="text-sm border border-green-600 bg-green-50 text-green-700 p-3 rounded-md">
            <div>
              ✓ Attestation created! Tx: {hash.slice(0, 10)}...
              {hash.slice(-8)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
