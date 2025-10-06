import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAccount, useWatchContractEvent } from 'wagmi'

import { merkleSnapshotConfig } from '@/lib/contracts'
import { pointsQueries } from '@/queries/points'

export const PointsNotifier = () => {
  const { address } = useAccount()
  const queryClient = useQueryClient()

  const [lastPoints, setLastPoints] = useState<number | null>(null)
  const updatePoints = useCallback(async () => {
    if (!address) {
      return
    }

    const { total } = await queryClient.fetchQuery(
      pointsQueries.points(address)
    )

    setLastPoints(total)

    return total
  }, [queryClient, address])

  // On address change, update the last points.
  useEffect(() => {
    if (!address) {
      setLastPoints(null)
      return
    }

    updatePoints()
  }, [updatePoints, address])

  const handleMerkleRootUpdated = useCallback(async () => {
    // Wait for the last points to be set initially.
    if (lastPoints === null || !address) {
      return
    }

    // Invalidate the points query.
    await queryClient.invalidateQueries({
      queryKey: pointsQueries.points(address).queryKey,
    })

    const newPoints = await updatePoints()
    if (!newPoints) {
      return
    }

    const difference = newPoints - lastPoints
    if (difference > 0) {
      toast.success(
        `Earned ${difference} point${difference !== 1 ? 's' : ''}! 🎉`
      )
    }
  }, [lastPoints, updatePoints])

  useWatchContractEvent({
    ...merkleSnapshotConfig,
    eventName: 'MerkleRootUpdated',
    onLogs: handleMerkleRootUpdated,
  })

  // Refresh points every 30 seconds
  useEffect(() => {
    const interval = setInterval(updatePoints, 30 * 1_000)
    return () => clearInterval(interval)
  }, [updatePoints])

  return null
}
