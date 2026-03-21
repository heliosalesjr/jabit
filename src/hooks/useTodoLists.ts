import { useEffect, useState } from 'react'
import { subscribeTodoLists } from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'
import type { TodoList } from '../types'

export function useTodoLists() {
  const { user } = useAuth()
  const [lists, setLists] = useState<TodoList[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLists([])
      setLoading(false)
      return
    }
    const unsub = subscribeTodoLists(user.uid, (l) => {
      setLists(l)
      setLoading(false)
    })
    return unsub
  }, [user])

  return { lists, loading }
}
