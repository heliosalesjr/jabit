import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, BookOpen, Trophy, Plus, ArrowRight } from 'lucide-react'
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
import { HabitCard } from '../components/habits/HabitCard'
import { HabitForm } from '../components/habits/HabitForm'
import { TodoListBlock } from '../components/todos/TodoListBlock'
import { QuickNoteBlock } from '../components/notes/QuickNoteBlock'
import { AchievementCard } from '../components/achievements/AchievementCard'
import { ACHIEVEMENTS } from '../lib/achievements'
import { addHabit, toggleHabitLog, getAllHabitLogs, subscribeUserProfile, updateTodoListItems, createTodoList, markPartnershipCheckIn } from '../firebase/firestore'
import { calculateStreak, getTodayISO, isHabitScheduledForDay } from '../lib/streaks'
import { useHabitPartnerships } from '../hooks/useHabitPartnerships'
import type { HabitLog, UserStats, UserProfile, TodoItem } from '../types'

export function DashboardPage() {
  const { user } = useAuth()
  const { habits } = useHabits()
  const { logs } = useHabitLogs()
  const { entries } = useJournal()
  const [allLogs, setAllLogs] = useState<HabitLog[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showHabitForm, setShowHabitForm] = useState(false)

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

  const { getPartnershipForHabit, getPartnerInfo } = useHabitPartnerships()

  const { lists: todoLists } = useTodoLists()
  const { notes } = useQuickNotes()
  const featuredList = todoLists.find((l) => l.starred) ?? todoLists[0] ?? null
  const featuredNote = notes.find((n) => n.pinned) ?? notes[0] ?? null

  const todayHabits = habits.filter((h) => isHabitScheduledForDay(h.frequency, h.customDays))
  const completedToday = logs.filter((l) => l.date === today)

  const { current: currentStreak } = calculateStreak(allLogs)

  const stats: UserStats = {
    currentStreak,
    longestStreak: profile?.longestStreak ?? 0,
    totalHabitsCompleted: allLogs.length,
    totalJournalEntries: entries.length,
    totalPoints: profile?.totalPoints ?? 0,
    habitsCount: habits.length,
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
        // Check for active partnership bonus
        const partnership = getPartnershipForHabit(habitId)
        if (partnership) {
          const isOwner = partnership.ownerUid === user.uid
          const bonusEarned = await markPartnershipCheckIn(user.uid, partnership.id, isOwner, today)
          if (bonusEarned) {
            const partner = getPartnerInfo(partnership)
            toast.success(`Juntos com ${partner.name.split(' ')[0]} hoje! +10 pts bônus 🎉`, {
              duration: 4000,
            })
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
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
          {greeting()},{' '}
          <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            {user?.displayName?.split(' ')[0]} 👋
          </span>
        </h1>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-8"
      >
        <div className="card p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame size={16} className="text-orange-500" />
            <span className="text-2xl font-black text-slate-900 dark:text-white">{currentStreak}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">dias seguidos</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {allLogs.length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">completions</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {profile?.totalPoints ?? 0}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">pontos ✨</p>
        </div>
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
            className="card p-4 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-2 border-dashed border-slate-200 dark:border-slate-700"
          >
            <span className="text-2xl">📝</span>
            <div>
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

      <HabitForm
        open={showHabitForm}
        onClose={() => setShowHabitForm(false)}
        onSave={handleAddHabit}
        habitCount={habits.length}
      />
    </div>
  )
}
