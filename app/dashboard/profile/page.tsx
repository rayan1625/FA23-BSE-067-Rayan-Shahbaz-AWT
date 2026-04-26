'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Phone,
  MapPin,
  ShieldCheck,
  Save,
  Mail,
  AtSign,
  Fingerprint,
  Palette,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/providers/auth-provider'
import { getDisplayName, getUsername } from '@/lib/auth-display'
import { AccentThemeButtons } from '@/components/theme/accent-theme-buttons'

const USERNAME_RE = /^[a-z0-9_]{3,24}$/

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    }
  },
}

export default function ProfilePage() {
  const { user, loading, profile, profileLoading, refreshUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    setSupabase(createClient())
  }, [])

  const displayName = getDisplayName(user, profile)
  const usernameFromAuth = getUsername(user)
  const email = user?.email ?? ''

  const [username, setUsername] = useState(usernameFromAuth)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')

  useEffect(() => {
    if (!user) return
    const meta = user.user_metadata ?? {}
    const full = typeof meta.full_name === 'string' ? meta.full_name : displayName
    const parts = full.trim().split(/\s+/)
    setFirstName(parts[0] ?? '')
    setLastName(parts.slice(1).join(' ') ?? '')
    setUsername(getUsername(user))
    setPhone(typeof meta.phone === 'string' ? meta.phone : '')
    setCity(typeof meta.city === 'string' ? meta.city : '')
  }, [user, displayName])

  const handleSave = async () => {
    if (!user || !supabase) return
    const u = username.trim().toLowerCase()
    if (!USERNAME_RE.test(u)) {
      toast.error('Username: 3–24 chars, lowercase letters, numbers, underscore only.')
      return
    }

    const full = `${firstName.trim()} ${lastName.trim()}`.trim()
    setSaving(true)

    const { error: authErr } = await supabase.auth.updateUser({
      data: {
        full_name: full || displayName,
        username: u,
        phone: phone.trim(),
        city: city.trim(),
      },
    })

    if (authErr) {
      toast.error(authErr.message)
      setSaving(false)
      return
    }

    const { error: dbErr } = await supabase.from('users').update({ name: full || null }).eq('id', user.id)

    if (dbErr) {
      toast.message('Profile saved to your session. Database row not updated (check RLS or migrations).', {
        description: dbErr.message,
      })
    } else {
      toast.success('Profile updated.')
    }

    await refreshUser()
    setSaving(false)
  }

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  const role = profile?.role ?? 'client'
  const verified = Boolean(user?.email_confirmed_at)
  const PROFILE_IMAGE_URL = 'https://raw.githubusercontent.com/Rayan-Shahbaz-Dev/My-projects-picks/refs/heads/main/personalpicks%20(1).png'

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mx-auto max-w-3xl space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight">Profile &amp; control panel</h1>
        <p className="text-lg text-muted-foreground">
          Your account details stay in sync with Supabase Auth in real time. Each user sees their own email and
          username here.
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50" />
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent p-1 shadow-2xl shadow-primary/20 transition-transform hover:scale-105">
              <div className="h-full w-full overflow-hidden rounded-xl bg-[#10172a]">
                <Image
                  src={PROFILE_IMAGE_URL}
                  alt={displayName}
                  width={112}
                  height={112}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="relative min-w-0 flex-1 space-y-1">
              <h2 className="truncate text-3xl font-black tracking-tight">{displayName}</h2>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-medium text-on-surface">
                  <AtSign className="h-3.5 w-3.5" />
                  {username}
                </span>
                <span className="text-white/10">·</span>
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {email || '—'}
                </span>
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge className="border border-primary/30 bg-primary/15 font-bold text-primary">
                  {role.replace(/_/g, ' ')}
                </Badge>
                <Badge
                  variant="secondary"
                  className="gap-1 border-border/50 bg-muted/50 font-bold text-foreground"
                >
                  <ShieldCheck className="h-3 w-3" />
                  {verified ? 'Email verified' : 'Email not verified'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Fingerprint className="h-5 w-5 text-primary" />
              Account control
            </CardTitle>
            <CardDescription>Technical identifiers and sign-in status (read-only).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <div className="rounded-lg border border-border/50 bg-muted/20 p-4 group hover:border-primary/20 transition-colors">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">User ID</p>
              <p className="mt-1 break-all font-mono text-xs text-on-surface">{user?.id ?? '—'}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/50 bg-muted/20 p-4 group hover:border-primary/20 transition-colors">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last sign-in</p>
                <p className="mt-1 text-sm font-medium text-on-surface">
                  {user?.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString()
                    : '—'}
                </p>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.03] p-4 group hover:border-primary/20 transition-colors">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Auth email</p>
                <p className="mt-1 truncate text-sm font-medium text-on-surface">{email || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-white/5 shadow-sm bg-white/[0.02] backdrop-blur-sm">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Palette className="h-5 w-5 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>Accent color for the entire app (saved in this browser).</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <AccentThemeButtons size="compact" />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-white/5 shadow-sm bg-white/[0.02] backdrop-blur-sm">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <User className="h-5 w-5 text-primary" />
              Public profile
            </CardTitle>
            <CardDescription>
              Username and name are stored in your auth profile and mirrored to the public.users table when RLS allows it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-6">
            <div className="space-y-2">
              <Label className="font-semibold">Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="h-11 border-border/50 bg-muted/20 font-mono text-sm font-medium focus:ring-primary/40"
                placeholder="your_handle"
                autoComplete="username"
              />
              <p className="text-xs text-muted-foreground">3–24 characters: a–z, 0–9, underscore. Shown as @{username || 'handle'}.</p>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="font-semibold">First name</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-11 border-border/50 bg-muted/20 font-medium focus:ring-primary/40"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Last name</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-11 border-white/5 bg-white/[0.03] font-medium focus:ring-primary/40"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-semibold">
                <Phone className="h-4 w-4" /> Phone
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 border-white/5 bg-white/[0.03] font-medium focus:ring-primary/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4" /> City
              </Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11 border-white/5 bg-white/[0.03] font-medium focus:ring-primary/40"
              />
            </div>
            <Separator className="my-2 bg-border/50" />
            <div className="flex justify-end">
              <Button
                className="h-11 gap-2 px-8 font-bold shadow-lg shadow-primary/25 hover:opacity-90 transition-all active:scale-95"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
