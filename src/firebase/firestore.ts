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
import type { UserProfile, Habit, HabitLog, JournalEntry, Achievement, TodoList, TodoItem, QuickNote, NoteColor, FriendRequest, Friendship, PendingInvite } from '../types'
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
  data: Partial<JournalEntry>,
  existingId?: string
): Promise<string> {
  if (existingId) {
    await updateDoc(doc(db, 'users', uid, 'journalEntries', existingId), {
      ...data,
      updatedAt: serverTimestamp(),
    })
    return existingId
  } else {
    // Use date as document ID for reliable upsert without requiring a query index
    const docRef = doc(db, 'users', uid, 'journalEntries', date)
    await setDoc(docRef, {
      ...data,
      date,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return date
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

// ─── Todo Lists ───────────────────────────────────────────────────
export function subscribeTodoLists(uid: string, cb: (lists: TodoList[]) => void) {
  return onSnapshot(collection(db, 'users', uid, 'todoLists'), (snap) => {
    const lists = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as TodoList))
      .filter((l) => !l.archivedAt)
      .sort((a, b) => {
        // Starred first, then by createdAt desc
        if (a.starred && !b.starred) return -1
        if (!a.starred && b.starred) return 1
        const aTime = a.createdAt?.toMillis?.() ?? 0
        const bTime = b.createdAt?.toMillis?.() ?? 0
        return bTime - aTime
      })
    cb(lists)
  })
}

export async function createTodoList(uid: string, name: string): Promise<string> {
  const ref = await addDoc(collection(db, 'users', uid, 'todoLists'), {
    name,
    starred: false,
    archivedAt: null,
    items: [],
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateTodoListItems(uid: string, listId: string, items: TodoItem[]) {
  await updateDoc(doc(db, 'users', uid, 'todoLists', listId), { items })
}

export async function renameTodoList(uid: string, listId: string, name: string) {
  await updateDoc(doc(db, 'users', uid, 'todoLists', listId), { name })
}

export async function starTodoList(uid: string, listId: string, allListIds: string[]) {
  const batch = writeBatch(db)
  for (const id of allListIds) {
    batch.update(doc(db, 'users', uid, 'todoLists', id), { starred: id === listId })
  }
  await batch.commit()
}

export async function unstarTodoList(uid: string, listId: string) {
  await updateDoc(doc(db, 'users', uid, 'todoLists', listId), { starred: false })
}

export async function archiveTodoList(uid: string, listId: string) {
  await updateDoc(doc(db, 'users', uid, 'todoLists', listId), {
    archivedAt: Timestamp.now(),
    starred: false,
  })
}

export async function deleteTodoList(uid: string, listId: string) {
  await deleteDoc(doc(db, 'users', uid, 'todoLists', listId))
}

// ─── Quick Notes ──────────────────────────────────────────────────
export function subscribeQuickNotes(uid: string, cb: (notes: QuickNote[]) => void) {
  return onSnapshot(collection(db, 'users', uid, 'quickNotes'), (snap) => {
    const notes = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as QuickNote))
      .filter((n) => !n.archivedAt)
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        const at = a.updatedAt?.toMillis?.() ?? 0
        const bt = b.updatedAt?.toMillis?.() ?? 0
        return bt - at
      })
    cb(notes)
  })
}

export async function createQuickNote(uid: string, color: NoteColor = 'yellow'): Promise<string> {
  const ref = await addDoc(collection(db, 'users', uid, 'quickNotes'), {
    content: '',
    color,
    pinned: false,
    archivedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function archiveQuickNote(uid: string, noteId: string) {
  await updateDoc(doc(db, 'users', uid, 'quickNotes', noteId), {
    archivedAt: Timestamp.now(),
    pinned: false,
  })
}

export async function updateQuickNote(uid: string, noteId: string, content: string) {
  await updateDoc(doc(db, 'users', uid, 'quickNotes', noteId), {
    content,
    updatedAt: Timestamp.now(),
  })
}

export async function updateQuickNoteColor(uid: string, noteId: string, color: NoteColor) {
  await updateDoc(doc(db, 'users', uid, 'quickNotes', noteId), { color })
}

export async function pinQuickNote(uid: string, noteId: string, allNoteIds: string[]) {
  const batch = writeBatch(db)
  for (const id of allNoteIds) {
    batch.update(doc(db, 'users', uid, 'quickNotes', id), { pinned: id === noteId })
  }
  await batch.commit()
}

export async function unpinQuickNote(uid: string, noteId: string) {
  await updateDoc(doc(db, 'users', uid, 'quickNotes', noteId), { pinned: false })
}

export async function deleteQuickNote(uid: string, noteId: string) {
  await deleteDoc(doc(db, 'users', uid, 'quickNotes', noteId))
}

// ─── Friends ─────────────────────────────────────────────────────

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase().trim()))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as UserProfile
}

export async function sendFriendRequest(
  from: { uid: string; displayName: string; photoURL: string; email: string },
  toEmail: string
): Promise<'sent' | 'invited' | 'already_sent' | 'self'> {
  const normalizedEmail = toEmail.toLowerCase().trim()
  if (normalizedEmail === from.email.toLowerCase()) return 'self'

  // Check for existing outgoing requests to this email
  const existingQ = query(collection(db, 'friendRequests'), where('fromUid', '==', from.uid))
  const existingSnap = await getDocs(existingQ)
  const alreadySent = existingSnap.docs.some(
    (d) => d.data().toEmail === normalizedEmail && d.data().status === 'pending'
  )
  if (alreadySent) return 'already_sent'

  const target = await findUserByEmail(normalizedEmail)

  if (target) {
    await addDoc(collection(db, 'friendRequests'), {
      fromUid: from.uid,
      fromName: from.displayName,
      fromPhoto: from.photoURL,
      toEmail: normalizedEmail,
      toUid: target.uid,
      status: 'pending',
      createdAt: serverTimestamp(),
    })
    return 'sent'
  } else {
    await setDoc(doc(db, 'pendingInvites', normalizedEmail), {
      fromUid: from.uid,
      fromName: from.displayName,
      fromPhoto: from.photoURL,
      toEmail: normalizedEmail,
      createdAt: serverTimestamp(),
    })
    return 'invited'
  }
}

export function subscribeIncomingRequests(uid: string, cb: (requests: FriendRequest[]) => void) {
  const q = query(collection(db, 'friendRequests'), where('toUid', '==', uid))
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as FriendRequest))
        .filter((r) => r.status === 'pending')
    )
  })
}

export function subscribeOutgoingRequests(uid: string, cb: (requests: FriendRequest[]) => void) {
  const q = query(collection(db, 'friendRequests'), where('fromUid', '==', uid))
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as FriendRequest))
        .filter((r) => r.status === 'pending')
    )
  })
}

export async function acceptFriendRequest(
  requestId: string,
  fromUid: string,
  toUid: string
): Promise<void> {
  const friendshipRef = doc(collection(db, 'friendships'))
  const batch = writeBatch(db)
  batch.update(doc(db, 'friendRequests', requestId), { status: 'accepted' })
  batch.set(friendshipRef, { users: [fromUid, toUid], createdAt: serverTimestamp() })
  await batch.commit()
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  await updateDoc(doc(db, 'friendRequests', requestId), { status: 'rejected' })
}

export async function cancelFriendRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(db, 'friendRequests', requestId))
}

export function subscribeFriendships(uid: string, cb: (friendships: Friendship[]) => void) {
  const q = query(collection(db, 'friendships'), where('users', 'array-contains', uid))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Friendship)))
  })
}

export async function getUserProfiles(uids: string[]): Promise<UserProfile[]> {
  if (uids.length === 0) return []
  const profiles = await Promise.all(uids.map((uid) => getUserProfile(uid)))
  return profiles.filter(Boolean) as UserProfile[]
}

export async function removeFriend(friendshipId: string): Promise<void> {
  await deleteDoc(doc(db, 'friendships', friendshipId))
}

// Called from AuthContext when a new user signs up — converts any pending invite into a friendship
export async function checkAndProcessPendingInvite(uid: string, email: string): Promise<void> {
  const inviteRef = doc(db, 'pendingInvites', email.toLowerCase().trim())
  const inviteSnap = await getDoc(inviteRef)
  if (!inviteSnap.exists()) return

  const invite = inviteSnap.data() as PendingInvite
  const friendshipRef = doc(collection(db, 'friendships'))
  const batch = writeBatch(db)
  batch.set(friendshipRef, { users: [invite.fromUid, uid], createdAt: serverTimestamp() })
  batch.delete(inviteRef)
  await batch.commit()
}
