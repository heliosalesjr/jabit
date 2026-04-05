import { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { connectGoogleCalendar } from '../firebase/auth'
import {
  saveCalendarToken,
  clearCalendarToken,
  getCalendarToken,
  isCalendarConnected,
} from '../lib/googleCalendar'

export function useGoogleCalendar() {
  const { user } = useAuth()
  const [connected, setConnected] = useState(() => isCalendarConnected())
  const [connecting, setConnecting] = useState(false)

  const connect = useCallback(async (): Promise<boolean> => {
    if (!user) return false
    setConnecting(true)
    try {
      const result = await connectGoogleCalendar(user)
      if (result) {
        saveCalendarToken(result.token, result.expiresIn)
        setConnected(true)
        return true
      }
    } catch {
      // popup closed or permission denied — silent fail
    } finally {
      setConnecting(false)
    }
    return false
  }, [user])

  const disconnect = useCallback(() => {
    clearCalendarToken()
    setConnected(false)
  }, [])

  // Returns a valid token or null (and marks as disconnected if expired)
  const getToken = useCallback((): string | null => {
    const token = getCalendarToken()
    if (!token) setConnected(false)
    return token
  }, [])

  return { connected, connecting, connect, disconnect, getToken }
}
