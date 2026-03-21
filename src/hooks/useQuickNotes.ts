import { useEffect, useState } from 'react'
import { subscribeQuickNotes } from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'
import type { QuickNote } from '../types'

export function useQuickNotes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<QuickNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setNotes([])
      setLoading(false)
      return
    }
    const unsub = subscribeQuickNotes(user.uid, (n) => {
      setNotes(n)
      setLoading(false)
    })
    return unsub
  }, [user])

  return { notes, loading }
}
