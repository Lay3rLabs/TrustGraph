import {
  WaitForTransactionReceiptReturnType,
  WriteContractParameters,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  Abi,
  ContractFunctionArgs,
  ContractFunctionName,
  formatUnits,
} from 'viem'

import { config } from './wagmi'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatBigNumber = (
  num: bigint | number | string,
  /**
   * If decimals are passed, the number must be an integer.
   */
  decimals?: number,
  showFull?: boolean
): string => {
  const maxDigits = showFull ? decimals ?? 18 : 3
  num = Number(decimals ? formatUnits(BigInt(num), decimals) : num)

  if (showFull) {
    return num.toLocaleString(undefined, {
      notation: 'standard',
      maximumFractionDigits: maxDigits,
    })
  }

  if (num >= 1e9) {
    return `${(num / 1e9).toLocaleString(undefined, {
      notation: 'standard',
      maximumFractionDigits: maxDigits,
    })}B`
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toLocaleString(undefined, {
      notation: 'standard',
      maximumFractionDigits: maxDigits,
    })}M`
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toLocaleString(undefined, {
      notation: 'standard',
      maximumFractionDigits: maxDigits,
    })}K`
  }
  if (num < 1) {
    return num.toLocaleString(undefined, {
      notation: 'standard',
      maximumSignificantDigits: maxDigits,
    })
  }
  return num.toLocaleString(undefined, {
    notation: 'standard',
    maximumFractionDigits: maxDigits,
  })
}

export const formatTimeAgo = (timestampOrMs: Date | number) => {
  if (timestampOrMs instanceof Date) {
    timestampOrMs = timestampOrMs.getTime()
  }

  const now = Date.now()
  const diffInSeconds = Math.abs(Math.floor((now - timestampOrMs) / 1000))
  const suffix = timestampOrMs < now ? 'ago' : 'remaining'

  if (diffInSeconds < 60) {
    return `<1m ${suffix}`
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m ${suffix}`
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h ${suffix}`
  } else {
    return `${Math.floor(diffInSeconds / 86400)}d ${suffix}`
  }
}

/**
 * Write a contract and wait for it to be confirmed.
 *
 * DO NOT USE THIS FUNCTION DIRECTLY. USE THE `txToast` FUNCTION INSTEAD.
 */
export const writeEthContractAndWait = async <
  cfg extends typeof config,
  abi extends Abi | readonly unknown[],
  functionName extends ContractFunctionName<abi, 'nonpayable' | 'payable'>,
  args extends ContractFunctionArgs<
    abi,
    'nonpayable' | 'payable',
    functionName
  >,
  chainId extends cfg['chains'][number]['id']
>(
  parameters: WriteContractParameters<abi, functionName, args, cfg, chainId>,
  {
    confirmations = 3,
    onTransactionSent,
    onConfirmation,
  }: {
    /**
     * Number of confirmations to wait for.
     *
     * Defaults to 3.
     */
    confirmations?: number
    /**
     * Callback to call after the transaction hash is generated.
     */
    onTransactionSent?: (hash: `0x${string}`) => void
    /**
     * Callback to call when confirmations increase.
     */
    onConfirmation?: (confirmations: number, hash: `0x${string}`) => void
  } = {}
): Promise<WaitForTransactionReceiptReturnType<cfg, chainId>> => {
  const hash = await writeContract(config as any, parameters as any)
  onTransactionSent?.(hash)

  // Recursively wait for confirmations until the target is reached so we can fire the callback.
  const checkConfirmations = async (
    targetConfirmations: number
  ): Promise<WaitForTransactionReceiptReturnType<cfg, chainId>> => {
    const receipt = await waitForTransactionReceipt(config, {
      confirmations: targetConfirmations,
      hash,
    })
    onConfirmation?.(targetConfirmations, hash)

    return targetConfirmations >= confirmations
      ? (receipt as unknown as WaitForTransactionReceiptReturnType<
          cfg,
          chainId
        >)
      : checkConfirmations(targetConfirmations + 1)
  }

  return checkConfirmations(1)
}

/**
 * Check if a string might be an ENS name.
 *
 * @param name - The string to check.
 * @returns True if the string might be an ENS name, false otherwise.
 */
export const mightBeEnsName = (name: string) => {
  return name.includes('.')
}
