import { useMemo } from 'react'
import { format, subDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Habit, HabitLog } from '../../types'

const colorFills: Record<string, { done: string; empty: string }> = {
  violet:  { done: 'bg-violet-400 dark:bg-violet-500',   empty: 'bg-violet-100  dark:bg-violet-900/30' },
  fuchsia: { done: 'bg-fuchsia-400 dark:bg-fuchsia-500', empty: 'bg-fuchsia-100 dark:bg-fuchsia-900/30' },
  pink:    { done: 'bg-pink-400 dark:bg-pink-500',       empty: 'bg-pink-100    dark:bg-pink-900/30' },
  amber:   { done: 'bg-amber-400 dark:bg-amber-500',     empty: 'bg-amber-100   dark:bg-amber-900/30' },
  emerald: { done: 'bg-emerald-400 dark:bg-emerald-500', empty: 'bg-emerald-100 dark:bg-emerald-900/30' },
  sky:     { done: 'bg-sky-400 dark:bg-sky-500',         empty: 'bg-sky-100     dark:bg-sky-900/30' },
  coral:   { done: 'bg-orange-400 dark:bg-orange-500',   empty: 'bg-orange-100  dark:bg-orange-900/30' },
  rose:    { done: 'bg-rose-400 dark:bg-rose-500',       empty: 'bg-rose-100    dark:bg-rose-900/30' },
  teal:    { done: 'bg-teal-400 dark:bg-teal-500',       empty: 'bg-teal-100    dark:bg-teal-900/30' },
}

// 4 weeks × 7 days = 28 days, grid style: each column = 1 week, each row = day of week
const WEEKS = 4
const today = new Date()
const todayStr = format(today, 'yyyy-MM-dd')

// Build the 28-day grid: dates[col][row], col 0 = oldest week, row 0 = Sunday
function buildGrid(): string[][] {
  const totalDays = WEEKS * 7
  return Array.from({ length: WEEKS }, (_, col) =>
    Array.from({ length: 7 }, (_, row) => {
      const daysAgo = totalDays - 1 - (col * 7 + row)
      return format(subDays(today, daysAgo), 'yyyy-MM-dd')
    })
  )
}

interface HabitHeatmapProps {
  habits: Habit[]
  allLogs: HabitLog[]
}

export function HabitHeatmap({ habits, allLogs }: HabitHeatmapProps) {
  const grid = useMemo(() => buildGrid(), [])

  const logSet = useMemo(() => {
    const s = new Set<string>()
    for (const log of allLogs) s.add(`${log.habitId}|${log.date}`)
    return s
  }, [allLogs])

  if (habits.length === 0) return null

  const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  // Month labels: show month name on first column of each new month
  const monthLabels = grid.map((col) => {
    const firstDate = parseISO(col[0])
    const lastDate = parseISO(col[6])
    if (firstDate.getMonth() !== lastDate.getMonth()) {
      return format(lastDate, 'MMM', { locale: ptBR })
    }
    if (col[0] === grid[0][0] || parseISO(col[0]).getDate() <= 7) {
      return format(firstDate, 'MMM', { locale: ptBR })
    }
    return ''
  })

  return (
    <div className="card p-5 mt-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
        Últimos 28 dias
      </h3>

      <div className="flex gap-3">
        {/* Day-of-week labels column */}
        <div className="flex flex-col justify-between pt-5 pb-0">
          {DAY_LABELS.map((d, i) => (
            <div
              key={i}
              className="h-4 flex items-center text-[10px] text-slate-400 dark:text-slate-600 w-3 leading-none"
            >
              {/* Show only S, Q, S to avoid clutter */}
              {i === 0 || i === 3 || i === 6 ? d : ''}
            </div>
          ))}
        </div>

        {/* Main grid area */}
        <div className="flex-1 min-w-0">
          {/* Month labels */}
          <div className="flex gap-1 mb-1 ml-0">
            {grid.map((_, col) => (
              <div
                key={col}
                className="flex-1 text-[10px] text-slate-400 dark:text-slate-600 capitalize leading-none"
              >
                {monthLabels[col]}
              </div>
            ))}
          </div>

          {/* Per-habit rows */}
          <div className="space-y-2">
            {habits.map((habit) => {
              const colors = colorFills[habit.color] ?? colorFills.violet
              const doneCount = grid.flat().filter((d) => logSet.has(`${habit.id}|${d}`)).length

              return (
                <div key={habit.id} className="flex items-center gap-2">
                  {/* Emoji + name */}
                  <div className="flex items-center gap-1 w-28 flex-shrink-0">
                    <span className="text-sm leading-none">{habit.emoji}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {habit.name}
                    </span>
                  </div>

                  {/* Grid columns (weeks) */}
                  <div className="flex gap-1 flex-1">
                    {grid.map((col, colIdx) => (
                      <div key={colIdx} className="flex flex-col gap-1 flex-1">
                        {col.map((date, rowIdx) => {
                          const done = logSet.has(`${habit.id}|${date}`)
                          const isFuture = date > todayStr
                          const isToday = date === todayStr

                          return (
                            <div
                              key={rowIdx}
                              title={`${format(parseISO(date), "EEE, d 'de' MMM", { locale: ptBR })}${done ? ' ✅' : ''}`}
                              className={[
                                'h-4 rounded-sm transition-colors duration-200',
                                isFuture
                                  ? 'bg-slate-100 dark:bg-slate-800/40 opacity-0'
                                  : done
                                  ? colors.done
                                  : colors.empty,
                                isToday ? 'ring-1 ring-slate-500 dark:ring-slate-400' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Count */}
                  <div className="w-8 text-right flex-shrink-0">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {doneCount}
                    </span>
                    <span className="text-[10px] text-slate-300 dark:text-slate-700">/28</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
