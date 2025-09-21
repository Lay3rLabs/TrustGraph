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
  decimals?: number
): string => {
  num = Number(decimals ? formatUnits(BigInt(num), decimals) : num)
  if (num >= 1000000)
    return `${(num / 1000000).toLocaleString(undefined, {
      notation: 'standard',
      maximumFractionDigits: 3,
    })}M`
  if (num >= 1000)
    return `${(num / 1000).toLocaleString(undefined, {
      notation: 'standard',
      maximumFractionDigits: 3,
    })}K`
  return num.toLocaleString(undefined, {
    notation: 'standard',
    maximumFractionDigits: 3,
  })
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
