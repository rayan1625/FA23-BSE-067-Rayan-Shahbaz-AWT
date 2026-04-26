'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { SiteHeader, ThemeBar } from '@/components/layouts/site-header'
import { Eye, EyeOff, Check, X, LayoutGrid, User, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'

const USERNAME_RE = /^[a-z0-9_]{3,24}$/

const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number (0-9)', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$...)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    setSupabase(createClient())
  }, [])

  const ruleResults = useMemo(
    () => passwordRules.map((rule) => ({ ...rule, passed: rule.test(password) })),
    [password]
  )
  const allPassed = ruleResults.every((r) => r.passed)
  const passedCount = ruleResults.filter((r) => r.passed).length
  const strengthPercent = (passedCount / ruleResults.length) * 100

  const strengthColor =
    strengthPercent <= 20
      ? 'bg-red-500'
      : strengthPercent <= 60
        ? 'bg-amber-500'
        : strengthPercent < 100
          ? 'bg-cyan-400'
          : 'bg-emerald-500'

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const handle = username.trim().toLowerCase()
    if (!USERNAME_RE.test(handle)) {
      toast.error('Username must be 3–24 characters: lowercase letters, numbers, or underscore.')
      setLoading(false)
      return
    }
    if (!allPassed) {
      toast.error('Please meet all password requirements.')
      setLoading(false)
      return
    }

    const hasKeys =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url_here'

    if (hasKeys) {
      if (!supabase) {
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, username: handle },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      toast.success('Account created! Check your email to verify.')
    } else {
      toast.info('Demo mode — Supabase keys not configured.')
      router.push('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <ThemeBar />
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10">
      {/* Animated Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[140px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-accent/8 blur-[160px]" />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div variants={item} className="mb-8 flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-primary to-accent opacity-25 blur-lg" />
            <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-primary shadow-xl shadow-primary/30">
              <LayoutGrid className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tight text-on-surface">
              Create your account
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Join AdFlow Pro and start listing your ads today
            </p>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div
          variants={item}
          className="rounded-2xl bg-card p-8 shadow-2xl shadow-black/10 backdrop-blur-xl ring-1 ring-border/40"
        >
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Full Name */}
            <motion.div variants={item} className="space-y-2">
              <Label htmlFor="reg-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Full Name
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="reg-name"
                  type="text"
                  placeholder="Rayan Shahbaz"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 bg-muted/20 pl-11 font-medium text-on-surface placeholder:text-muted-foreground/40 focus-visible:ring-primary/50 border-border/40 transition-colors focus-visible:bg-muted/30"
                />
              </div>
            </motion.div>

            {/* Username */}
            <motion.div variants={item} className="space-y-2">
              <Label htmlFor="reg-username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Username
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground/50">@</span>
                <Input
                  id="reg-username"
                  type="text"
                  placeholder="rayan_dev"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="h-12 bg-muted/20 pl-11 font-mono text-sm font-medium text-on-surface placeholder:text-muted-foreground/40 focus-visible:ring-primary/50 border-border/40 transition-colors focus-visible:bg-muted/30"
                  autoComplete="username"
                  maxLength={24}
                />
              </div>
              {username.length > 0 && (
                <p className={`text-xs font-medium ${USERNAME_RE.test(username) ? 'text-emerald-400' : 'text-muted-foreground/60'}`}>
                  {USERNAME_RE.test(username) ? '✓ Username looks good' : '3–24 chars: a-z, 0-9, underscore only'}
                </p>
              )}
            </motion.div>

            {/* Email */}
            <motion.div variants={item} className="space-y-2">
              <Label htmlFor="reg-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-muted/20 pl-11 font-medium text-on-surface placeholder:text-muted-foreground/40 focus-visible:ring-primary/50 border-border/40 transition-colors focus-visible:bg-muted/30"
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={item} className="space-y-2">
              <Label htmlFor="reg-password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-muted/20 pl-11 pr-12 font-medium text-on-surface placeholder:text-muted-foreground/40 focus-visible:ring-primary/50 border-border/40 transition-colors focus-visible:bg-muted/30"
                  placeholder="Min 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground/50 transition-colors hover:text-on-surface"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 pt-2"
                >
                  {/* Strength bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${strengthPercent}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className={`h-full rounded-full transition-colors duration-300 ${strengthColor}`}
                    />
                  </div>

                  {/* Requirements list */}
                  <ul className="space-y-1.5">
                    {ruleResults.map((rule) => (
                      <li key={rule.label} className="flex items-center gap-2.5">
                        <motion.div
                          initial={false}
                          animate={{
                            scale: rule.passed ? [1, 1.3, 1] : 1,
                            backgroundColor: rule.passed
                              ? 'rgb(16 185 129)'   /* emerald-500 */
                              : 'hsl(var(--muted))',
                          }}
                          transition={{ duration: 0.25 }}
                          className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
                        >
                          {rule.passed ? (
                            <Check className="h-3 w-3 text-white" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground/50" />
                          )}
                        </motion.div>
                        <span
                          className={`text-xs font-medium transition-colors ${
                            rule.passed ? 'text-emerald-400' : 'text-muted-foreground/60'
                          }`}
                        >
                          {rule.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </motion.div>

            {/* Submit */}
            <motion.div variants={item} className="pt-2">
              <Button
                type="submit"
                disabled={loading || !allPassed}
                className="relative w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100 group overflow-hidden rounded-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create Account
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>
            </motion.div>
          </form>
        </motion.div>

        {/* Footer link */}
        <motion.p variants={item} className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-bold text-primary transition-colors hover:text-primary/80 hover:underline"
          >
            Sign In
          </Link>
        </motion.p>
      </motion.div>
      </div>
    </div>
  )
}
