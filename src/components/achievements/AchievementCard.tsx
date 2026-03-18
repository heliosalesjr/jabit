import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { AchievementDef, Achievement } from '../../types'

interface AchievementCardProps {
  def: AchievementDef
  unlocked?: Achievement
}

export function AchievementCard({ def, unlocked }: AchievementCardProps) {
  const isUnlocked = !!unlocked

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={isUnlocked ? { scale: 1.05 } : {}}
      className={cn(
        'relative card p-5 text-center transition-all duration-200',
        !isUnlocked && 'opacity-50 grayscale'
      )}
    >
      {isUnlocked && (
        <div
          className={cn(
            'absolute inset-0 rounded-2xl opacity-10 bg-gradient-to-br',
            def.gradient
          )}
        />
      )}

      <div
        className={cn(
          'w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl relative',
          isUnlocked
            ? `bg-gradient-to-br ${def.gradient} shadow-lg`
            : 'bg-slate-200 dark:bg-slate-800'
        )}
      >
        {isUnlocked ? def.emoji : <Lock size={24} className="text-slate-400" />}
      </div>

      <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">{def.title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{def.description}</p>

      {def.points > 0 && (
        <div
          className={cn(
            'mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold',
            isUnlocked
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          )}
        >
          ✨ {def.points} pts
        </div>
      )}
    </motion.div>
  )
}
