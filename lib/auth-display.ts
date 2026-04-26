import type { User } from '@supabase/supabase-js'

export type DbUserRow = {
  role: string
  name: string | null
  avatar_url: string | null
}

export function getUsername(user: User | null): string {
  if (!user) return 'guest'
  const raw = user.user_metadata?.username
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim()
  const email = user.email
  if (email?.includes('@')) return email.split('@')[0] ?? 'user'
  return 'user'
}

export function getDisplayName(user: User | null, profile: DbUserRow | null): string {
  if (profile?.name?.trim()) return profile.name.trim()
  const meta = user?.user_metadata?.full_name
  if (typeof meta === 'string' && meta.trim().length > 0) return meta.trim()
  return getUsername(user)
}

export function getRoleLabel(role: string | undefined): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin'
    case 'admin':
      return 'Admin'
    case 'moderator':
      return 'Moderator'
    default:
      return 'Advertiser'
  }
}
