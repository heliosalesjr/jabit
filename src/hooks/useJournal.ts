import { useEffect, useState } from 'react'
import { subscribeJournalEntries } from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'
import type { JournalEntry } from '../types'

export function useJournal() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setEntries([])
      setLoading(false)
      return
    }
    const unsub = subscribeJournalEntries(user.uid, (e) => {
      setEntries(e)
      setLoading(false)
    })
    return unsub
  }, [user])

  return { entries, loading }
}
