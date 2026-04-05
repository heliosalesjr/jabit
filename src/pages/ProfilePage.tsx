import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Moon, Sun, Flame, Star, BookOpen, Target, Users, Trophy, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useHabits } from '../hooks/useHabits'
import { useJournal } from '../hooks/useJournal'
import { useFriends } from '../hooks/useFriends'
import { useAchievements } from '../hooks/useAchievements'
import { useGoogleCalendar } from '../hooks/useGoogleCalendar'
import { subscribeUserProfile, getAllHabitLogs } from '../firebase/firestore'
import { signOut } from '../firebase/auth'
import { calculateStreak } from '../lib/streaks'
import type { UserProfile, UserStats } from '../types'

// ─── Stat Card ─────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
}) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{value}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{label}</p>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────

export function ProfilePage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { habits } = useHabits()
  const { entries } = useJournal()
  const { friendProfiles } = useFriends()
  const { connected: calConnected, connecting: calConnecting, connect: connectCal, disconnect: disconnectCal } = useGoogleCalendar()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [totalCompletions, setTotalCompletions] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)

  useEffect(() => {
    if (!user) return
    return subscribeUserProfile(user.uid, setProfile)
  }, [user])

  useEffect(() => {
    if (!user) return
    getAllHabitLogs(user.uid).then((logs) => {
      setTotalCompletions(logs.length)
      setCurrentStreak(calculateStreak(logs).current)
    })
  }, [user])

  const stats: UserStats = {
    currentStreak,
    longestStreak: profile?.longestStreak ?? 0,
    totalHabitsCompleted: totalCompletions,
    totalJournalEntries: entries.length,
    totalPoints: profile?.totalPoints ?? 0,
    habitsCount: habits.length,
    friendsCount: friendProfiles.length,
    partnerBonusCount: profile?.partnerBonusCount ?? 0,
  }

  useAchievements(stats)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      toast.error('Erro ao sair')
    }
  }

  const handleCalConnect = async () => {
    const ok = await connectCal()
    if (ok) toast.success('Google Calendar conectado!')
    else toast.error('Não foi possível conectar o Google Calendar')
  }

  const handleCalDisconnect = () => {
    disconnectCal()
    toast('Google Calendar desconectado.')
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Perfil</h1>
      </motion.div>

      {/* Avatar + identity */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card p-6 mb-5 flex flex-col items-center text-center"
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName ?? ''}
            className="w-20 h-20 rounded-full ring-4 ring-violet-200 dark:ring-violet-800 mb-4 object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-3xl font-black mb-4">
            {user?.displayName?.charAt(0) ?? '?'}
          </div>
        )}
        <h2 className="text-xl font-black text-slate-900 dark:text-white">{user?.displayName}</h2>
        <p className="text-sm text-slate-400 mt-0.5">{user?.email}</p>
        {(profile?.totalPoints ?? 0) > 0 && (
          <div className="mt-3 flex items-center gap-1.5 bg-violet-100 dark:bg-violet-900/30 px-3 py-1.5 rounded-full">
            <Star size={13} className="text-violet-500 fill-violet-500" />
            <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
              {profile?.totalPoints ?? 0} pontos
            </span>
          </div>
        )}
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-5"
      >
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3 px-1">
          Suas estatísticas
        </p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Flame size={18} className="text-orange-500" />}
            label="Streak atual"
            value={`${currentStreak}d`}
            color="bg-orange-100 dark:bg-orange-900/30"
          />
          <StatCard
            icon={<Trophy size={18} className="text-amber-500" />}
            label="Maior streak"
            value={`${profile?.longestStreak ?? 0}d`}
            color="bg-amber-100 dark:bg-amber-900/30"
          />
          <StatCard
            icon={<Target size={18} className="text-violet-500" />}
            label="Check-ins totais"
            value={totalCompletions}
            color="bg-violet-100 dark:bg-violet-900/30"
          />
          <StatCard
            icon={<BookOpen size={18} className="text-fuchsia-500" />}
            label="Entradas no diário"
            value={entries.length}
            color="bg-fuchsia-100 dark:bg-fuchsia-900/30"
          />
          <StatCard
            icon={<Target size={18} className="text-emerald-500" />}
            label="Hábitos ativos"
            value={habits.length}
            color="bg-emerald-100 dark:bg-emerald-900/30"
          />
          <StatCard
            icon={<Users size={18} className="text-sky-500" />}
            label="Amigos"
            value={friendProfiles.length}
            color="bg-sky-100 dark:bg-sky-900/30"
          />
        </div>
      </motion.div>

      {/* Settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-5"
      >
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3 px-1">
          Configurações
        </p>
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon size={17} className="text-slate-500" />
              ) : (
                <Sun size={17} className="text-slate-500" />
              )}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tema</span>
            </div>
            <span className="text-sm text-slate-400">
              {theme === 'dark' ? 'Escuro' : 'Claro'}
            </span>
          </button>

          <button
            onClick={calConnected ? handleCalDisconnect : handleCalConnect}
            disabled={calConnecting}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <Calendar size={17} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Google Calendar
              </span>
            </div>
            <span className={`text-sm font-medium ${calConnected ? 'text-emerald-500' : 'text-slate-400'}`}>
              {calConnecting ? 'Conectando...' : calConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Sign out */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-semibold"
        >
          <LogOut size={15} />
          Sair da conta
        </button>
      </motion.div>
    </div>
  )
}
