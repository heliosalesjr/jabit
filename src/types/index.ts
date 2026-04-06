import { Timestamp } from 'firebase/firestore'

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL: string
  createdAt: Timestamp
  totalPoints: number
  currentStreak: number
  longestStreak: number
  partnerBonusCount: number
  theme: 'light' | 'dark'
}

export type HabitColor =
  | 'violet'
  | 'fuchsia'
  | 'pink'
  | 'amber'
  | 'emerald'
  | 'sky'
  | 'coral'
  | 'rose'
  | 'teal'

export interface Habit {
  id: string
  name: string
  emoji: string
  color: HabitColor
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom'
  customDays?: number[]
  specificDates?: string[]
  targetCount: number
  order: number
  archivedAt?: Timestamp
  createdAt: Timestamp
  partnershipIds?: string[]
  googleCalendarEventId?: string
  googleCalendarSync?: boolean
}

export interface HabitPartnership {
  id: string
  ownerUid: string
  ownerName: string
  ownerPhoto: string
  ownerHabitId: string
  ownerHabitName: string
  ownerHabitEmoji: string
  ownerHabitColor: HabitColor
  ownerHabitFrequency: 'daily' | 'weekdays' | 'weekends' | 'custom'
  ownerHabitTargetCount: number
  ownerHabitCustomDays?: number[]
  partnerUid: string
  partnerName: string
  partnerPhoto: string
  partnerHabitId?: string
  ownerLastCheckDate?: string   // ISO date, updated on each owner check-in
  partnerLastCheckDate?: string // ISO date, updated on each partner check-in
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Timestamp
}

export interface HabitLog {
  id: string
  habitId: string
  date: string // ISO "2026-03-18"
  completedCount: number
  completedAt: Timestamp
}

export interface JournalEntry {
  id: string
  date: string // ISO date, one per day
  promptQuestion: string
  content: string
  mood?: 1 | 2 | 3 | 4 | 5
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Achievement {
  id: string
  unlockedAt: Timestamp
  seen: boolean
}

export interface AchievementDef {
  id: string
  title: string
  description: string
  emoji: string
  gradient: string
  points: number
  condition: (stats: UserStats) => boolean
}

export type NoteColor = 'yellow' | 'pink' | 'sky' | 'emerald' | 'violet' | 'orange'

export interface QuickNote {
  id: string
  content: string // max 280 chars
  color: NoteColor
  pinned: boolean
  archivedAt: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface TodoItem {
  id: string
  text: string
  done: boolean
}

export interface TodoList {
  id: string
  name: string
  starred: boolean
  archivedAt: Timestamp | null
  createdAt: Timestamp
  items: TodoItem[]
}

export interface UserStats {
  currentStreak: number
  longestStreak: number
  totalHabitsCompleted: number
  totalJournalEntries: number
  totalPoints: number
  habitsCount: number
  friendsCount: number
  partnerBonusCount: number
}

export interface FriendRequest {
  id: string
  fromUid: string
  fromName: string
  fromPhoto: string
  toEmail: string
  toUid?: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Timestamp
}

export interface Friendship {
  id: string
  users: string[]
  createdAt: Timestamp
}

export interface PendingInvite {
  fromUid: string
  fromName: string
  fromPhoto: string
  toEmail: string
  createdAt: Timestamp
}
