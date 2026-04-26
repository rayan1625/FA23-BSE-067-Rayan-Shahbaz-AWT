'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, SupabaseClient } from '@supabase/supabase-js'
import type { DbUserRow } from '@/lib/auth-display'

type AuthContextType = {
  user: User | null
  loading: boolean
  profile: DbUserRow | null
  profileLoading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<DbUserRow | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    setSupabase(createClient())
  }, [])

  const loadProfile = useCallback(
    async (userId: string) => {
      if (!supabase) return
      setProfileLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('role, name, avatar_url')
        .eq('id', userId)
        .maybeSingle()

      if (error || !data) {
        setProfile(null)
      } else {
        setProfile({
          role: data.role ?? 'client',
          name: data.name,
          avatar_url: data.avatar_url,
        })
      }
      setProfileLoading(false)
    },
    [supabase]
  )

  const refreshUser = useCallback(async () => {
    if (!supabase) return
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const next = session?.user ?? null
    setUser(next)
    if (next) await loadProfile(next.id)
    else setProfile(null)
  }, [supabase, loadProfile])

  useEffect(() => {
    if (!supabase) return
    let cancelled = false

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return
      const next = session?.user ?? null
      setUser(next)
      if (next) await loadProfile(next.id)
      setLoading(false)
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null
      setUser(next)
      if (next) void loadProfile(next.id)
      else setProfile(null)
      setLoading(false)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [supabase, loadProfile])

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setProfile(null)
    window.location.href = '/auth/login'
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        profile,
        profileLoading,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
