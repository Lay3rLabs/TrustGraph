import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Hex } from 'viem'
import { useAccount, useWatchContractEvent } from 'wagmi'

import { merkleSnapshotConfig } from '@/lib/contracts'
import { pointsQueries } from '@/queries/points'

export const PointsNotifier = () => {
  const { address } = useAccount()
  const queryClient = useQueryClient()

  const [lastPoints, setLastPoints] = useState<number | null>(null)
  const updatePoints = useCallback(async () => {
    const events = await queryClient.fetchQuery(
      pointsQueries.events(address as Hex)
    )
    const totalPoints = events.reduce(
      (acc, activity) => acc + activity.points,
      0
    )

    setLastPoints(totalPoints)

    return totalPoints
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
    if (lastPoints === null) {
      return
    }

    // Invalidate the points query.
    await queryClient.invalidateQueries({
      queryKey: pointsQueries.events(address as Hex).queryKey,
    })

    const newPoints = await updatePoints()
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

  return null
}
