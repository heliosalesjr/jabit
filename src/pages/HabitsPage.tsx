import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Archive, Flame, Share2, Check, X, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useHabits } from '../hooks/useHabits'
import { useFriends } from '../hooks/useFriends'
import { useHabitPartnerships } from '../hooks/useHabitPartnerships'
import { useGoogleCalendar } from '../hooks/useGoogleCalendar'
import { HabitForm } from '../components/habits/HabitForm'
import { Button } from '../components/ui/Button'
import {
  addHabit,
  updateHabit,
  archiveHabit,
  getAllHabitLogs,
  shareHabit,
  acceptHabitPartnership,
  rejectHabitPartnership,
  cancelHabitPartnership,
} from '../firebase/firestore'
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../lib/googleCalendar'
import { calculateStreak } from '../lib/streaks'
import type { Habit, HabitLog, HabitPartnership, UserProfile } from '../types'

// ─── Friend picker modal ──────────────────────────────────────────

function FriendPickerModal({
  habit,
  friends,
  usedUids,
  onSelect,
  onClose,
}: {
  habit: Habit
  friends: UserProfile[]
  usedUids: Set<string>
  onSelect: (friend: UserProfile) => void
  onClose: () => void
}) {
  const available = friends.filter((f) => !usedUids.has(f.uid))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Compartilhar hábito</p>
          <p className="font-bold text-slate-900 dark:text-white mt-0.5">
            {habit.emoji} {habit.name}
          </p>
        </div>

        {available.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {friends.length === 0
                ? 'Adicione amigos primeiro na aba Amigos'
                : 'Todos os seus amigos já estão neste hábito'}
            </p>
          </div>
        ) : (
          <div className="p-3 max-h-72 overflow-y-auto space-y-1">
            {available.map((friend) => (
              <button
                key={friend.uid}
                onClick={() => onSelect(friend)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
              >
                {friend.photoURL ? (
                  <img src={friend.photoURL} alt={friend.displayName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {friend.displayName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{friend.displayName}</p>
                  <p className="text-xs text-slate-400 truncate">{friend.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────

export function HabitsPage() {
  const { user } = useAuth()
  const { habits } = useHabits()
  const { friendProfiles } = useFriends()
  const { pendingInvites, getPartnershipsForHabit, getPartnerInfo } =
    useHabitPartnerships()
  const { getToken } = useGoogleCalendar()

  const [showForm, setShowForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [sharingHabit, setSharingHabit] = useState<Habit | null>(null)
  const [allLogs, setAllLogs] = useState<HabitLog[]>([])

  useEffect(() => {
    if (!user) return
    getAllHabitLogs(user.uid).then(setAllLogs)
  }, [user, habits])

  const getHabitStreak = (habitId: string) =>
    calculateStreak(allLogs.filter((l) => l.habitId === habitId)).current

  const getTotalCompletions = (habitId: string) =>
    allLogs.filter((l) => l.habitId === habitId).length

  const handleAddHabit = async (data: Parameters<typeof addHabit>[1]) => {
    if (!user) return
    try {
      const ref = await addHabit(user.uid, data)

      if (data.googleCalendarSync) {
        const token = getToken()
        if (token) {
          const eventId = await createCalendarEvent(data, token)
          if (eventId) await updateHabit(user.uid, ref.id, { googleCalendarEventId: eventId })
        }
      }

      toast.success('Hábito criado! 🎯')
    } catch {
      toast.error('Erro ao criar hábito')
    }
  }

  const handleEditHabit = async (data: Parameters<typeof addHabit>[1]) => {
    if (!user || !editingHabit) return
    try {
      await updateHabit(user.uid, editingHabit.id, data)

      const token = getToken()
      if (token) {
        const wasSync = editingHabit.googleCalendarSync
        const isSync = data.googleCalendarSync
        const eventId = editingHabit.googleCalendarEventId

        if (isSync && eventId) {
          // Already synced — update the event
          await updateCalendarEvent(eventId, data, token)
        } else if (isSync && !eventId) {
          // Sync just enabled — create a new event
          const newEventId = await createCalendarEvent(data, token)
          if (newEventId) await updateHabit(user.uid, editingHabit.id, { googleCalendarEventId: newEventId })
        } else if (!isSync && wasSync && eventId) {
          // Sync disabled — delete the event
          await deleteCalendarEvent(eventId, token)
          await updateHabit(user.uid, editingHabit.id, { googleCalendarEventId: undefined })
        }
      }

      toast.success('Hábito atualizado!')
      setEditingHabit(null)
    } catch {
      toast.error('Erro ao atualizar hábito')
    }
  }

  const handleArchive = async (habit: Habit) => {
    if (!user) return
    if (!confirm(`Arquivar "${habit.name}"?`)) return
    try {
      await archiveHabit(user.uid, habit.id)

      if (habit.googleCalendarEventId) {
        const token = getToken()
        if (token) await deleteCalendarEvent(habit.googleCalendarEventId, token)
      }

      toast.success('Hábito arquivado')
    } catch {
      toast.error('Erro ao arquivar hábito')
    }
  }

  const handleShare = async (friend: UserProfile) => {
    if (!user || !sharingHabit) return
    try {
      await shareHabit(
        { uid: user.uid, displayName: user.displayName ?? 'Usuário', photoURL: user.photoURL ?? '' },
        sharingHabit,
        { uid: friend.uid, displayName: friend.displayName, photoURL: friend.photoURL }
      )
      toast.success(`Convite enviado para ${friend.displayName}!`)
      setSharingHabit(null)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao compartilhar hábito')
    }
  }

  const handleAcceptInvite = async (partnership: HabitPartnership) => {
    if (!user) return
    try {
      await acceptHabitPartnership(partnership, user.uid)
      toast.success(`Hábito "${partnership.ownerHabitName}" adicionado!`)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao aceitar convite')
    }
  }

  const handleRejectInvite = async (partnership: HabitPartnership) => {
    try {
      await rejectHabitPartnership(partnership.id)
      toast('Convite recusado.')
    } catch {
      toast.error('Erro ao recusar convite')
    }
  }

  const handleCancelPartnership = async (partnership: HabitPartnership, habitId: string) => {
    if (!user) return
    if (!confirm(`Encerrar parceria com ${getPartnerInfo(partnership).name.split(' ')[0]}?`)) return
    try {
      await cancelHabitPartnership(partnership.id, user.uid, habitId)
      toast('Parceria encerrada.')
    } catch {
      toast.error('Erro ao encerrar parceria')
    }
  }

  // UIDs already partnered per habit (to filter friend picker — exclude current partners)
  const getUsedPartnerUids = (habitId: string): Set<string> => {
    const uids = new Set<string>([user?.uid ?? ''])
    for (const p of getPartnershipsForHabit(habitId)) {
      uids.add(p.ownerUid)
      uids.add(p.partnerUid)
    }
    return uids
  }

  const frequencyLabel = {
    daily: 'Todo dia',
    weekdays: 'Dias úteis',
    weekends: 'Fins de semana',
    custom: 'Personalizado',
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Meus Hábitos</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {habits.length} hábito{habits.length !== 1 ? 's' : ''} ativo{habits.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} size="md">
          <Plus size={16} />
          Novo
        </Button>
      </motion.div>

      {/* Pending habit invites */}
      <AnimatePresence>
        {pendingInvites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 space-y-2"
          >
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide px-1">
              Convites de hábito
            </p>
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="card p-4 flex items-center gap-3 border-l-4 border-violet-400">
                <div className="text-2xl w-10 h-10 flex items-center justify-center bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex-shrink-0">
                  {invite.ownerHabitEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                    {invite.ownerHabitName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {invite.ownerName} quer fazer isso com você
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAcceptInvite(invite)}
                    className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => handleRejectInvite(invite)}
                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Habits list */}
      {habits.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-12 text-center">
          <div className="text-6xl mb-4">🌱</div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Comece sua jornada!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Crie seu primeiro hábito e comece a construir uma rotina incrível
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Criar primeiro hábito
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit, i) => {
            const streak = getHabitStreak(habit.id)
            const total = getTotalCompletions(habit.id)
            const habitPartnerships = getPartnershipsForHabit(habit.id)
            const isOwner = habitPartnerships.some((p) => p.ownerUid === user?.uid)
            const isPartner = !isOwner && habitPartnerships.length > 0

            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl flex-shrink-0">
                    {habit.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate">{habit.name}</h3>
                      {/* Badges de parceiros */}
                      {habitPartnerships.map((p) => {
                        const info = getPartnerInfo(p)
                        return (
                          <div key={p.id} className="flex items-center gap-1 bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 rounded-full flex-shrink-0">
                            {info.photo ? (
                              <img src={info.photo} alt={info.name} className="w-4 h-4 rounded-full object-cover" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-violet-400 flex items-center justify-center text-white text-[8px] font-bold">
                                {info.name.charAt(0)}
                              </div>
                            )}
                            <span className="text-xs font-medium text-violet-600 dark:text-violet-400 truncate max-w-[72px]">
                              {info.name.split(' ')[0]}
                            </span>
                            {/* X para owner encerrar parceria individual */}
                            {isOwner && (
                              <button
                                onClick={() => handleCancelPartnership(p, habit.id)}
                                className="ml-0.5 text-violet-400 hover:text-red-400 transition-colors"
                                title={`Encerrar parceria com ${info.name.split(' ')[0]}`}
                              >
                                <X size={10} />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {frequencyLabel[habit.frequency]}
                      </span>
                      {streak > 0 && (
                        <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                          <Flame size={10} />
                          {streak} dias
                        </span>
                      )}
                      <span className="text-xs text-slate-400 dark:text-slate-500">{total} total</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Share: owner sempre pode convidar mais amigos; parceiro não */}
                    {(isOwner || habitPartnerships.length === 0) && !isPartner && (
                      <button
                        onClick={() => setSharingHabit(habit)}
                        className="p-2 rounded-xl text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                        title="Convidar amigo"
                      >
                        <Share2 size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingHabit(habit)}
                      className="p-2 rounded-xl text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleArchive(habit)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                      <Archive size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Friend picker modal */}
      <AnimatePresence>
        {sharingHabit && (
          <FriendPickerModal
            habit={sharingHabit}
            friends={friendProfiles}
            usedUids={getUsedPartnerUids(sharingHabit.id)}
            onSelect={handleShare}
            onClose={() => setSharingHabit(null)}
          />
        )}
      </AnimatePresence>

      <HabitForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleAddHabit}
        habitCount={habits.length}
      />
      {editingHabit && (
        <HabitForm
          open={!!editingHabit}
          onClose={() => setEditingHabit(null)}
          onSave={handleEditHabit}
          initial={editingHabit}
          habitCount={habits.length}
        />
      )}
    </div>
  )
}
