import { useEffect, useState } from 'react'
import { subscribeHabitLogs } from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { getTodayISO } from '../lib/streaks'
import type { HabitLog } from '../types'

export function useHabitLogs(date?: string) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [loading, setLoading] = useState(true)

  const targetDate = date ?? getTodayISO()

  useEffect(() => {
    if (!user) {
      setLogs([])
      setLoading(false)
      return
    }
    const unsub = subscribeHabitLogs(user.uid, targetDate, (l) => {
      setLogs(l)
      setLoading(false)
    })
    return unsub
  }, [user, targetDate])

  return { logs, loading }
}
