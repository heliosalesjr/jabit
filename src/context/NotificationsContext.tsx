import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { subscribeIncomingRequests, subscribeHabitPartnershipsByPartner } from '../firebase/firestore'

interface NotificationsContextType {
  pendingFriendRequests: number
  pendingHabitInvites: number
}

const NotificationsContext = createContext<NotificationsContextType>({
  pendingFriendRequests: 0,
  pendingHabitInvites: 0,
})

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [pendingFriendRequests, setPendingFriendRequests] = useState(0)
  const [pendingHabitInvites, setPendingHabitInvites] = useState(0)

  useEffect(() => {
    if (!user) {
      setPendingFriendRequests(0)
      setPendingHabitInvites(0)
      return
    }

    const unsubFriends = subscribeIncomingRequests(user.uid, (reqs) => {
      setPendingFriendRequests(reqs.length)
    })

    const unsubHabits = subscribeHabitPartnershipsByPartner(user.uid, (partnerships) => {
      setPendingHabitInvites(partnerships.filter((p) => p.status === 'pending').length)
    })

    return () => {
      unsubFriends()
      unsubHabits()
    }
  }, [user])

  return (
    <NotificationsContext.Provider value={{ pendingFriendRequests, pendingHabitInvites }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationsContext)
}
