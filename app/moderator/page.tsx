'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, CreditCard, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  fetchModeratorDashboardData,
  getStatusLabel,
  getStatusTone,
  type ModeratorDashboardData,
} from '@/lib/dashboard/data'

const emptyModeratorData: ModeratorDashboardData = {
  queueSize: 0,
  underReviewCount: 0,
  rejectedCount: 0,
  readyForPaymentCount: 0,
  recentActivity: [],
}

function formatRelativeTime(value: string | null): string {
  if (!value) return 'Just now'
  const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hr ago`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

export default function ModeratorPage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [data, setData] = useState<ModeratorDashboardData>(emptyModeratorData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSupabase(createClient())
  }, [])

  useEffect(() => {
    if (!supabase) return
    const loadModeratorDashboard = async () => {
      try {
        setLoading(true)
        setError(null)
        const next = await fetchModeratorDashboardData(supabase)
        setData(next)
      } catch (loadError) {
        console.error('Error loading moderator dashboard:', loadError)
        setError('Unable to load moderation dashboard right now.')
      } finally {
        setLoading(false)
      }
    }

    void loadModeratorDashboard()
  }, [supabase])

  const stats = [
    { label: 'Pending Review', value: data.queueSize, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
    { label: 'Under Review', value: data.underReviewCount, icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
    { label: 'Rejected', value: data.rejectedCount, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/30' },
    { label: 'Ready For Payment', value: data.readyForPaymentCount, icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Moderator Dashboard</h1>
          <p className="text-muted-foreground text-lg">Review live marketplace ads currently waiting in the moderation workflow.</p>
        </div>
        <Link href="/moderator/queue">
          <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold shadow-md shadow-indigo-500/20 h-11 px-6">
            Open Review Queue
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">{stat.label}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">{loading ? '...' : stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">Recent Moderation Activity</CardTitle>
          <Link href="/moderator/queue" className="text-sm font-semibold text-primary hover:underline">
            View queue
          </Link>
        </CardHeader>
        <CardContent className="divide-y divide-border/60">
          {data.recentActivity.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Badge className={getStatusTone(item.status)}>
                  {getStatusLabel(item.status)}
                </Badge>
                <span className="font-medium text-foreground/80">{item.title}</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">{formatRelativeTime(item.createdAt)}</span>
            </div>
          ))}
          {!loading && data.recentActivity.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No moderation activity found yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
