import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useHabits } from '../hooks/useHabits'
import { useJournal } from '../hooks/useJournal'
import { useFriends } from '../hooks/useFriends'
import { useAchievements } from '../hooks/useAchievements'
import { AchievementCard } from '../components/achievements/AchievementCard'
import { ACHIEVEMENTS } from '../lib/achievements'
import { getAllHabitLogs, subscribeUserProfile } from '../firebase/firestore'
import { calculateStreak } from '../lib/streaks'
import type { HabitLog, UserStats, UserProfile } from '../types'

export function AchievementsPage() {
  const { user } = useAuth()
  const { habits } = useHabits()
  const { entries } = useJournal()
  const [allLogs, setAllLogs] = useState<HabitLog[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (!user) return
    getAllHabitLogs(user.uid).then(setAllLogs)
    return subscribeUserProfile(user.uid, setProfile)
  }, [user])

  const { current: currentStreak, longest: longestStreak } = calculateStreak(allLogs)
  const { friendships } = useFriends()

  const stats: UserStats = {
    currentStreak,
    longestStreak,
    totalHabitsCompleted: allLogs.length,
    totalJournalEntries: entries.length,
    totalPoints: profile?.totalPoints ?? 0,
    habitsCount: habits.length,
    friendsCount: friendships.length,
    partnerBonusCount: profile?.partnerBonusCount ?? 0,
  }

  const { achievements } = useAchievements(stats)
  const unlockedCount = achievements.length

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Conquistas</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          {unlockedCount}/{ACHIEVEMENTS.length} desbloqueadas
        </p>
      </motion.div>

      {/* Points banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative rounded-3xl overflow-hidden mb-8"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500" />
        <div className="relative p-6 flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">Total de pontos</p>
            <p className="text-5xl font-black text-white mt-1">{stats.totalPoints}</p>
            <p className="text-white/70 text-xs mt-1">
              {unlockedCount} conquista{unlockedCount !== 1 ? 's' : ''} desbloqueada{unlockedCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-8xl">🏆</div>
        </div>
      </motion.div>

      {/* Achievements grid */}
      {(() => {
        const SOCIAL_IDS = new Set(['first_friend', 'sync_first', 'sync_5', 'sync_30'])
        const solo = ACHIEVEMENTS.filter((d) => !SOCIAL_IDS.has(d.id))
        const social = ACHIEVEMENTS.filter((d) => SOCIAL_IDS.has(d.id))

        return (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {solo.map((def, i) => (
                <motion.div
                  key={def.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <AchievementCard
                    def={def}
                    unlocked={achievements.find((a) => a.id === def.id)}
                  />
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-3"
            >
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide px-1 mb-3 flex items-center gap-2">
                🤝 Com amigos
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {social.map((def, i) => (
                  <motion.div
                    key={def.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.32 + i * 0.04 }}
                  >
                    <AchievementCard
                      def={def}
                      unlocked={achievements.find((a) => a.id === def.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )
      })()}
    </div>
  )
}
