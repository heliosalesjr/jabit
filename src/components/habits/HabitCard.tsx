import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Flame } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { Habit, HabitLog } from '../../types'

const colorMap: Record<string, { bg: string; ring: string; text: string }> = {
  violet: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    ring: 'ring-violet-400',
    text: 'text-violet-600 dark:text-violet-400',
  },
  fuchsia: {
    bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    ring: 'ring-fuchsia-400',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    ring: 'ring-pink-400',
    text: 'text-pink-600 dark:text-pink-400',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    ring: 'ring-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    ring: 'ring-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  sky: {
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    ring: 'ring-sky-400',
    text: 'text-sky-600 dark:text-sky-400',
  },
  coral: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    ring: 'ring-orange-400',
    text: 'text-orange-600 dark:text-orange-400',
  },
  rose: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    ring: 'ring-rose-400',
    text: 'text-rose-600 dark:text-rose-400',
  },
  teal: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    ring: 'ring-teal-400',
    text: 'text-teal-600 dark:text-teal-400',
  },
}

interface HabitCardProps {
  habit: Habit
  log: HabitLog | null
  streak: number
  onToggle: () => void
}

export function HabitCard({ habit, log, streak, onToggle }: HabitCardProps) {
  const colors = colorMap[habit.color] ?? colorMap.violet
  const completed = !!log

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      className={cn(
        'card p-4 cursor-pointer select-none transition-all duration-200',
        completed && `ring-2 ${colors.ring} ${colors.bg}`
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0',
            colors.bg
          )}
        >
          {habit.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white truncate">{habit.name}</p>
          {streak > 0 && (
            <div className={cn('flex items-center gap-1 mt-0.5', colors.text)}>
              <Flame size={12} />
              <span className="text-xs font-medium">{streak} dias</span>
            </div>
          )}
        </div>

        <motion.div
          animate={completed ? { scale: [1, 1.3, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          className={cn(colors.text)}
        >
          {completed ? <CheckCircle2 size={28} /> : <Circle size={28} className="text-slate-300 dark:text-slate-600" />}
        </motion.div>
      </div>
    </motion.div>
  )
}
