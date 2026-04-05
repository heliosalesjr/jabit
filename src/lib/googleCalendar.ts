const CALENDAR_API = 'https://www.googleapis.com/calendar/v3'
const TOKEN_KEY = 'gcal_access_token'
const TOKEN_EXPIRY_KEY = 'gcal_token_expiry'

// ─── Token management ─────────────────────────────────────────────

export function saveCalendarToken(token: string, expiresIn = 3600) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresIn * 1000))
}

export function clearCalendarToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

export function getCalendarToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!token || !expiry) return null
  if (Date.now() > Number(expiry)) {
    clearCalendarToken()
    return null
  }
  return token
}

export function isCalendarConnected(): boolean {
  return getCalendarToken() !== null
}

// ─── Helpers ──────────────────────────────────────────────────────

const DAY_MAP = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function toRRule(frequency: string, customDays?: number[]): string {
  if (frequency === 'daily') return 'RRULE:FREQ=DAILY'
  if (frequency === 'weekdays') return 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'
  if (frequency === 'weekends') return 'RRULE:FREQ=WEEKLY;BYDAY=SA,SU'
  if (frequency === 'custom' && customDays?.length) {
    const byDay = customDays.map((d) => DAY_MAP[d]).join(',')
    return `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`
  }
  return 'RRULE:FREQ=DAILY'
}

type HabitInput = {
  name: string
  emoji: string
  frequency: string
  customDays?: number[]
  timeWindow?: { start: string; end: string }
}

function buildEventBody(habit: HabitInput) {
  const summary = `${habit.emoji} ${habit.name}`
  const recurrence = [toRRule(habit.frequency, habit.customDays)]
  const today = new Date().toISOString().split('T')[0]

  if (habit.timeWindow) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return {
      summary,
      recurrence,
      start: { dateTime: `${today}T${habit.timeWindow.start}:00`, timeZone: tz },
      end: { dateTime: `${today}T${habit.timeWindow.end}:00`, timeZone: tz },
    }
  }

  // All-day event — end date must be the day after for Google Calendar
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  return {
    summary,
    recurrence,
    start: { date: today },
    end: { date: tomorrow },
  }
}

// ─── API calls ────────────────────────────────────────────────────

export async function createCalendarEvent(habit: HabitInput, token: string): Promise<string | null> {
  const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildEventBody(habit)),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.id as string
}

export async function updateCalendarEvent(
  eventId: string,
  habit: HabitInput,
  token: string
): Promise<boolean> {
  const res = await fetch(`${CALENDAR_API}/calendars/primary/events/${eventId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildEventBody(habit)),
  })
  return res.ok
}

export async function deleteCalendarEvent(eventId: string, token: string): Promise<boolean> {
  const res = await fetch(`${CALENDAR_API}/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.ok || res.status === 404
}
