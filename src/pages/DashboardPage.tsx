import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, BookOpen, Trophy, Plus, ArrowRight, Check, Users, Grid3X3 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useHabits } from '../hooks/useHabits'
import { useHabitLogs } from '../hooks/useHabitLogs'
import { useJournal } from '../hooks/useJournal'
import { useAchievements } from '../hooks/useAchievements'
import { useTodoLists } from '../hooks/useTodoLists'
import { useQuickNotes } from '../hooks/useQuickNotes'
import { YearGrid } from '../components/dashboard/YearGrid'
import { PomodoroModal } from '../components/dashboard/PomodoroModal'
import { HabitCard } from '../components/habits/HabitCard'
import { HabitForm } from '../components/habits/HabitForm'
import { TodoListBlock } from '../components/todos/TodoListBlock'
import { QuickNoteBlock } from '../components/notes/QuickNoteBlock'
import { AchievementCard } from '../components/achievements/AchievementCard'
import { ACHIEVEMENTS } from '../lib/achievements'
import { addHabit, toggleHabitLog, getAllHabitLogs, subscribeUserProfile, updateTodoListItems, createTodoList, markPartnershipCheckIn } from '../firebase/firestore'
import { calculateStreak, getTodayISO, isHabitScheduledForDay } from '../lib/streaks'
import { useHabitPartnerships } from '../hooks/useHabitPartnerships'
import { useFriends } from '../hooks/useFriends'
import type { HabitLog, UserStats, UserProfile, TodoItem } from '../types'

// ─── Shared Habit Card ────────────────────────────────────────────

function SharedHabitCard({
  habit,
  partnerships,
  today,
  completed,
  onToggle,
  getPartnerInfo,
}: {
  habit: import('../types').Habit
  partnerships: import('../types').HabitPartnership[]
  today: string
  completed: boolean
  onToggle: () => void
  getPartnerInfo: (p: import('../types').HabitPartnership) => { name: string; photo: string }
}) {
  const partners = partnerships.map((p) => ({
    info: getPartnerInfo(p),
    checkedToday: p.ownerUid !== (p.partnerUid) // filled below
      ? p.partnerLastCheckDate === today
      : p.ownerLastCheckDate === today,
    partnership: p,
  }))

  const checkedCount = partners.filter((p) => p.checkedToday).length
  const allCompleted = completed && checkedCount === partners.length

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 flex items-center gap-4 transition-all rounded-2xl ${
        allCompleted
          ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-300/50 dark:shadow-violet-900/50'
          : completed
            ? 'card ring-2 ring-emerald-300 dark:ring-emerald-700/60'
            : 'card'
      }`}
    >
      {/* Emoji + stacked partner avatars */}
      <div className="relative flex-shrink-0">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${
            allCompleted
              ? 'bg-white/20'
              : completed
                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                : 'bg-slate-100 dark:bg-slate-800'
          }`}
        >
          {habit.emoji}
        </div>
        {/* Stacked avatars (máx 3 visíveis) */}
        <div className="absolute -bottom-1 -right-1 flex">
          {partners.slice(0, 3).map(({ info }, i) => (
            <div
              key={i}
              style={{ marginLeft: i === 0 ? 0 : -6 }}
              className={`w-5 h-5 rounded-full ring-2 overflow-hidden flex-shrink-0 ${
                allCompleted ? 'ring-white/40' : 'ring-white dark:ring-slate-900'
              }`}
            >
              {info.photo ? (
                <img src={info.photo} alt={info.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white text-[7px] font-bold">
                  {info.name.charAt(0)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm truncate ${
          allCompleted
            ? 'text-white'
            : completed
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-900 dark:text-white'
        }`}>
          {habit.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {allCompleted ? (
            <span className="text-xs text-white/85 font-semibold">Todos fizeram hoje! 🎉</span>
          ) : (
            <>
              <span className={`text-xs ${allCompleted ? 'text-white/70' : 'text-slate-400'}`}>
                com {partners.map((p) => p.info.name.split(' ')[0]).join(', ')}
              </span>
              {checkedCount > 0 && (
                <span className="text-xs text-emerald-500 font-medium">
                  · {checkedCount}/{partners.length} já {checkedCount === 1 ? 'fez' : 'fizeram'} 🎉
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={completed ? undefined : onToggle}
        disabled={completed}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
          completed ? 'cursor-default' : 'active:scale-90'
        } ${
          allCompleted
            ? 'bg-white/25 text-white'
            : completed
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/40'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-500'
        }`}
      >
        {completed ? <Check size={18} /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
      </button>
    </motion.div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuth()
  const { habits } = useHabits()
  const { logs } = useHabitLogs()
  const { entries } = useJournal()
  const [allLogs, setAllLogs] = useState<HabitLog[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showHabitForm, setShowHabitForm] = useState(false)
  const [showYearGrid, setShowYearGrid] = useState(false)
  const [showPomodoro, setShowPomodoro] = useState(false)

  const today = getTodayISO()
  const todayDate = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  useEffect(() => {
    if (!user) return
    getAllHabitLogs(user.uid).then(setAllLogs)
  }, [user, logs])

  useEffect(() => {
    if (!user) return
    return subscribeUserProfile(user.uid, setProfile)
  }, [user])

  const { getPartnershipsForHabit, getPartnerInfo, activePartnerships } = useHabitPartnerships()
  const { friendships } = useFriends()

  // Group shared habits by habitId — one card per habit, N partners
  const sharedHabitsToday = useMemo(() => {
    const byHabit = new Map<string, { habit: import('../types').Habit; partnerships: typeof activePartnerships; isOwner: boolean }>()

    for (const partnership of activePartnerships) {
      const isOwner = partnership.ownerUid === user?.uid
      const habitId = isOwner ? partnership.ownerHabitId : partnership.partnerHabitId
      if (!habitId) continue
      const habit = habits.find((h) => h.id === habitId)
      if (!habit) continue
      if (!isHabitScheduledForDay(habit.frequency, habit.customDays, habit.specificDates)) continue

      if (byHabit.has(habitId)) {
        byHabit.get(habitId)!.partnerships.push(partnership)
      } else {
        byHabit.set(habitId, { habit, partnerships: [partnership], isOwner })
      }
    }

    return Array.from(byHabit.values())
  }, [activePartnerships, habits, user])

  const { lists: todoLists } = useTodoLists()
  const { notes } = useQuickNotes()
  const featuredList = todoLists.find((l) => l.starred) ?? todoLists[0] ?? null
  const featuredNote = notes.find((n) => n.pinned) ?? notes[0] ?? null

  const sharedHabitIds = useMemo(
    () => new Set(sharedHabitsToday.map(({ habit }) => habit.id)),
    [sharedHabitsToday]
  )

  const todayHabits = habits.filter(
    (h) => isHabitScheduledForDay(h.frequency, h.customDays, h.specificDates) && !sharedHabitIds.has(h.id)
  )
  const completedToday = logs.filter((l) => l.date === today)

  const { current: currentStreak } = calculateStreak(allLogs)

  const stats: UserStats = {
    currentStreak,
    longestStreak: profile?.longestStreak ?? 0,
    totalHabitsCompleted: allLogs.length,
    totalJournalEntries: entries.length,
    totalPoints: profile?.totalPoints ?? 0,
    habitsCount: habits.length,
    friendsCount: friendships.length,
    partnerBonusCount: profile?.partnerBonusCount ?? 0,
  }

  const { achievements } = useAchievements(stats)

  const recentAchievements = ACHIEVEMENTS.filter((def) =>
    achievements.some((a) => a.id === def.id)
  ).slice(0, 3)

  const todayJournal = entries.find((e) => e.date === today)

  const handleToggleHabit = async (habitId: string) => {
    if (!user) return
    const currentLog = logs.find((l) => l.habitId === habitId && l.date === today) ?? null
    try {
      await toggleHabitLog(user.uid, habitId, currentLog)
      if (!currentLog) {
        const partnerships = getPartnershipsForHabit(habitId)
        if (partnerships.length > 0) {
          const bonuses = await Promise.all(
            partnerships.map((p) => markPartnershipCheckIn(user.uid, p.id, p.ownerUid === user.uid, today))
          )
          const bonusPartners = partnerships
            .filter((_, i) => bonuses[i])
            .map((p) => getPartnerInfo(p).name.split(' ')[0])
          if (bonusPartners.length > 0) {
            toast.success(`Juntos com ${bonusPartners.join(' e ')} hoje! +${bonusPartners.length * 10} pts bônus 🎉`, { duration: 4000 })
          } else {
            toast('Hábito concluído! 🎉', { icon: '✅' })
          }
        } else {
          toast('Hábito concluído! 🎉', { icon: '✅' })
        }
      }
    } catch {
      toast.error('Erro ao atualizar hábito')
    }
  }

  const handleAddHabit = async (data: Parameters<typeof addHabit>[1]) => {
    if (!user) return
    try {
      await addHabit(user.uid, data)
      toast.success('Hábito criado!')
    } catch {
      toast.error('Erro ao criar hábito')
    }
  }

  const getHabitStreak = (habitId: string) => {
    const habitLogs = allLogs.filter((l) => l.habitId === habitId)
    return calculateStreak(habitLogs).current
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-slate-500 dark:text-slate-400 text-sm capitalize">{todayDate}</p>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            {greeting()},{' '}
            <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              {user?.displayName?.split(' ')[0]} 👋
            </span>
          </h1>
          <button
            onClick={() => setShowYearGrid(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
            title="Ver ano em pontos"
          >
            <Grid3X3 size={20} />
          </button>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
      >
        <div className="card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame size={15} className="text-orange-500" />
            <span className="text-2xl font-black text-slate-900 dark:text-white">{currentStreak}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">dias seguidos</p>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {allLogs.length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">completions</p>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {profile?.totalPoints ?? 0}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">pontos ✨</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowPomodoro(true)}
          className="card p-3 text-center hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors group"
        >
          <div className="flex items-center justify-center mb-1">
            <motion.span
              animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
              transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.6 }}
              className="text-2xl"
            >
              🥚
            </motion.span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-violet-500 transition-colors">foco</p>
        </motion.button>
      </motion.div>

      {/* Today's habits */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Hábitos de hoje</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {completedToday.length}/{todayHabits.length} concluídos
            </p>
          </div>
          <button
            onClick={() => setShowHabitForm(true)}
            className="p-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            <Plus size={18} />
          </button>
        </div>

        {todayHabits.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-3">🌱</div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Nenhum hábito ainda!</p>
            <p className="text-sm text-slate-400 mt-1">Clique em + para criar seu primeiro hábito</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {todayHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                log={logs.find((l) => l.habitId === habit.id && l.date === today) ?? null}
                streak={getHabitStreak(habit.id)}
                onToggle={() => handleToggleHabit(habit.id)}
              />
            ))}
          </div>
        )}
      </motion.section>

      {/* Shared habits — "Com amigos" */}
      {sharedHabitsToday.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-violet-500" />
            <h2 className="font-bold text-slate-900 dark:text-white">Com amigos</h2>
          </div>
          <div className="space-y-3">
            {sharedHabitsToday.map(({ habit, partnerships }) => (
              <SharedHabitCard
                key={habit.id}
                habit={habit}
                partnerships={partnerships}
                today={today}
                completed={!!logs.find((l) => l.habitId === habit.id && l.date === today)}
                onToggle={() => handleToggleHabit(habit.id)}
                getPartnerInfo={getPartnerInfo}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* Todo + Notes grid */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {/* To-do block */}
        {featuredList ? (
          <TodoListBlock
            list={featuredList}
            onToggleItem={async (itemId) => {
              if (!user) return
              const updated = featuredList.items.map((i) =>
                i.id === itemId ? { ...i, done: !i.done } : i
              )
              await updateTodoListItems(user.uid, featuredList.id, updated)
            }}
            onAddItem={async (text) => {
              if (!user) return
              const newItem: TodoItem = { id: Math.random().toString(36).slice(2, 10), text, done: false }
              await updateTodoListItems(user.uid, featuredList.id, [...featuredList.items, newItem])
            }}
            onReorderItems={async (items) => {
              if (!user) return
              await updateTodoListItems(user.uid, featuredList.id, items)
            }}
          />
        ) : (
          <button
            onClick={async () => { if (user) await createTodoList(user.uid, 'Minha lista') }}
            className="card p-4 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-2 border-dashed border-slate-200 dark:border-slate-700"
          >
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Criar lista de tarefas</p>
              <p className="text-xs text-slate-400">Clique para começar</p>
            </div>
          </button>
        )}

        {/* Note block */}
        {featuredNote && user ? (
          <QuickNoteBlock note={featuredNote} uid={user.uid} />
        ) : (
          <button
            onClick={async () => { if (user) { const { createQuickNote: create } = await import('../firebase/firestore'); await create(user.uid, 'yellow') } }}
            className="card p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-2 border-dashed border-slate-200 dark:border-slate-700"
          >
            <span className="text-2xl">📝</span>
            <div className="text-center">
              <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Criar nota rápida</p>
              <p className="text-xs text-slate-400">Clique para começar</p>
            </div>
          </button>
        )}
      </motion.section>

      {/* Journal shortcut */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <Link to="/journal">
          <div className={`card p-5 hover:scale-[1.01] transition-all cursor-pointer border-2 ${todayJournal ? 'border-emerald-300 dark:border-emerald-700' : 'border-dashed border-violet-200 dark:border-violet-800'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <BookOpen size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {todayJournal ? 'Ver entrada de hoje' : 'Escrever no diário'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {todayJournal ? '✅ Entrada salva hoje' : 'Uma pergunta te espera 💭'}
                  </p>
                </div>
              </div>
              <ArrowRight size={18} className="text-slate-400" />
            </div>
          </div>
        </Link>
      </motion.section>

      {/* Recent achievements */}
      {recentAchievements.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" />
              Conquistas recentes
            </h2>
            <Link
              to="/achievements"
              className="text-sm text-violet-500 font-medium hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {recentAchievements.map((def) => (
              <AchievementCard
                key={def.id}
                def={def}
                unlocked={achievements.find((a) => a.id === def.id)}
              />
            ))}
          </div>
        </motion.section>
      )}

      <PomodoroModal open={showPomodoro} onClose={() => setShowPomodoro(false)} />

      <HabitForm
        open={showHabitForm}
        onClose={() => setShowHabitForm(false)}
        onSave={handleAddHabit}
        habitCount={habits.length}
      />

      <YearGrid
        open={showYearGrid}
        habitLogs={allLogs}
        journalEntries={entries}
        onClose={() => setShowYearGrid(false)}
      />
    </div>
  )
}
