import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  subscribeIncomingRequests,
  subscribeOutgoingRequests,
  subscribeFriendships,
  getUserProfiles,
} from '../firebase/firestore'
import type { FriendRequest, Friendship, UserProfile } from '../types'

export function useFriends() {
  const { user } = useAuth()
  const [incoming, setIncoming] = useState<FriendRequest[]>([])
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([])
  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [friendProfiles, setFriendProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setIncoming([])
      setOutgoing([])
      setFriendships([])
      setFriendProfiles([])
      setLoading(false)
      return
    }

    let unsubIncoming: (() => void) | undefined
    let unsubOutgoing: (() => void) | undefined
    let unsubFriendships: (() => void) | undefined
    let settled = 0

    const checkDone = () => {
      settled++
      if (settled >= 3) setLoading(false)
    }

    unsubIncoming = subscribeIncomingRequests(user.uid, (reqs) => {
      setIncoming(reqs)
      checkDone()
    })

    unsubOutgoing = subscribeOutgoingRequests(user.uid, (reqs) => {
      setOutgoing(reqs)
      checkDone()
    })

    unsubFriendships = subscribeFriendships(user.uid, (ships) => {
      setFriendships(ships)
      checkDone()
      const partnerUids = ships.map((s) => s.users.find((u) => u !== user.uid)!)
      getUserProfiles(partnerUids).then(setFriendProfiles)
    })

    return () => {
      unsubIncoming?.()
      unsubOutgoing?.()
      unsubFriendships?.()
    }
  }, [user])

  return { incoming, outgoing, friendships, friendProfiles, loading }
}
