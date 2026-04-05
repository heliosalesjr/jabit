import { format, subDays, parseISO } from 'date-fns'
import type { HabitLog } from '../types'

export function calculateStreak(logs: HabitLog[]): { current: number; longest: number } {
  if (logs.length === 0) return { current: 0, longest: 0 }

  // Get unique dates with at least one completion
  const completedDates = new Set(logs.map((l) => l.date))

  const today = format(new Date(), 'yyyy-MM-dd')
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

  // Current streak: count backwards from today or yesterday
  let current = 0
  const startDate = completedDates.has(today) ? today : completedDates.has(yesterday) ? yesterday : null

  if (startDate) {
    let checkDate = parseISO(startDate)
    while (completedDates.has(format(checkDate, 'yyyy-MM-dd'))) {
      current++
      checkDate = subDays(checkDate, 1)
    }
  }

  // Longest streak
  const sortedDates = Array.from(completedDates).sort()
  let longest = 0
  let tempStreak = 1

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = parseISO(sortedDates[i - 1])
    const curr = parseISO(sortedDates[i])
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      tempStreak++
    } else {
      longest = Math.max(longest, tempStreak)
      tempStreak = 1
    }
  }
  longest = Math.max(longest, tempStreak)

  return { current, longest }
}

export function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function isHabitScheduledForDay(
  frequency: string,
  customDays?: number[],
  specificDates?: string[]
): boolean {
  const dayOfWeek = new Date().getDay() // 0=Sun, 6=Sat
  if (frequency === 'daily') return true
  if (frequency === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5
  if (frequency === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6
  if (frequency === 'custom') {
    if (specificDates?.length) return specificDates.includes(getTodayISO())
    if (customDays?.length) return customDays.includes(dayOfWeek)
    return false
  }
  return true
}
