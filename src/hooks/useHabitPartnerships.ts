import { useEffect, useState, useMemo, useCallback } from 'react'
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

  const pendingInvites = useMemo(
    () => asPartner.filter((p) => p.status === 'pending'),
    [asPartner]
  )

  const pendingOutgoing = useMemo(
    () => asOwner.filter((p) => p.status === 'pending'),
    [asOwner]
  )

  const activePartnerships = useMemo(
    () => [
      ...asOwner.filter((p) => p.status === 'accepted'),
      ...asPartner.filter((p) => p.status === 'accepted'),
    ],
    [asOwner, asPartner]
  )

  const getPartnershipForHabit = useCallback(
    (habitId: string): HabitPartnership | undefined =>
      activePartnerships.find(
        (p) => p.ownerHabitId === habitId || p.partnerHabitId === habitId
      ),
    [activePartnerships]
  )

  const getPartnerInfo = useCallback(
    (partnership: HabitPartnership): { name: string; photo: string } => {
      if (!user) return { name: '', photo: '' }
      return user.uid === partnership.ownerUid
        ? { name: partnership.partnerName, photo: partnership.partnerPhoto }
        : { name: partnership.ownerName, photo: partnership.ownerPhoto }
    },
    [user]
  )

  return {
    pendingInvites,
    pendingOutgoing,
    activePartnerships,
    getPartnershipForHabit,
    getPartnerInfo,
  }
}
