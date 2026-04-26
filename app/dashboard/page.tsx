'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bot, CalendarX2, CheckCircle2, Clock3, Layers3, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  fetchAdvertiserDashboardData,
  getStatusLabel,
  getStatusTone,
  type AdvertiserDashboardData,
} from '@/lib/dashboard/data'
import { useAuth } from '@/components/providers/auth-provider'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 110,
      damping: 16,
    },
  },
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return 'Not set'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(value: string | null): string {
  if (!value) return 'Not scheduled'
  return new Date(value).toLocaleDateString()
}

function formatRelativeTime(value: string | null): string {
  if (!value) return 'Just now'
  const now = Date.now()
  const then = new Date(value).getTime()
  const diffMinutes = Math.max(1, Math.round((now - then) / 60000))

  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hr ago`

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

const emptyDashboard: AdvertiserDashboardData = {
  totalAds: 0,
  publishedAds: 0,
  pendingAds: 0,
  expiredAds: 0,
  featuredAds: 0,
  aiGeneratedAds: 0,
  recentAds: [],
  recentActivity: [],
}

export default function DashboardOverview() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const { user } = useAuth()
  const [data, setData] = useState<AdvertiserDashboardData>(emptyDashboard)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSupabase(createClient())
  }, [])

  useEffect(() => {
    if (!user?.id || !supabase) {
      setLoading(false)
      return
    }

    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError(null)
        const next = await fetchAdvertiserDashboardData(supabase, user.id)
        setData(next)
      } catch (loadError) {
        console.error('Error loading advertiser dashboard:', loadError)
        setError('Unable to load live dashboard data right now.')
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [supabase, user?.id])

  const stats = [
    {
      label: 'Total Ads',
      value: data.totalAds,
      icon: Layers3,
      tone: 'bg-primary text-primary-foreground',
      border: 'border-primary/20',
    },
    {
      label: 'Published',
      value: data.publishedAds,
      icon: CheckCircle2,
      tone: 'bg-emerald-600 text-white',
      border: 'border-emerald-600/20',
    },
    {
      label: 'Pending Pipeline',
      value: data.pendingAds,
      icon: Clock3,
      tone: 'bg-amber-100 text-amber-900 dark:bg-amber-500 dark:text-amber-950',
      border: 'border-amber-200 dark:border-amber-500/20',
    },
    {
      label: 'Expired',
      value: data.expiredAds,
      icon: CalendarX2,
      tone: 'bg-red-600 text-white',
      border: 'border-red-600/20',
    },
  ]

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 lg:space-y-8"
    >
      <motion.div variants={itemVariants} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Project Control Panel</h1>
          <p className="mt-2 text-muted-foreground">
            Real-time project stats from your live ads, AI content, and workflow pipeline.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/ads">
            <Button variant="outline" className="rounded-xl border-border/50">
              Manage Ads
            </Button>
          </Link>
          <Link href="/dashboard/create">
            <Button className="rounded-xl">Create New Ad</Button>
          </Link>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </motion.div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <motion.div variants={containerVariants} className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ scale: 1.01, y: -4 }}
                className={`af-panel border ${stat.border} p-6`}
              >
                <div className="flex items-start justify-between">
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl ${stat.tone}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="border-border/40 bg-background/50">
                    Live
                  </Badge>
                </div>
                <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-2 text-4xl font-extrabold tracking-tight text-foreground">
                  {loading ? '...' : stat.value}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.section variants={itemVariants} className="af-panel overflow-hidden border-border/10">
            <div className="flex flex-col gap-3 border-b border-border/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Recent Project Ads</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Latest records from your real ads table.
                </p>
              </div>
              <Link href="/dashboard/ads">
                <Button variant="outline" className="rounded-xl border-border/50">
                  View All Ads
                </Button>
              </Link>
            </div>

            <div className="divide-y divide-border/10">
              {data.recentAds.map((ad) => (
                <div
                  key={ad.id}
                  className="grid gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1.8fr)_1fr_1fr_auto] lg:items-center"
                >
                  <div className="min-w-0">
                    <Link href={`/ad/${ad.slug}`} className="text-lg font-bold text-foreground transition hover:text-primary">
                      {ad.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ad.categoryName ?? 'Uncategorized'}
                      {ad.packageName ? ` • ${ad.packageName}` : ''}
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline" className={getStatusTone(ad.status)}>
                      {getStatusLabel(ad.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{formatCurrency(ad.price)}</p>
                    <p className="mt-1">{formatDate(ad.expiresAt)}</p>
                  </div>
                  <div className="text-right text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {ad.isFeatured ? 'Featured' : 'Standard'}
                  </div>
                </div>
              ))}

              {!loading && data.recentAds.length === 0 && (
                <div className="px-6 py-10 text-center text-muted-foreground">
                  No project ads found yet. Create your first ad to populate the control panel.
                </div>
              )}
            </div>
          </motion.section>
        </div>

        <aside className="space-y-6">
          <motion.section variants={itemVariants} className="af-panel p-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Recent Activity</h2>
            <div className="mt-6 space-y-5">
              {data.recentActivity.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}

              {!loading && data.recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground">Your project activity will appear here once ads start moving through the pipeline.</p>
              )}
            </div>
          </motion.section>

          <motion.section variants={itemVariants}>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/15 to-accent/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-extrabold">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Automation Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-background/40 px-4 py-3">
                  <span>Featured ads</span>
                  <span className="font-bold text-foreground">{loading ? '...' : data.featuredAds}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/40 px-4 py-3">
                  <span>AI-generated ads</span>
                  <span className="font-bold text-foreground">{loading ? '...' : data.aiGeneratedAds}</span>
                </div>
                <Link href="/dashboard/ai-generator">
                  <Button variant="outline" className="w-full rounded-xl border-border/50">
                    <Bot className="mr-2 h-4 w-4" />
                    Open AI Generator
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.section>
        </aside>
      </div>
    </motion.div>
  )
}


