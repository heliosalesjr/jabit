import { useEffect, useState } from 'react'
import { subscribeHabits } from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'
import type { Habit } from '../types'

export function useHabits() {
  const { user } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setHabits([])
      setLoading(false)
      return
    }
    const unsub = subscribeHabits(user.uid, (h) => {
      setHabits(h)
      setLoading(false)
    })
    return unsub
  }, [user])

  return { habits, loading }
}
