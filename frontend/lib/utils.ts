import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Hex, formatUnits } from 'viem'

export const cn = (...inputs: ClassValue[]) => {
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
 * Check if a string might be an ENS name.
 *
 * @param name - The string to check.
 * @returns True if the string might be an ENS name, false otherwise.
 */
export const mightBeEnsName = (name: string) => {
  return name.endsWith('.eth')
}

/**
 * Check if two addresses are equal.
 *
 * @param address1 - The first address.
 * @param address2 - The second address.
 * @returns True if the addresses are equal, false otherwise.
 */
export const areAddressesEqual = (address1: Hex, address2: Hex) => {
  return address1.toLowerCase() === address2.toLowerCase()
}
