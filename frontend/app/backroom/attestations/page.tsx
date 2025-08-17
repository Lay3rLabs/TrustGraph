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
import { useAttestation } from "@/hooks/useAttestation";
import { attesterAddress } from "@/lib/contracts";
import { schemas, SCHEMA_OPTIONS } from "@/lib/schemas";

interface AttestationFormData {
  schema: string;
  recipient: string;
  data: string;
}

export default function AttestationsPage() {
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { switchChain } = useSwitchChain();
  const { createAttestation, isLoading, isSuccess, error, hash } =
    useAttestation();
  const [selectedSchema, setSelectedSchema] = useState<string>("");
  const [diagnosticResults, setDiagnosticResults] = useState<{
    status: "idle" | "running" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  // Component initialization
  useEffect(() => {
    // Component mounted
  }, []);

  // Monitor transaction state
  useEffect(() => {
    if (hash && isSuccess) {
      console.log(`✅ Transaction successful: ${hash}`);
    }
  }, [hash, isSuccess]);

  const form = useForm<AttestationFormData>({
    defaultValues: {
      schema: "",
      recipient: "",
      data: "",
    },
  });

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
      // First try to switch
      switchChain({ chainId: 17000 });
    } catch (err) {
      console.error("Failed to switch network:", err);
      // If switching fails, try adding the network first
      try {
        await addLocalNetwork();
        // Then try switching again
        switchChain({ chainId: 17000 });
      } catch (addErr) {
        console.error("Failed to add and switch network:", addErr);
      }
    }
  };

  const onSubmit = async (data: AttestationFormData) => {
    try {
      await createAttestation(data);
      form.reset();
    } catch (err) {
      console.error("Failed to create attestation:", err);
    }
  };

  const runAnvilDiagnostics = async () => {
    setDiagnosticResults({
      status: "running",
      message: "Testing Anvil node...",
    });

    try {
      // Starting Anvil health check...

      // Test 1: Basic RPC connectivity
      const response = await fetch("http://localhost:8545", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const blockNumber = parseInt(data.result, 16);

      // Test 2: Get account balance
      const balanceResponse = await fetch("http://localhost:8545", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBalance",
          params: [address, "latest"],
          id: 2,
        }),
      });

      const balanceData = await balanceResponse.json();
      const balance = parseInt(balanceData.result, 16) / 1e18;

      // Test 3: Check contract deployment
      const codeResponse = await fetch("http://localhost:8545", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getCode",
          params: [attesterAddress, "latest"],
          id: 3,
        }),
      });

      const codeData = await codeResponse.json();
      const hasContract = codeData.result && codeData.result !== "0x";

      setDiagnosticResults({
        status: "success",
        message: `✅ Anvil healthy! Block: ${blockNumber}, Balance: ${balance.toFixed(4)} ETH, Contract: ${hasContract ? "Deployed" : "Not found"}`,
      });
    } catch (error) {
      console.error("Anvil health check failed:", error);
      setDiagnosticResults({
        status: "error",
        message: `❌ Anvil error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  };

  const selectedSchemaInfo = SCHEMA_OPTIONS.find(
    (s) => s.uid === selectedSchema,
  );

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="terminal-command text-lg">ATTESTATION PROTOCOLS</div>
        <div className="system-message">
          ◢◤ Truth verification through cryptographic consensus ◢◤
        </div>
      </div>

      {/* Wallet Connection Status */}
      {!isConnected && (
        <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
          <div className="flex items-center justify-between">
            <div className="terminal-text">WALLET CONNECTION REQUIRED</div>
            <Button onClick={handleConnect} className="mobile-terminal-btn">
              <span className="terminal-command text-xs">CONNECT WALLET</span>
            </Button>
          </div>
        </div>
      )}

      {/* Anvil Diagnostics Results */}
      {diagnosticResults.status !== "idle" && chain?.id === 17000 && (
        <div
          className={`border p-4 rounded-sm ${
            diagnosticResults.status === "success"
              ? "border-green-800 bg-green-900/10"
              : diagnosticResults.status === "error"
                ? "border-red-800 bg-red-900/10"
                : "border-yellow-800 bg-yellow-900/10"
          }`}
        >
          <div
            className={`text-xs ${
              diagnosticResults.status === "success"
                ? "text-green-400"
                : diagnosticResults.status === "error"
                  ? "text-red-400"
                  : "text-yellow-400"
            }`}
          >
            {diagnosticResults.message}
          </div>
          {diagnosticResults.status === "error" && (
            <div className="text-xs opacity-75 mt-1">
              Try restarting anvil:{" "}
              <code className="bg-gray-800 px-1 rounded">
                make start-all-local
              </code>
            </div>
          )}
        </div>
      )}

      {isConnected && (
        <div className="border border-green-800 bg-green-900/10 p-4 rounded-sm">
          <div className="flex flex-col space-y-2">
            <div className="terminal-text text-green-400">
              CONNECTED: {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
            <div className="flex items-center justify-between">
              <div className="terminal-dim text-xs">
                NETWORK: {chain?.name || "Unknown"} (ID:{" "}
                {chain?.id || "Unknown"})
              </div>
              <div className="flex space-x-2">
                {chain?.id !== 17000 && (
                  <>
                    <Button
                      onClick={addLocalNetwork}
                      variant="outline"
                      size="sm"
                      className="border-blue-600 text-blue-400 hover:bg-blue-900/20 text-xs"
                    >
                      ADD LOCAL
                    </Button>
                    <Button
                      onClick={handleSwitchToLocal}
                      variant="outline"
                      size="sm"
                      className="border-amber-600 text-amber-400 hover:bg-amber-900/20 text-xs"
                    >
                      SWITCH TO LOCAL
                    </Button>
                  </>
                )}
                {chain?.id === 17000 && (
                  <div className="flex items-center space-x-2">
                    <div className="terminal-text text-green-400 text-xs">
                      ✓ LOCAL ANVIL
                    </div>
                    <Button
                      onClick={runAnvilDiagnostics}
                      disabled={diagnosticResults.status === "running"}
                      variant="outline"
                      size="sm"
                      className="border-green-600 text-green-400 hover:bg-green-900/20 text-xs h-6 px-2"
                    >
                      {diagnosticResults.status === "running"
                        ? "TESTING..."
                        : "TEST NODE"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schema selection */}
      <div className="space-y-4">
        <div className="terminal-text">AVAILABLE SCHEMAS:</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {SCHEMA_OPTIONS.map((schema) => (
            <div
              key={schema.uid}
              className="border border-gray-700 bg-black/10 p-4 rounded-sm"
            >
              <div className="space-y-2">
                <div className="terminal-command text-sm">{schema.name}</div>
                <div className="terminal-dim text-xs">
                  UID: {schema.uid.slice(0, 10)}...
                </div>
                <div className="terminal-dim text-xs">{schema.description}</div>
                <div className="space-y-1">
                  <div className="terminal-dim text-xs">Fields:</div>
                  {schema.fields.map((field) => (
                    <div key={field} className="terminal-text text-xs ml-2">
                      • {field}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attestation form */}
      <div className="space-y-4">
        <div className="terminal-text">CREATE NEW ATTESTATION:</div>
        <div className="border border-gray-700 bg-black/5 p-6 rounded-sm">
          {isConnected ? (
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
                          SCHEMA UID
                        </FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedSchema(value);
                          }}
                          defaultValue={field.value}
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
                          placeholder={
                            selectedSchemaInfo
                              ? `Enter data for ${selectedSchemaInfo.name.toLowerCase()}...`
                              : "Select a schema first..."
                          }
                          className="border-gray-700 bg-black/10 terminal-text text-xs min-h-24"
                        />
                      </FormControl>
                      <FormMessage className="error-text text-xs" />
                      {selectedSchemaInfo && (
                        <div className="terminal-dim text-xs mt-2">
                          Expected fields:{" "}
                          {selectedSchemaInfo.fields.join(", ")}
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <div className="pt-4 border-t border-gray-700">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="mobile-terminal-btn px-6 py-2"
                  >
                    <span className="terminal-command text-xs">
                      {isLoading ? "CREATING..." : "CREATE ATTESTATION"}
                    </span>
                  </Button>

                  {error && (
                    <div className="error-text text-xs mt-2">
                      {error.message.toLowerCase().includes("nonce") ? (
                        <div className="space-y-1">
                          <div>⚠️ Nonce Conflict Detected</div>
                          <div className="text-xs opacity-75">
                            Local network transaction ordering issue - retrying
                            automatically...
                          </div>
                        </div>
                      ) : error.message
                          .toLowerCase()
                          .includes("internal json-rpc error") ||
                        error.message
                          .toLowerCase()
                          .includes("internal error") ? (
                        <div className="space-y-1">
                          <div>🔧 Anvil Node Error</div>
                          <div className="text-xs opacity-75">
                            Local blockchain node issue - attempting automatic
                            recovery...
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
                    <div className="terminal-text text-green-400 text-xs mt-2 space-y-1">
                      <div>
                        ✓ Attestation created! Tx: {hash.slice(0, 10)}...
                        {hash.slice(-8)}
                      </div>
                      {chain?.id === 17000 && (
                        <div className="opacity-75">
                          Local network transaction confirmed
                        </div>
                      )}
                    </div>
                  )}

                  {isLoading && chain?.id === 17000 && (
                    <div className="terminal-dim text-xs mt-2">
                      🔄 Processing on local Anvil network... Nonce conflicts
                      auto-handled
                    </div>
                  )}
                </div>
              </form>
            </Form>
          ) : (
            <div className="text-center">
              <div className="terminal-dim text-xs mb-4">
                Connect wallet to enable attestation creation
              </div>
              <Button
                onClick={handleConnect}
                className="mobile-terminal-btn px-6 py-2"
              >
                <span className="terminal-command text-xs">CONNECT WALLET</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Recent attestations */}
      <div className="space-y-4">
        <div className="terminal-text">RECENT ATTESTATIONS:</div>
        <div className="space-y-3">
          {[
            {
              uid: "0xa7f2b8c1...",
              schema: "Basic Schema",
              recipient: "0x4d2f...8a1c",
              timestamp: "2 hours ago",
            },
            {
              uid: "0x3e9d4b7f...",
              schema: "Compute Schema",
              recipient: "0x7a8b...3f2d",
              timestamp: "5 hours ago",
            },
            {
              uid: "0x9c1e5a82...",
              schema: "Basic Schema",
              recipient: "0x2f7d...9b4e",
              timestamp: "12 hours ago",
            },
          ].map((attestation) => (
            <div
              key={attestation.uid}
              className="border border-gray-700 bg-black/5 p-3 rounded-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="space-y-1">
                  <div className="terminal-command text-xs">
                    {attestation.schema}
                  </div>
                  <div className="terminal-dim text-xs">
                    {attestation.uid} → {attestation.recipient}
                  </div>
                </div>
                <div className="terminal-dim text-xs">
                  {attestation.timestamp}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
