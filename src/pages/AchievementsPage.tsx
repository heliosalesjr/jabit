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

// ─── tipos temporários (mover para src/types/index.ts quando implementar o Firestore) ───
type EggType = 'forest' | 'river' | 'night' | 'stellar' | 'partnership'
type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
type CreatureStage = 1 | 2 | 3

interface EggData {
  id: string
  type: EggType
  status: 'incubating' | 'locked'
  currentXP: number
  requiredXP: number
  rarity: Rarity
}

interface CreatureData {
  id: string
  speciesId: string
  name: string
  stage: CreatureStage
  rarity: Rarity
  emoji: string
}

// ─── dados mock — substituir por hooks do Firestore ───
const MOCK_ACTIVE_EGG: EggData = {
  id: 'egg1', type: 'forest', status: 'incubating', currentXP: 140, requiredXP: 200, rarity: 'common',
}
const MOCK_EGG_QUEUE: EggData[] = [
  { id: 'egg2', type: 'river', status: 'locked', currentXP: 0, requiredXP: 350, rarity: 'uncommon' },
  { id: 'egg3', type: 'night', status: 'locked', currentXP: 0, requiredXP: 600, rarity: 'rare' },
]
const MOCK_CREATURES: CreatureData[] = [
  { id: 'c1', speciesId: 'capivara', name: 'Capivara', stage: 2, rarity: 'common', emoji: '🦫' },
  { id: 'c2', speciesId: 'tucano', name: 'Tucano', stage: 1, rarity: 'common', emoji: '🦜' },
]
const MVP_SPECIES = [
  { speciesId: 'capivara', name: 'Capivara', rarity: 'common' as Rarity, emoji: '🦫' },
  { speciesId: 'tucano', name: 'Tucano', rarity: 'common' as Rarity, emoji: '🦜' },
  { speciesId: 'onca', name: 'Onça-pintada', rarity: 'uncommon' as Rarity, emoji: '🐆' },
  { speciesId: 'dragao', name: 'Dragão das Serras', rarity: 'rare' as Rarity, emoji: '🐉' },
]

// ─── helpers visuais ───
const EGG_VISUALS: Record<EggType, { emoji: string; label: string; gradient: string }> = {
  forest:      { emoji: '🥚', label: 'Ovo da Floresta', gradient: 'from-green-400 to-emerald-600' },
  river:       { emoji: '🥚', label: 'Ovo do Rio',      gradient: 'from-cyan-400 to-blue-600' },
  night:       { emoji: '🥚', label: 'Ovo Noturno',     gradient: 'from-violet-500 to-purple-800' },
  stellar:     { emoji: '🥚', label: 'Ovo Estelar',     gradient: 'from-yellow-300 to-amber-500' },
  partnership: { emoji: '🥚', label: 'Ovo de Parceria', gradient: 'from-pink-400 to-rose-600' },
}
const RARITY_STYLES: Record<Rarity, { label: string; color: string }> = {
  common:    { label: 'Comum',    color: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  uncommon:  { label: 'Incomum',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  rare:      { label: 'Raro',     color: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300' },
  epic:      { label: 'Épico',    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  legendary: { label: 'Lendário', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
}
const STAGE_LABEL: Record<CreatureStage, string> = { 1: 'Filhote', 2: 'Jovem', 3: 'Adulto' }

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

  const [activeEgg, setActiveEgg] = useState<EggData>(MOCK_ACTIVE_EGG)
  const [eggQueue, setEggQueue] = useState<EggData[]>(MOCK_EGG_QUEUE)

  const handleActivateEgg = (egg: EggData) => {
    setActiveEgg({ ...egg, status: 'incubating' })
    setEggQueue((q) =>
      q.map((e) => e.id === egg.id ? { ...activeEgg, status: 'locked' } : e)
    )
  }

  const myCreatures = MOCK_CREATURES
  const discoveredSpecies = new Set(myCreatures.map((c) => c.speciesId))

  return (
    <div className="p-6 max-w-2xl mx-auto">

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Coleção</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Ovos, criaturas e conquistas
        </p>
      </motion.div>

      {/* ── Seção: Ovos ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Ovos</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
          1 ativo · {eggQueue.length} na fila
          {eggQueue.length > 0 && <span className="text-violet-400 dark:text-violet-500"> · toque na fila para trocar</span>}
        </p>

        {/* Ovo ativo */}
        <div className="rounded-3xl overflow-hidden mb-3">
          <div className={`bg-gradient-to-br ${EGG_VISUALS[activeEgg.type].gradient} p-5 flex items-center gap-5`}>
            <motion.div
              key={activeEgg.id}
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' as const }}
              className="text-6xl select-none"
            >
              {EGG_VISUALS[activeEgg.type].emoji}
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-bold text-base">{EGG_VISUALS[activeEgg.type].label}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${RARITY_STYLES[activeEgg.rarity].color}`}>
                  {RARITY_STYLES[activeEgg.rarity].label}
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 mb-1">
                <motion.div
                  key={activeEgg.id}
                  initial={{ width: 0 }}
                  animate={{ width: `${(activeEgg.currentXP / activeEgg.requiredXP) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="bg-white h-3 rounded-full"
                />
              </div>
              <p className="text-white/70 text-xs">
                {activeEgg.currentXP} / {activeEgg.requiredXP} XP de incubação
              </p>
            </div>
          </div>
        </div>

        {/* Fila de ovos — clicáveis para ativar */}
        {eggQueue.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {eggQueue.map((egg, i) => (
              <motion.button
                key={egg.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleActivateEgg(egg)}
                className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-2xl px-4 py-3 transition-colors group text-left"
              >
                <span className="text-2xl">{EGG_VISUALS[egg.type].emoji}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                    {EGG_VISUALS[egg.type].label}
                  </p>
                  <p className={`text-xs font-medium ${RARITY_STYLES[egg.rarity].color} rounded-full px-1.5 py-0.5 inline-block mt-0.5`}>
                    {RARITY_STYLES[egg.rarity].label}
                  </p>
                </div>
                <span className="text-xs font-semibold text-violet-400 dark:text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0">
                  Ativar →
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Seção: Criaturas ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Criaturas</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
          {discoveredSpecies.size}/{MVP_SPECIES.length} descobertas
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MVP_SPECIES.map((species, i) => {
            const found = myCreatures.find((c) => c.speciesId === species.speciesId)
            return (
              <motion.div
                key={species.speciesId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className={`rounded-2xl p-4 flex flex-col items-center gap-2 text-center
                  ${found
                    ? 'bg-white dark:bg-slate-800 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/50'
                  }`}
              >
                <span className={`text-4xl ${found ? '' : 'grayscale opacity-30'}`}>
                  {found ? species.emoji : '❓'}
                </span>
                <div>
                  <p className={`text-sm font-bold leading-tight ${found ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>
                    {found ? species.name : '???'}
                  </p>
                  {found ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {STAGE_LABEL[found.stage]}
                    </p>
                  ) : null}
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${found ? RARITY_STYLES[species.rarity].color : 'bg-transparent text-slate-300 dark:text-slate-600'}`}>
                  {found ? RARITY_STYLES[species.rarity].label : '—'}
                </span>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ── Seção: Conquistas ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Conquistas</h2>
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
