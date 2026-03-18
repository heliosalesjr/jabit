import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './config'
import type { UserProfile, Habit, HabitLog, JournalEntry, Achievement } from '../types'
import { getTodayISO } from '../lib/streaks'

// ─── User Profile ────────────────────────────────────────────────
export async function createUserProfile(uid: string, data: Partial<UserProfile>) {
  await setDoc(doc(db, 'users', uid), {
    uid,
    totalPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    theme: 'light',
    createdAt: serverTimestamp(),
    ...data,
  })
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as UserProfile) : null
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  await updateDoc(doc(db, 'users', uid), data as Record<string, unknown>)
}

export function subscribeUserProfile(uid: string, cb: (profile: UserProfile | null) => void) {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    cb(snap.exists() ? (snap.data() as UserProfile) : null)
  })
}

// ─── Habits ──────────────────────────────────────────────────────
export function subscribeHabits(uid: string, cb: (habits: Habit[]) => void) {
  // Filter archivedAt client-side to avoid needing a composite index
  const q = query(collection(db, 'users', uid, 'habits'), orderBy('createdAt'))
  return onSnapshot(q, (snap) => {
    const habits = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Habit))
      .filter((h) => !h.archivedAt)
      .sort((a, b) => a.order - b.order)
    cb(habits)
  })
}

export async function addHabit(uid: string, habit: Omit<Habit, 'id' | 'createdAt'>) {
  return addDoc(collection(db, 'users', uid, 'habits'), {
    ...habit,
    archivedAt: null,
    createdAt: serverTimestamp(),
  })
}

export async function updateHabit(uid: string, habitId: string, data: Partial<Habit>) {
  await updateDoc(doc(db, 'users', uid, 'habits', habitId), data as Record<string, unknown>)
}

export async function archiveHabit(uid: string, habitId: string) {
  await updateDoc(doc(db, 'users', uid, 'habits', habitId), {
    archivedAt: serverTimestamp(),
  })
}

export async function deleteHabit(uid: string, habitId: string) {
  await deleteDoc(doc(db, 'users', uid, 'habits', habitId))
}

// ─── Habit Logs ───────────────────────────────────────────────────
export function subscribeHabitLogs(uid: string, date: string, cb: (logs: HabitLog[]) => void) {
  const q = query(collection(db, 'users', uid, 'habitLogs'), where('date', '==', date))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as HabitLog)))
  })
}

export async function getAllHabitLogs(uid: string): Promise<HabitLog[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'habitLogs'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as HabitLog))
}

export async function toggleHabitLog(
  uid: string,
  habitId: string,
  currentLog: HabitLog | null
): Promise<void> {
  if (currentLog) {
    await deleteDoc(doc(db, 'users', uid, 'habitLogs', currentLog.id))
  } else {
    await addDoc(collection(db, 'users', uid, 'habitLogs'), {
      habitId,
      date: getTodayISO(),
      completedCount: 1,
      completedAt: serverTimestamp(),
    })
  }
}

// ─── Journal ──────────────────────────────────────────────────────
export function subscribeJournalEntries(uid: string, cb: (entries: JournalEntry[]) => void) {
  // Sort client-side to avoid needing a Firestore index
  return onSnapshot(collection(db, 'users', uid, 'journalEntries'), (snap) => {
    const entries = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as JournalEntry))
      .sort((a, b) => b.date.localeCompare(a.date))
    cb(entries)
  })
}

export async function upsertJournalEntry(
  uid: string,
  date: string,
  data: Partial<JournalEntry>
): Promise<string> {
  const q = query(collection(db, 'users', uid, 'journalEntries'), where('date', '==', date))
  const snap = await getDocs(q)

  if (!snap.empty) {
    const id = snap.docs[0].id
    await updateDoc(doc(db, 'users', uid, 'journalEntries', id), {
      ...data,
      updatedAt: serverTimestamp(),
    })
    return id
  } else {
    const ref = await addDoc(collection(db, 'users', uid, 'journalEntries'), {
      ...data,
      date,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}

// ─── Achievements ─────────────────────────────────────────────────
export function subscribeAchievements(uid: string, cb: (achievements: Achievement[]) => void) {
  return onSnapshot(collection(db, 'users', uid, 'achievements'), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Achievement)))
  })
}

export async function unlockAchievements(
  uid: string,
  ids: string[],
  pointsToAdd: number
): Promise<void> {
  const batch = writeBatch(db)
  for (const id of ids) {
    batch.set(doc(db, 'users', uid, 'achievements', id), {
      id,
      unlockedAt: Timestamp.now(),
      seen: false,
    })
  }
  const userRef = doc(db, 'users', uid)
  const userSnap = await getDoc(userRef)
  const current = userSnap.data()?.totalPoints ?? 0
  batch.update(userRef, { totalPoints: current + pointsToAdd })
  await batch.commit()
}

export async function markAchievementSeen(uid: string, achievementId: string) {
  await updateDoc(doc(db, 'users', uid, 'achievements', achievementId), { seen: true })
}
