import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { format, eachDayOfInterval, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { HabitLog, JournalEntry } from '../../types'

interface YearGridProps {
  open: boolean
  habitLogs: HabitLog[]
  journalEntries: JournalEntry[]
  year?: number
  onClose: () => void
}

export function YearGrid({ open, habitLogs, journalEntries, year = new Date().getFullYear(), onClose }: YearGridProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  const habitDays = useMemo(() => new Set(habitLogs.map((l) => l.date)), [habitLogs])
  const journalDays = useMemo(() => new Set(journalEntries.map((e) => e.date)), [journalEntries])

  const allDays = useMemo(() =>
    eachDayOfInterval({ start: new Date(year, 0, 1), end: new Date(year, 11, 31) }),
    [year]
  )

  const today = format(new Date(), 'yyyy-MM-dd')

  const getDotStyle = (iso: string, isHovered: boolean) => {
    const hasHabit = habitDays.has(iso)
    const hasJournal = journalDays.has(iso)
    const scale = isHovered ? 2.2 : 1

    if (hasHabit && hasJournal) return {
      backgroundColor: '#a78bfa',
      boxShadow: isHovered
        ? '0 0 10px 4px rgba(167,139,250,0.9), 0 0 24px 8px rgba(167,139,250,0.5)'
        : '0 0 6px 2px rgba(167,139,250,0.7), 0 0 12px 4px rgba(167,139,250,0.3)',
      scale,
    }
    if (hasHabit) return {
      backgroundColor: '#60a5fa',
      boxShadow: isHovered
        ? '0 0 10px 4px rgba(96,165,250,0.9), 0 0 24px 8px rgba(96,165,250,0.5)'
        : '0 0 6px 2px rgba(96,165,250,0.7), 0 0 12px 4px rgba(96,165,250,0.3)',
      scale,
    }
    if (hasJournal) return {
      backgroundColor: '#fbbf24',
      boxShadow: isHovered
        ? '0 0 10px 4px rgba(251,191,36,0.9), 0 0 24px 8px rgba(251,191,36,0.5)'
        : '0 0 6px 2px rgba(251,191,36,0.7), 0 0 12px 4px rgba(251,191,36,0.3)',
      scale,
    }
    return {
      backgroundColor: undefined,
      boxShadow: undefined,
      scale,
    }
  }

  const hoveredLabel = hovered
    ? format(parseISO(hovered), "d 'de' MMMM", { locale: ptBR })
    : null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-950 rounded-3xl p-8 w-full max-w-md shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-black text-slate-900 dark:text-white text-xl tracking-tight">{year}</h2>
                <div className="h-5 mt-1">
                  {hoveredLabel ? (
                    <motion.p
                      key={hoveredLabel}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-slate-400 dark:text-slate-500"
                    >
                      {hoveredLabel}
                    </motion.p>
                  ) : (
                    <p className="text-sm text-slate-300 dark:text-slate-700">passe o mouse sobre um dia</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Dot field */}
            <div className="flex flex-wrap gap-[14px]">
              {allDays.map((day) => {
                const iso = format(day, 'yyyy-MM-dd')
                const isToday = iso === today
                const isHovered = iso === hovered
                const { backgroundColor, boxShadow, scale } = getDotStyle(iso, isHovered)
                const inactive = !backgroundColor

                return (
                  <motion.div
                    key={iso}
                    onMouseEnter={() => setHovered(iso)}
                    onMouseLeave={() => setHovered(null)}
                    animate={{ scale, boxShadow: boxShadow ?? 'none' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                    style={{ backgroundColor: backgroundColor ?? undefined }}
                    className={`w-[7px] h-[7px] rounded-full cursor-default ${
                      inactive ? 'bg-slate-200 dark:bg-slate-700/60' : ''
                    } ${
                      isToday ? 'ring-1 ring-offset-[1.5px] ring-slate-400 dark:ring-slate-400 ring-offset-white dark:ring-offset-slate-950' : ''
                    }`}
                  />
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-6 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                hábito
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                diário
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <div className="w-2 h-2 rounded-full bg-violet-500 dark:bg-violet-400" />
                ambos
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
