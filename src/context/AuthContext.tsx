import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../firebase/config'
import { createUserProfile, getUserProfile } from '../firebase/firestore'

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid)
        if (!profile) {
          await createUserProfile(firebaseUser.uid, {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName ?? '',
            email: firebaseUser.email ?? '',
            photoURL: firebaseUser.photoURL ?? '',
          })
        }
        setUser(firebaseUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
