import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { Habit, HabitLog } from '../../types'

const colorMap: Record<string, { bg: string; bgDone: string; ring: string; text: string; streak: string }> = {
  violet:  { bg: 'bg-violet-50 dark:bg-violet-900/20',   bgDone: 'bg-violet-100 dark:bg-violet-800/50',  ring: 'ring-violet-400 dark:ring-violet-500',  text: 'text-violet-600 dark:text-violet-300',  streak: 'text-violet-500 dark:text-violet-400' },
  fuchsia: { bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', bgDone: 'bg-fuchsia-100 dark:bg-fuchsia-800/50', ring: 'ring-fuchsia-400 dark:ring-fuchsia-500', text: 'text-fuchsia-600 dark:text-fuchsia-300', streak: 'text-fuchsia-500 dark:text-fuchsia-400' },
  pink:    { bg: 'bg-pink-50 dark:bg-pink-900/20',       bgDone: 'bg-pink-100 dark:bg-pink-800/50',       ring: 'ring-pink-400 dark:ring-pink-500',       text: 'text-pink-600 dark:text-pink-300',       streak: 'text-pink-500 dark:text-pink-400' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-900/20',     bgDone: 'bg-amber-100 dark:bg-amber-800/50',     ring: 'ring-amber-400 dark:ring-amber-500',     text: 'text-amber-600 dark:text-amber-300',     streak: 'text-amber-500 dark:text-amber-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', bgDone: 'bg-emerald-100 dark:bg-emerald-800/50', ring: 'ring-emerald-400 dark:ring-emerald-500', text: 'text-emerald-600 dark:text-emerald-300', streak: 'text-emerald-500 dark:text-emerald-400' },
  sky:     { bg: 'bg-sky-50 dark:bg-sky-900/20',         bgDone: 'bg-sky-100 dark:bg-sky-800/50',         ring: 'ring-sky-400 dark:ring-sky-500',         text: 'text-sky-600 dark:text-sky-300',         streak: 'text-sky-500 dark:text-sky-400' },
  coral:   { bg: 'bg-orange-50 dark:bg-orange-900/20',   bgDone: 'bg-orange-100 dark:bg-orange-800/50',   ring: 'ring-orange-400 dark:ring-orange-500',   text: 'text-orange-600 dark:text-orange-300',   streak: 'text-orange-500 dark:text-orange-400' },
  rose:    { bg: 'bg-rose-50 dark:bg-rose-900/20',       bgDone: 'bg-rose-100 dark:bg-rose-800/50',       ring: 'ring-rose-400 dark:ring-rose-500',       text: 'text-rose-600 dark:text-rose-300',       streak: 'text-rose-500 dark:text-rose-400' },
  teal:    { bg: 'bg-teal-50 dark:bg-teal-900/20',       bgDone: 'bg-teal-100 dark:bg-teal-800/50',       ring: 'ring-teal-400 dark:ring-teal-500',       text: 'text-teal-600 dark:text-teal-300',       streak: 'text-teal-500 dark:text-teal-400' },
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={cn(
        'relative rounded-2xl p-3 cursor-pointer select-none flex flex-col items-center justify-center gap-2 aspect-square border transition-all duration-200',
        completed
          ? `${colors.bgDone} ring-2 ${colors.ring} border-transparent`
          : `${colors.bg} border-slate-100 dark:border-slate-800`
      )}
    >
      {/* Completion checkmark */}
      {completed && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2"
        >
          <div className={cn('w-4 h-4 rounded-full flex items-center justify-center', colors.ring.replace('ring-', 'bg-'))}>
            <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white" fill="none">
              <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </motion.div>
      )}

      {/* Emoji */}
      <motion.span
        animate={completed ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-3xl leading-none"
      >
        {habit.emoji}
      </motion.span>

      {/* Name */}
      <p className={cn(
        'text-xs font-semibold text-center leading-tight line-clamp-2 w-full',
        completed ? colors.text : 'text-slate-600 dark:text-slate-400'
      )}>
        {habit.name}
      </p>

      {/* Streak */}
      {streak > 0 && (
        <div className={cn('flex items-center gap-0.5', colors.streak)}>
          <Flame size={10} />
          <span className="text-[10px] font-bold">{streak}</span>
        </div>
      )}
    </motion.div>
  )
}
