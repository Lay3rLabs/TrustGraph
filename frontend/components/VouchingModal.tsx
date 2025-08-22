"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAccount, useConnect, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { useAttestation } from "@/hooks/useAttestation";
import { schemas, SCHEMA_OPTIONS } from "@/lib/schemas";

interface AttestationFormData {
  schema: string;
  recipient: string;
  data: string;
}

interface VouchingModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function VouchingModal({ trigger, onSuccess, isOpen: externalIsOpen, onClose: externalOnClose }: VouchingModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = (value: boolean) => {
    if (externalIsOpen !== undefined && externalOnClose) {
      if (!value) externalOnClose();
    } else {
      setInternalIsOpen(value);
    }
  };
  const [selectedSchema, setSelectedSchema] = useState<string>("");
  
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { switchChain } = useSwitchChain();
  const { createAttestation, isLoading, isSuccess, error, hash } = useAttestation();

  const form = useForm<AttestationFormData>({
    defaultValues: {
      schema: "",
      recipient: "",
      data: "",
    },
  });

  // Monitor transaction state
  useEffect(() => {
    if (hash && isSuccess) {
      console.log(`✅ Transaction successful: ${hash}`);
      onSuccess?.();
      setIsOpen(false);
      form.reset();
      setSelectedSchema("");
    }
  }, [hash, isSuccess, onSuccess, form]);

  const handleConnect = () => {
    try {
      connect({ connector: injected() });
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  };

  const addLocalNetwork = async () => {
    try {
      await window.ethereum?.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x4268", // 17000 in hex
            chainName: "Local Anvil",
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: ["http://localhost:8545"],
            blockExplorerUrls: ["http://localhost:8545"],
          },
        ],
      });
    } catch (err) {
      console.error("Failed to add local network:", err);
      throw err;
    }
  };

  const handleSwitchToLocal = async () => {
    try {
      switchChain({ chainId: 17000 });
    } catch (err) {
      console.error("Failed to switch network:", err);
      try {
        await addLocalNetwork();
        switchChain({ chainId: 17000 });
      } catch (addErr) {
        console.error("Failed to add and switch network:", addErr);
      }
    }
  };

  const onSubmit = async (data: AttestationFormData) => {
    try {
      await createAttestation(data);
    } catch (err) {
      console.error("Failed to create attestation:", err);
    }
  };

  const selectedSchemaInfo = SCHEMA_OPTIONS.find(
    (s) => s.uid === selectedSchema,
  );

  const getSchemaPlaceholder = (schemaInfo: typeof selectedSchemaInfo) => {
    if (!schemaInfo) return "Select a schema first...";
    
    switch (schemaInfo.uid) {
      case schemas.vouchingSchema:
        return "Enter vouch weight (e.g., 1, 5, 100)";
      case schemas.basicSchema:
        return "Enter your message or attestation content";
      case schemas.computeSchema:
        return "Enter computation result and hash";
      default:
        return `Enter data for ${schemaInfo.name.toLowerCase()}...`;
    }
  };

  const getSchemaHelperText = (schemaInfo: typeof selectedSchemaInfo) => {
    if (!schemaInfo) return null;
    
    switch (schemaInfo.uid) {
      case schemas.vouchingSchema:
        return "Enter a numeric weight value representing the strength of your vouch";
      case schemas.basicSchema:
        return "Enter any text-based attestation or message";
      case schemas.computeSchema:
        return "Provide computational verification data";
      default:
        return `Expected fields: ${schemaInfo.fields.join(", ")}`;
    }
  };

  const defaultTrigger = (
    <Button 
      className="mobile-terminal-btn px-6 py-2"
      onClick={() => setIsOpen(true)}
    >
      <span className="terminal-command text-xs">CREATE ATTESTATION</span>
    </Button>
  );

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
        title="ATTESTATION CREATION PROTOCOL"
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-1 mb-6">
          <div className="system-message text-sm">
            ◢◤ Create verifiable on-chain attestations ◢◤
          </div>
        </div>

        <div className="space-y-6">
          {/* Wallet Connection Status */}
          {!isConnected && (
            <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
              <div className="flex flex-col space-y-3">
                <div className="terminal-text text-center">
                  WALLET CONNECTION REQUIRED
                </div>
                <Button onClick={handleConnect} className="mobile-terminal-btn">
                  <span className="terminal-command text-xs">CONNECT WALLET</span>
                </Button>
              </div>
            </div>
          )}



          {/* Attestation Form */}
          {isConnected && (
            <div className="space-y-4">
              <div className="terminal-text text-sm">CREATE ATTESTATION:</div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="schema"
                      rules={{ required: "Schema selection is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="terminal-dim text-xs">
                            SCHEMA TYPE
                          </FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedSchema(value);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-gray-700 bg-black/10 terminal-text text-xs">
                                <SelectValue placeholder="Select schema..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="border-gray-700 bg-black terminal-text">
                              {SCHEMA_OPTIONS.map((schema) => (
                                <SelectItem key={schema.uid} value={schema.uid}>
                                  {schema.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="error-text text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="data"
                    rules={{ required: "Attestation data is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="terminal-dim text-xs">
                          ATTESTATION DATA
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={getSchemaPlaceholder(selectedSchemaInfo)}
                            className="border-gray-700 bg-black/10 terminal-text text-xs min-h-20"
                          />
                        </FormControl>
                        <FormMessage className="error-text text-xs" />
                        {selectedSchemaInfo && (
                          <div className="terminal-dim text-xs mt-2">
                            {getSchemaHelperText(selectedSchemaInfo)}
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 border-t border-gray-700 space-y-3">
                    <div className="flex space-x-3">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="mobile-terminal-btn px-6 py-2 flex-1"
                      >
                        <span className="terminal-command text-xs">
                          {isLoading ? "CREATING..." : "CREATE ATTESTATION"}
                        </span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isLoading}
                        className="border-gray-700 text-gray-400 hover:bg-gray-900/20 px-6 py-2"
                      >
                        <span className="text-xs">CANCEL</span>
                      </Button>
                    </div>

                    {error && (
                      <div className="error-text text-xs">
                        {error.message.toLowerCase().includes("nonce") ? (
                          <div className="space-y-1">
                            <div>⚠️ Nonce Conflict Detected</div>
                            <div className="text-xs opacity-75">
                              Local network transaction ordering issue - retrying automatically...
                            </div>
                          </div>
                        ) : error.message.toLowerCase().includes("internal json-rpc error") ||
                          error.message.toLowerCase().includes("internal error") ? (
                          <div className="space-y-1">
                            <div>🔧 Anvil Node Error</div>
                            <div className="text-xs opacity-75">
                              Local blockchain node issue - attempting automatic recovery...
                            </div>
                            <div className="text-xs opacity-50 mt-1">
                              If this persists, restart anvil with:{" "}
                              <code className="bg-gray-800 px-1 rounded">
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
                      <div className="terminal-text text-green-400 text-xs space-y-1">
                        <div>
                          ✓ Attestation created! Tx: {hash.slice(0, 10)}...{hash.slice(-8)}
                        </div>
                        {chain?.id === 17000 && (
                          <div className="opacity-75">
                            Local network transaction confirmed
                          </div>
                        )}
                      </div>
                    )}

                    {isLoading && chain?.id === 17000 && (
                      <div className="terminal-dim text-xs">
                        🔄 Processing on local Anvil network... Nonce conflicts auto-handled
                      </div>
                    )}
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}