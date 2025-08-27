import {
  WaitForTransactionReceiptReturnType,
  WriteContractParameters,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Abi, ContractFunctionArgs, ContractFunctionName } from 'viem'

import { config } from './wagmi'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

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
    confirmations = 1,
    onTransactionSent,
  }: {
    /**
     * Number of confirmations to wait for.
     *
     * Defaults to 1.
     */
    confirmations?: number
    /**
     * Callback to call after the transaction hash is generated.
     */
    onTransactionSent?: (hash: `0x${string}`) => void
  } = {}
): Promise<WaitForTransactionReceiptReturnType<cfg, chainId>> => {
  const hash = await writeContract(config as any, parameters as any)
  onTransactionSent?.(hash)
  return waitForTransactionReceipt(config, {
    confirmations,
    hash,
  })
}
