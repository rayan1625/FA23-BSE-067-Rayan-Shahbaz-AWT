'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { SiteHeader, ThemeBar } from '@/components/layouts/site-header'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    setSupabase(createClient())
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // For local testing without a real Supabase connection, we bypass the DB call
    // If you have added your Supabase keys in .env.local, you can uncomment the auth call below
    
    const hasKeys = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url_here'

    if (hasKeys) {
      if (!supabase) {
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
    } else {
      // Mock login for UI testing
      toast.info('Using Mock Auth because Supabase keys are not set.')
    }

    toast.success('Login successful!')
    router.push('/dashboard')
    router.refresh()
  }

  const handleSignUp = async () => {
    setLoading(true)
    
    const hasKeys = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url_here'

    if (hasKeys) {
      if (!supabase) {
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })
      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
    }
    
    toast.success('Registration successful! Check your email to verify.')
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <ThemeBar />
      <div className="flex flex-1 items-center justify-center bg-muted/10 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/80">
        <CardHeader className="space-y-3 px-8 pt-8 text-center pb-6">
          <CardTitle className="text-3xl font-black tracking-tight text-indigo-950 dark:text-indigo-100">Welcome Back</CardTitle>
          <CardDescription className="text-base text-muted-foreground font-medium">
            Sign in to your AdFlow Pro account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5 px-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-muted/20 font-medium"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-semibold">Password</Label>
                <Link href="#" className="text-sm font-bold text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-muted/20"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 px-8 pb-8 pt-4">
            <Button type="submit" className="w-full h-12 text-base font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="relative w-full text-center text-sm font-medium after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border mt-2 mb-2">
              <span className="relative z-10 bg-card px-3 text-muted-foreground">
                Or continue with
              </span>
            </div>
            <Button type="button" variant="outline" className="w-full h-12 text-base font-bold border-border/80 bg-muted/10" onClick={handleSignUp} disabled={loading}>
              Create an account
            </Button>
            
            <p className="text-xs text-center text-muted-foreground/80 mt-2 font-medium">
              You can test the UI securely using any dummy email and password if your Supabase database is not configured yet.
            </p>
          </CardFooter>
        </form>
      </Card>
      </div>
    </div>
  )
}
