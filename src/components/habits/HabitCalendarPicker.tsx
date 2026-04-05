import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { HabitColor } from '../../types'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const DAY_HEADERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const selectedBg: Record<HabitColor, string> = {
  violet:  'bg-violet-500 text-white hover:bg-violet-600',
  fuchsia: 'bg-fuchsia-500 text-white hover:bg-fuchsia-600',
  pink:    'bg-pink-500 text-white hover:bg-pink-600',
  amber:   'bg-amber-500 text-white hover:bg-amber-600',
  emerald: 'bg-emerald-500 text-white hover:bg-emerald-600',
  sky:     'bg-sky-500 text-white hover:bg-sky-600',
  coral:   'bg-orange-500 text-white hover:bg-orange-600',
  rose:    'bg-rose-500 text-white hover:bg-rose-600',
  teal:    'bg-teal-500 text-white hover:bg-teal-600',
}

function isoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function buildCalendarDays(year: number, month: number) {
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const cells: Array<{ date: Date; current: boolean }> = []

  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevMonthDays - i), current: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), current: true })
  }
  let next = 1
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, next++), current: false })
  }
  return cells
}

interface HabitCalendarPickerProps {
  selectedDates: string[]
  onChange: (dates: string[]) => void
  color: HabitColor
}

export function HabitCalendarPicker({ selectedDates, onChange, color }: HabitCalendarPickerProps) {
  const todayStr = isoDate(new Date())
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  const cells = buildCalendarDays(viewYear, viewMonth)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const toggle = (dateStr: string) => {
    onChange(
      selectedDates.includes(dateStr)
        ? selectedDates.filter(d => d !== dateStr)
        : [...selectedDates, dateStr].sort()
    )
  }

  return (
    <div>
      {/* Month header */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 select-none">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((d, i) => (
          <p key={i} className="text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-0.5">
            {d}
          </p>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map(({ date, current }) => {
          const str = isoDate(date)
          const selected = selectedDates.includes(str)
          const isToday = str === todayStr
          const isPast = str < todayStr

          return (
            <button
              key={str}
              type="button"
              onClick={() => current && !isPast && toggle(str)}
              disabled={!current || isPast}
              className={cn(
                'aspect-square flex items-center justify-center rounded-xl text-xs font-medium transition-all',
                (!current || isPast) && 'opacity-20 cursor-default pointer-events-none',
                current && !isPast && !selected && 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                current && !isPast && selected && selectedBg[color],
                isToday && !selected && 'ring-2 ring-violet-400 dark:ring-violet-500 font-bold',
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>

      {/* Count */}
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2.5 text-right">
        {selectedDates.length === 0
          ? 'Nenhum dia selecionado'
          : `${selectedDates.length} dia${selectedDates.length !== 1 ? 's' : ''} selecionado${selectedDates.length !== 1 ? 's' : ''}`}
      </p>
    </div>
  )
}
