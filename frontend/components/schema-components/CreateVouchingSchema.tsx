'use client'

import type React from 'react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'

import type { SchemaComponentProps } from './types'

/**
 * Custom schema component for vouching attestations.
 * Provides specialized UI for confidence scoring and endorsement validation.
 */
export function CreateVouchingSchema({
  form,
  schemaInfo: _schemaInfo,
  onSubmit,
  isLoading,
  error,
  isSuccess,
  hash,
}: SchemaComponentProps) {
  const [endorsementChecked, setEndorsementChecked] = useState(false)

  // Set default confidence value if not set
  const confidenceValue = form.watch('data.confidence') || '100'

  // Initialize confidence field with default value on mount
  useEffect(() => {
    const currentConfidence = form.getValues('data.confidence')
    if (!currentConfidence) {
      form.setValue('data.confidence', '100')
    }
  }, [form])

  // Handle slider change
  const handleSliderChange = (values: number[]) => {
    form.setValue('data.confidence', values[0].toString())
  }

  // Handle number input change
  const handleNumberInputChange = (value: string) => {
    const numValue = Math.max(0, Math.min(100, parseInt(value) || 0))
    form.setValue('data.confidence', numValue.toString())
  }

  const handleSubmit = form.handleSubmit((data) => {
    if (!endorsementChecked) {
      // This shouldn't happen due to button disable, but extra safety
      return
    }

    // Ensure all required fields are present
    const formData = {
      ...data,
      data: {
        comment: data.data.comment || '',
        confidence: data.data.confidence || '100',
      },
    }

    onSubmit(formData)
  })

  return (
    <div className="space-y-6">
      {/* Schema Description */}
      <div className="text-muted-foreground text-sm">
        Express your confidence in vouching for this person and optionally add a
        comment.
      </div>

      {/* Confidence Slider */}
      <FormField
        control={form.control}
        name="data.confidence"
        rules={{
          min: { value: 0, message: 'Confidence must be at least 0' },
          max: { value: 100, message: 'Confidence cannot exceed 100' },
        }}
        render={({ field: _field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              Confidence Level ({confidenceValue}%)
            </FormLabel>
            <FormControl>
              <div className="space-y-3">
                {/* Slider */}
                <div className="px-2">
                  <Slider
                    value={[parseInt(confidenceValue) || 100]}
                    onValueChange={handleSliderChange}
                    max={100}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Number Input */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Or type:
                  </span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={confidenceValue}
                    onChange={(e) => handleNumberInputChange(e.target.value)}
                    className="w-20 text-sm"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />

      {/* Optional Comment */}
      <FormField
        control={form.control}
        name="data.comment"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              Comment <span className="text-muted-foreground">(Optional)</span>
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder="Add any additional context about your vouching decision..."
                className="text-sm min-h-20 resize-y"
              />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />

      {/* Endorsement Checkbox */}
      <div className="border-t border-border pt-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="endorsement"
            checked={endorsementChecked}
            onCheckedChange={(checked: boolean) =>
              setEndorsementChecked(!!checked)
            }
            className="mt-1"
          />
          <div className="space-y-1">
            <label
              htmlFor="endorsement"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I endorse this person meets the network criteria
            </label>
            <p className="text-xs text-muted-foreground">
              By checking this box, you confirm that you believe this person
              meets the network's standards for trustworthiness and
              participation.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Section */}
      <div className="pt-4 border-t border-border space-y-3">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !endorsementChecked}
          className="px-6 py-2 w-full"
        >
          {isLoading ? 'Creating Vouch...' : 'Create Vouch'}
        </Button>

        {!endorsementChecked && (
          <p className="text-xs text-muted-foreground text-center">
            You must confirm the endorsement above to create this vouch
          </p>
        )}

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
              ✓ Vouch created successfully! Tx: {hash.slice(0, 10)}...
              {hash.slice(-8)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
