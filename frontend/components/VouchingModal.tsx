"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAttestation } from "@/hooks/useAttestation";
import { schemas } from "@/lib/schemas";

interface VouchingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VouchingFormData {
  recipient: string;
  weight: string;
}

export function VouchingModal({ isOpen, onClose }: VouchingModalProps) {
  const { createAttestation, isLoading, isSuccess, error, hash } = useAttestation();
  
  const form = useForm<VouchingFormData>({
    defaultValues: {
      recipient: "",
      weight: "1",
    },
  });

  const onSubmit = async (data: VouchingFormData) => {
    try {
      // Create attestation data in the format expected by the vouching schema
      const attestationData = {
        schema: schemas.vouchingSchema,
        recipient: data.recipient,
        data: data.weight, // Simple weight value - will be ABI encoded by the hook
      };
      
      await createAttestation(attestationData);
      
      if (isSuccess) {
        form.reset();
        onClose();
      }
    } catch (err) {
      console.error("Failed to create vouching attestation:", err);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      form.reset();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="CREATE VOUCHING ATTESTATION">
      <div className="space-y-6">
        {/* Schema Info */}
        <div className="border border-gray-700 bg-black/10 p-3 rounded-sm">
          <div className="space-y-1">
            <div className="terminal-command text-xs">VOUCHING SCHEMA</div>
            <div className="terminal-dim text-xs">
              Create a cryptographic vouch for another user with a specified weight
            </div>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipient"
              rules={{
                required: "Recipient address is required",
                pattern: {
                  value: /^0x[a-fA-F0-9]{40}$/,
                  message: "Invalid Ethereum address",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="terminal-dim text-xs">
                    RECIPIENT ADDRESS
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="0x..."
                      className="border-gray-700 bg-black/10 terminal-text text-xs"
                    />
                  </FormControl>
                  <FormMessage className="error-text text-xs" />
                  <div className="terminal-dim text-xs">
                    The Ethereum address you are vouching for
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weight"
              rules={{
                required: "Weight is required",
                pattern: {
                  value: /^[1-9]\d*$/,
                  message: "Weight must be a positive integer",
                },
                validate: (value) => {
                  const num = parseInt(value);
                  if (num < 1 || num > 1000) {
                    return "Weight must be between 1 and 1000";
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="terminal-dim text-xs">
                    VOUCH WEIGHT
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      max="1000"
                      placeholder="1"
                      className="border-gray-700 bg-black/10 terminal-text text-xs"
                    />
                  </FormControl>
                  <FormMessage className="error-text text-xs" />
                  <div className="terminal-dim text-xs">
                    Strength of your vouch (1-1000). Higher values indicate stronger trust.
                  </div>
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-gray-700">
              <Button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-400 hover:bg-gray-900/20 text-xs"
              >
                <span className="terminal-command text-xs">CANCEL</span>
              </Button>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 mobile-terminal-btn px-4 py-2"
              >
                <span className="terminal-command text-xs">
                  {isLoading ? "CREATING..." : "CREATE VOUCH"}
                </span>
              </Button>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="border border-red-700 bg-red-900/10 p-3 rounded-sm">
                <div className="error-text text-xs">
                  {error.message.toLowerCase().includes("nonce") ? (
                    <div className="space-y-1">
                      <div>⚠️ Nonce Conflict Detected</div>
                      <div className="text-xs opacity-75">
                        Network transaction ordering issue - retrying automatically...
                      </div>
                    </div>
                  ) : error.message.toLowerCase().includes("internal json-rpc error") ||
                    error.message.toLowerCase().includes("internal error") ? (
                    <div className="space-y-1">
                      <div>🔧 Network Error</div>
                      <div className="text-xs opacity-75">
                        Blockchain connection issue - please try again
                      </div>
                    </div>
                  ) : (
                    <div>Error: {error.message}</div>
                  )}
                </div>
              </div>
            )}

            {isSuccess && hash && (
              <div className="border border-green-700 bg-green-900/10 p-3 rounded-sm">
                <div className="terminal-text text-green-400 text-xs space-y-1">
                  <div>✓ Vouching attestation created successfully!</div>
                  <div className="opacity-75">
                    Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
                  </div>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </Modal>
  );
}