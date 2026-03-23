import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  subscribeHabitPartnershipsByOwner,
  subscribeHabitPartnershipsByPartner,
} from '../firebase/firestore'
import type { HabitPartnership } from '../types'

export function useHabitPartnerships() {
  const { user } = useAuth()
  const [asOwner, setAsOwner] = useState<HabitPartnership[]>([])
  const [asPartner, setAsPartner] = useState<HabitPartnership[]>([])

  useEffect(() => {
    if (!user) {
      setAsOwner([])
      setAsPartner([])
      return
    }

    const unsubOwner = subscribeHabitPartnershipsByOwner(user.uid, setAsOwner)
    const unsubPartner = subscribeHabitPartnershipsByPartner(user.uid, setAsPartner)
    return () => {
      unsubOwner()
      unsubPartner()
    }
  }, [user])

  // Pending invites the current user received
  const pendingInvites = asPartner.filter((p) => p.status === 'pending')

  // Pending invites the current user sent
  const pendingOutgoing = asOwner.filter((p) => p.status === 'pending')

  // Active partnerships (accepted)
  const activePartnerships = [
    ...asOwner.filter((p) => p.status === 'accepted'),
    ...asPartner.filter((p) => p.status === 'accepted'),
  ]

  // Look up a partnership by habit ID (works for both owner's and partner's habit)
  const getPartnershipForHabit = (habitId: string): HabitPartnership | undefined =>
    activePartnerships.find(
      (p) => p.ownerHabitId === habitId || p.partnerHabitId === habitId
    )

  // Get the display info for the partner (from current user's perspective)
  const getPartnerInfo = (
    partnership: HabitPartnership
  ): { name: string; photo: string } => {
    if (!user) return { name: '', photo: '' }
    return user.uid === partnership.ownerUid
      ? { name: partnership.partnerName, photo: partnership.partnerPhoto }
      : { name: partnership.ownerName, photo: partnership.ownerPhoto }
  }

  return {
    pendingInvites,
    pendingOutgoing,
    activePartnerships,
    getPartnershipForHabit,
    getPartnerInfo,
  }
}
