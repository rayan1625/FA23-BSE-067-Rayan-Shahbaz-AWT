'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, Clock3, MousePointerClick, Wallet2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  fetchAdminDashboardData,
  getStatusLabel,
  getStatusTone,
  type AdminDashboardData,
} from '@/lib/dashboard/data'

const emptyAdminData: AdminDashboardData = {
  totalRevenue: 0,
  totalAds: 0,
  publishedAds: 0,
  pendingReviewAds: 0,
  totalUsers: 0,
  pendingPayments: 0,
  statusBreakdown: [],
  packageBreakdown: [],
  recentPayments: [],
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string | null): string {
  if (!value) return 'No date'
  return new Date(value).toLocaleDateString()
}

export default function AdminPage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [data, setData] = useState<AdminDashboardData>(emptyAdminData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSupabase(createClient())
  }, [])

  useEffect(() => {
    if (!supabase) return
    const loadAdminDashboard = async () => {
      try {
        setLoading(true)
        setError(null)
        const next = await fetchAdminDashboardData(supabase)
        setData(next)
      } catch (loadError) {
        console.error('Error loading admin dashboard:', loadError)
        setError('Unable to load admin control-panel data right now.')
      } finally {
        setLoading(false)
      }
    }

    void loadAdminDashboard()
  }, [supabase])

  const stats = [
    {
      label: 'Verified Revenue',
      value: formatCurrency(data.totalRevenue),
      chip: 'Verified',
      icon: Wallet2,
      note: 'Revenue from verified payment records',
      chipClass: 'bg-emerald-500/15 text-emerald-300',
    },
    {
      label: 'Published Ads',
      value: String(data.publishedAds),
      chip: 'Live',
      icon: MousePointerClick,
      note: `${data.totalAds} total ads across the platform`,
      chipClass: 'bg-primary/15 text-primary',
    },
    {
      label: 'Pending Reviews',
      value: String(data.pendingReviewAds),
      chip: 'Action needed',
      icon: Clock3,
      note: `${data.pendingPayments} payment records still awaiting review`,
      chipClass: 'bg-amber-500/15 text-amber-300',
    },
    {
      label: 'Total Users',
      value: String(data.totalUsers),
      chip: 'Accounts',
      icon: Activity,
      note: 'Marketplace users loaded from Supabase',
      chipClass: 'bg-sky-500/15 text-sky-300',
    },
  ]

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Admin Dashboard</h1>
          <p className="mt-2 text-lg text-slate-300">
            Live platform operations panel for ads, payments, and account activity.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/payments">
            <Button variant="secondary" className="h-12 rounded-2xl border border-white/5 bg-white/10 px-6 text-base font-semibold text-white hover:bg-white/15">
              Review Payments
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button className="h-12 rounded-2xl bg-[#12a4ef] px-6 text-base font-semibold text-white hover:bg-[#0f97dd]">
              Manage Users
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <section key={stat.label} className="af-panel p-7">
            <div className="flex items-start justify-between">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#212956] text-[#9ecbff]">
                <stat.icon className="h-7 w-7" />
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${stat.chipClass}`}>{stat.chip}</span>
            </div>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
            <p className="mt-3 text-4xl font-extrabold tracking-tight text-white">{loading ? '...' : stat.value}</p>
            <p className="mt-4 text-sm text-slate-400">{stat.note}</p>
          </section>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_420px]">
        <section className="af-panel min-h-[420px] p-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">Ad Status Breakdown</h2>
              <p className="mt-2 text-base text-slate-400">Real marketplace counts by status from the `ads` table.</p>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            {data.statusBreakdown.map((item) => (
              <div key={item.status} className="rounded-2xl border border-white/5 bg-[#171f35] p-4">
                <div className="flex items-center justify-between gap-4">
                  <Badge variant="outline" className={getStatusTone(item.status)}>
                    {getStatusLabel(item.status)}
                  </Badge>
                  <span className="text-2xl font-black text-white">{item.count}</span>
                </div>
              </div>
            ))}
            {!loading && data.statusBreakdown.length === 0 && (
              <p className="text-sm text-slate-400">No ad status data is available yet.</p>
            )}
          </div>
        </section>

        <section className="af-panel p-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Package Distribution</h2>
          <p className="mt-2 text-base text-slate-400">Ads grouped by the package linked in your live database.</p>
          <div className="mt-8 space-y-4">
            {data.packageBreakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#171f35] px-4 py-3">
                <span className="text-slate-300">{item.label}</span>
                <span className="font-bold text-white">{item.count}</span>
              </div>
            ))}
            {!loading && data.packageBreakdown.length === 0 && (
              <p className="text-sm text-slate-400">No package-linked ads found yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="af-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 px-8 py-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Recent Payment Verification</h2>
          <Link href="/admin/payments" className="text-base font-semibold text-[#d7dbff] transition hover:text-white">
            Open verification queue
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                <th className="px-8 py-5">Transaction</th>
                <th className="px-8 py-5">User</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Linked Ad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.recentPayments.map((payment) => (
                <tr key={payment.id} className="text-base text-slate-300">
                  <td className="px-8 py-6 font-mono text-xs font-semibold text-white">
                    {payment.transactionRef ?? payment.id}
                    <div className="mt-2 text-[11px] text-slate-500">{formatDate(payment.createdAt)}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-semibold text-white">{payment.userName}</p>
                      <p className="text-sm text-slate-500">{payment.userEmail ?? 'No email available'}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-semibold text-white">{formatCurrency(payment.amount)}</td>
                  <td className="px-8 py-6">
                    <Badge variant="outline" className={getStatusTone(payment.status)}>
                      {getStatusLabel(payment.status)}
                    </Badge>
                  </td>
                  <td className="px-8 py-6">
                    {payment.adTitle && payment.adSlug ? (
                      <Link href={`/ad/${payment.adSlug}`} className="font-semibold text-sky-300 transition hover:text-white">
                        {payment.adTitle}
                      </Link>
                    ) : (
                      <span className="text-slate-500">Not linked</span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && data.recentPayments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-10 text-center text-slate-400">
                    No payment data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="flex flex-col gap-4 border-t border-white/5 px-1 pt-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-2xl font-extrabold uppercase text-white">AdFlow Pro</p>
          <p className="mt-2">Live admin control panel powered by Supabase.</p>
        </div>
        <div className="flex flex-wrap gap-6 text-xs font-semibold uppercase tracking-[0.18em]">
          <span>Total ads: {loading ? '...' : data.totalAds}</span>
          <span>Published: {loading ? '...' : data.publishedAds}</span>
          <span>Pending payments: {loading ? '...' : data.pendingPayments}</span>
        </div>
      </footer>
    </div>
  )
}

