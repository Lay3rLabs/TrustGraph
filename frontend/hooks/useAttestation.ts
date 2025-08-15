"use client";

import { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useChainId,
  useSimulateContract,
  usePublicClient,
} from "wagmi";
import { attesterAddress, attesterAbi } from "@/lib/contracts";
import { encodePacked } from "viem";

interface AttestationData {
  schema: string;
  recipient: string;
  data: string;
}

export function useAttestation() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(false);

  const {
    writeContract,
    data: hash,
    error,
    isPending,
  } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        console.log("🎯 [Attestation] writeContract successful, hash:", hash);
      },
      onError: (error) => {
        console.error("🚫 [Attestation] writeContract failed:", error);
        console.error("🚫 [Attestation] writeContract error details:", {
          name: error.name,
          message: error.message,
          cause: error.cause,
          stack: error.stack,
          details: error.message || "No details available",
        });
      },
    },
  });

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
    timeout: 60_000, // 60 second timeout
    pollingInterval: 1_000, // Poll every 1 second
  });

  // Log state changes
  useEffect(() => {
    if (hash) {
      console.log("🔗 [Attestation] Transaction hash received:", hash);
      console.log("🔗 [Attestation] Current state after hash received:", {
        hash,
        isPending,
        isConfirming,
        isSuccess,
        hasError: !!error,
        hasReceiptError: !!receiptError,
      });
    }
  }, [hash, isPending, isConfirming, isSuccess, error, receiptError]);

  useEffect(() => {
    if (isPending) {
      console.log("⏳ [Attestation] Transaction pending...");
    }
  }, [isPending]);

  useEffect(() => {
    if (isConfirming) {
      console.log("🔄 [Attestation] Waiting for transaction confirmation...");
    }
  }, [isConfirming]);

  useEffect(() => {
    if (isSuccess) {
      console.log("🎉 [Attestation] Transaction confirmed successfully!");
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      console.error("❌ [Attestation] WriteContract error:", {
        message: error.message,
        cause: error.cause,
        stack: error.stack,
      });
    }
  }, [error]);

  useEffect(() => {
    if (receiptError) {
      console.error("❌ [Attestation] Receipt error:", {
        message: receiptError.message,
        cause: receiptError.cause,
        stack: receiptError.stack,
      });
    }
  }, [receiptError]);

  useEffect(() => {
    if (receipt) {
      console.log("📄 [Attestation] Transaction receipt received:", {
        blockHash: receipt.blockHash,
        blockNumber: receipt.blockNumber,
        transactionHash: receipt.transactionHash,
        status: receipt.status,
        gasUsed: receipt.gasUsed?.toString(),
        logs: receipt.logs?.length || 0,
        effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
      });

      if (receipt.status === "reverted") {
        console.error("🚫 [Attestation] Transaction was reverted!");
      } else if (receipt.status === "success") {
        console.log("✅ [Attestation] Transaction was successful!");
      }
    }
  }, [receipt]);

  // Add comprehensive state monitoring
  useEffect(() => {
    console.log("🔄 [Attestation] State update:", {
      timestamp: new Date().toISOString(),
      hasHash: !!hash,
      hash: hash || "none",
      isPending,
      isConfirming,
      isSuccess,
      hasError: !!error,
      hasReceiptError: !!receiptError,
      hasReceipt: !!receipt,
    });
  }, [hash, isPending, isConfirming, isSuccess, error, receiptError, receipt]);

  // Manual transaction check when stuck in confirming state
  useEffect(() => {
    if (hash && isConfirming && publicClient && !isSuccess && !receiptError) {
      const timeoutId = setTimeout(async () => {
        console.log(
          "⚠️ [Attestation] Stuck in confirming state, manually checking transaction...",
        );
        try {
          const tx = await publicClient.getTransaction({
            hash: hash as `0x${string}`,
          });
          console.log("🔍 [Attestation] Manual transaction check:", {
            blockHash: tx.blockHash,
            blockNumber: tx.blockNumber,
            transactionIndex: tx.transactionIndex,
            from: tx.from,
            to: tx.to,
            value: tx.value.toString(),
            gas: tx.gas.toString(),
            gasPrice: tx.gasPrice?.toString(),
            nonce: tx.nonce,
          });

          if (tx.blockHash) {
            console.log(
              "🟡 [Attestation] Transaction is mined but receipt not detected yet",
            );
            // Try to get receipt manually
            const receipt = await publicClient.getTransactionReceipt({
              hash: hash as `0x${string}`,
            });
            console.log("🔍 [Attestation] Manual receipt check:", {
              status: receipt.status,
              gasUsed: receipt.gasUsed.toString(),
              logs: receipt.logs.length,
            });
          } else {
            console.log(
              "🟠 [Attestation] Transaction is still pending in mempool",
            );
          }
        } catch (err) {
          console.error(
            "❌ [Attestation] Manual transaction check failed:",
            err,
          );
        }
      }, 10_000); // Check after 10 seconds of being stuck

      return () => clearTimeout(timeoutId);
    }
  }, [hash, isConfirming, publicClient, isSuccess, receiptError]);

  const createAttestation = async (attestationData: AttestationData) => {
    console.log("🚀 [Attestation] Starting attestation creation process", {
      schema: attestationData.schema,
      recipient: attestationData.recipient,
      dataLength: attestationData.data.length,
      isConnected,
      userAddress: address,
      chainId,
      contractAddress: attesterAddress,
    });

    if (!isConnected) {
      console.error("❌ [Attestation] Wallet not connected");
      throw new Error("Please connect your wallet");
    }

    if (chainId !== 17000) {
      console.error(
        "❌ [Attestation] Wrong network, expected chain ID 17000, got:",
        chainId,
      );
      throw new Error("Please switch to the local network (chain ID 17000)");
    }

    // Declare variables in higher scope for retry logic
    let encodedData: `0x${string}` | undefined;
    let gasEstimate: bigint | undefined;

    try {
      setIsLoading(true);
      console.log("⏳ [Attestation] Setting loading state to true");

      // Encode the attestation data as bytes
      // For this example, we'll use a simple string encoding
      // In production, you might want to use proper ABI encoding based on your schema
      console.log("🔧 [Attestation] Encoding attestation data", {
        rawData: attestationData.data,
      });
      encodedData = encodePacked(["string"], [attestationData.data]);
      console.log("✅ [Attestation] Data encoded successfully", {
        encodedData,
      });

      console.log("📝 [Attestation] Preparing contract call", {
        contractAddress: attesterAddress,
        functionName: "attest",
        schema: attestationData.schema,
        recipient: attestationData.recipient,
        encodedData,
        encodedDataType: typeof encodedData,
        encodedDataLength: encodedData.length,
      });

      // Validate inputs before calling contract
      if (
        !attestationData.schema.startsWith("0x") ||
        attestationData.schema.length !== 66
      ) {
        throw new Error(`Invalid schema format: ${attestationData.schema}`);
      }
      if (
        !attestationData.recipient.startsWith("0x") ||
        attestationData.recipient.length !== 42
      ) {
        throw new Error(
          `Invalid recipient address format: ${attestationData.recipient}`,
        );
      }

      // Get current nonce for the account (important for local networks)
      console.log("🔢 [Attestation] Getting current nonce for account...");
      const nonce = await publicClient!.getTransactionCount({
        address: address!,
        blockTag: "pending", // Use pending to get the most up-to-date nonce
      });
      console.log("🔢 [Attestation] Current nonce:", nonce);

      // Estimate gas for the transaction
      console.log("⛽ [Attestation] Estimating gas for transaction...");
      try {
        gasEstimate = await publicClient!.estimateContractGas({
          address: attesterAddress,
          abi: attesterAbi,
          functionName: "attest",
          args: [
            attestationData.schema as `0x${string}`,
            attestationData.recipient as `0x${string}`,
            encodedData,
          ],
          account: address!,
        });

        console.log("⛽ [Attestation] Gas estimate:", {
          gasEstimate: gasEstimate.toString(),
          gasEstimateWithBuffer: (
            (gasEstimate * BigInt(120)) /
            BigInt(100)
          ).toString(), // Add 20% buffer
          nonce: nonce.toString(),
        });

        // Try to simulate the contract call first to catch any revert issues
        console.log("🧪 [Attestation] Simulating contract call...");
        const { result } = await publicClient!.simulateContract({
          address: attesterAddress as `0x${string}`,
          abi: attesterAbi,
          functionName: "attest",
          args: [
            attestationData.schema as `0x${string}`,
            attestationData.recipient as `0x${string}`,
            encodedData,
          ],
          account: address!,
        });

        console.log(
          "✅ [Attestation] Simulation successful, expected return:",
          result,
        );

        writeContract({
          address: attesterAddress as `0x${string}`,
          abi: attesterAbi,
          functionName: "attest",
          args: [
            attestationData.schema as `0x${string}`,
            attestationData.recipient as `0x${string}`,
            encodedData,
          ],
          gas: (gasEstimate * BigInt(120)) / BigInt(100), // Add 20% buffer to gas estimate
          nonce, // Explicitly set nonce to prevent conflicts on local networks
        });
      } catch (gasError) {
        console.error(
          "🚫 [Attestation] Gas estimation or simulation failed:",
          gasError,
        );
        console.error("🚫 [Attestation] Error details:", {
          name: gasError instanceof Error ? gasError.name : "Unknown",
          message:
            gasError instanceof Error ? gasError.message : "Unknown error",
          cause: gasError instanceof Error ? gasError.cause : undefined,
        });

        // Check if this is a nonce-related error
        const errorMessage =
          gasError instanceof Error ? gasError.message.toLowerCase() : "";
        if (
          errorMessage.includes("nonce") ||
          errorMessage.includes("transaction underpriced")
        ) {
          console.log(
            "🔄 [Attestation] Detected potential nonce issue, will retry with fresh nonce",
          );
          throw new Error(`Nonce conflict detected: ${errorMessage}`);
        }

        // Check if this is an Anvil-specific error
        const isAnvilError =
          errorMessage.includes("internal json-rpc error") ||
          errorMessage.includes("internal error") ||
          errorMessage.includes("execution reverted");

        if (isAnvilError) {
          console.log(
            "🔧 [Attestation] Anvil-specific error detected, checking node status...",
          );
          // Try a simple eth_blockNumber call to test Anvil responsiveness
          try {
            const blockNumber = await publicClient!.getBlockNumber();
            console.log(
              "🔧 [Attestation] Anvil responsive, current block:",
              blockNumber.toString(),
            );
          } catch (nodeErr) {
            console.error(
              "💥 [Attestation] Anvil node appears unresponsive:",
              nodeErr,
            );
            throw new Error(
              "Anvil node appears to be unresponsive. Please restart anvil and try again.",
            );
          }
        }

        throw new Error(
          `Transaction simulation failed: ${gasError instanceof Error ? gasError.message : "Unknown error"}${isAnvilError ? " (Anvil node issue detected)" : ""}`,
        );
      }

      console.log("📡 [Attestation] Contract write initiated");
    } catch (err) {
      console.error("❌ [Attestation] Error creating attestation:", err);
      console.error("❌ [Attestation] Error details:", {
        message: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
        cause: err instanceof Error ? err.cause : undefined,
      });

      // Enhanced error handling for Anvil and nonce issues
      const errorMessage =
        err instanceof Error ? err.message.toLowerCase() : "";

      // Check for Anvil-specific errors first
      const isAnvilError =
        errorMessage.includes("internal json-rpc error") ||
        errorMessage.includes("internal error");

      if (isAnvilError && !errorMessage.includes("retry")) {
        console.log(
          "🔧 [Attestation] Anvil internal error detected, attempting recovery...",
        );

        try {
          // Test if Anvil is still responsive
          const blockNumber = await publicClient!.getBlockNumber();
          console.log(
            "🔧 [Attestation] Anvil still responsive at block:",
            blockNumber.toString(),
          );

          // Wait a bit for Anvil to recover and try once more
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Get fresh nonce and retry
          const recoveryNonce = await publicClient!.getTransactionCount({
            address: address!,
            blockTag: "latest",
          });

          console.log(
            "🔧 [Attestation] Retrying after Anvil recovery with nonce:",
            recoveryNonce,
          );

          if (encodedData !== undefined && gasEstimate !== undefined) {
            writeContract({
              address: attesterAddress as `0x${string}`,
              abi: attesterAbi,
              functionName: "attest",
              args: [
                attestationData.schema as `0x${string}`,
                attestationData.recipient as `0x${string}`,
                encodedData,
              ],
              gas: (gasEstimate * BigInt(120)) / BigInt(100),
              nonce: recoveryNonce,
            });

            console.log("🔧 [Attestation] Anvil recovery retry initiated");
            return;
          }
        } catch (recoveryErr) {
          console.error("💥 [Attestation] Anvil recovery failed:", recoveryErr);
          throw new Error(
            "Anvil node error - please restart anvil and try again",
          );
        }
      }

      // Check for nonce-related errors
      if (
        (errorMessage.includes("nonce") ||
          errorMessage.includes("transaction underpriced")) &&
        !errorMessage.includes("retry") &&
        encodedData !== undefined &&
        gasEstimate !== undefined
      ) {
        // Prevent infinite retry and ensure we have the required variables
        console.log(
          "🔄 [Attestation] Nonce conflict detected, retrying with fresh nonce...",
        );

        try {
          // Get a fresh nonce and retry
          const freshNonce = await publicClient!.getTransactionCount({
            address: address!,
            blockTag: "latest", // Use latest instead of pending for retry
          });

          console.log(
            "🔄 [Attestation] Retrying with fresh nonce:",
            freshNonce,
          );

          writeContract({
            address: attesterAddress as `0x${string}`,
            abi: attesterAbi,
            functionName: "attest",
            args: [
              attestationData.schema as `0x${string}`,
              attestationData.recipient as `0x${string}`,
              encodedData,
            ],
            gas: (gasEstimate * BigInt(120)) / BigInt(100),
            nonce: freshNonce, // Use fresh nonce for retry
          });

          console.log("🔄 [Attestation] Retry initiated with fresh nonce");
          return; // Exit early on successful retry initiation
        } catch (retryErr) {
          console.error("❌ [Attestation] Retry failed:", retryErr);
          throw new Error(
            `Transaction failed after nonce retry: ${retryErr instanceof Error ? retryErr.message : "Unknown error"}`,
          );
        }
      }

      throw err;
    } finally {
      setIsLoading(false);
      console.log("✅ [Attestation] Loading state reset to false");
    }
  };

  return {
    createAttestation,
    isLoading: isLoading || isPending || isConfirming,
    isSuccess,
    error,
    hash,
    isConnected,
    userAddress: address,
  };
}
