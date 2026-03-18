import { useEffect, useState } from 'react'
import { subscribeAchievements, unlockAchievements } from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { ACHIEVEMENTS } from '../lib/achievements'
import type { Achievement, UserStats } from '../types'

export function useAchievements(stats: UserStats | null) {
  const { user } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setAchievements([])
      setLoading(false)
      return
    }
    const unsub = subscribeAchievements(user.uid, (a) => {
      setAchievements(a)
      setLoading(false)
    })
    return unsub
  }, [user])

  // Check and unlock new achievements whenever stats change
  useEffect(() => {
    if (!user || !stats || loading) return

    const unlockedIds = new Set(achievements.map((a) => a.id))
    const newOnes = ACHIEVEMENTS.filter(
      (def) => !unlockedIds.has(def.id) && def.condition(stats)
    )

    if (newOnes.length > 0) {
      const totalPoints = newOnes.reduce((sum, a) => sum + a.points, 0)
      unlockAchievements(user.uid, newOnes.map((a) => a.id), totalPoints)
    }
  }, [user, stats, achievements, loading])

  return { achievements, loading }
}
