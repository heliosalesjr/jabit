import {
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth } from './config'

const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

export async function signOut() {
  await firebaseSignOut(auth)
}

// Requests Google Calendar scope via re-authentication popup.
// Returns the OAuth access token (valid ~1h) or null if denied/cancelled.
export async function connectGoogleCalendar(user: User): Promise<{ token: string; expiresIn: number } | null> {
  const provider = new GoogleAuthProvider()
  provider.addScope('https://www.googleapis.com/auth/calendar.events')
  provider.setCustomParameters({ prompt: 'consent' })

  try {
    const result = await reauthenticateWithPopup(user, provider)
    const credential = GoogleAuthProvider.credentialFromResult(result)
    const token = credential?.accessToken
    if (!token) return null
    return { token, expiresIn: 3600 }
  } catch {
    return null
  }
}
