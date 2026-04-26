'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { PieChart, Pie, Cell } from 'recharts'
import { CalendarDays, TrendingUp, Users, ShoppingBag, Loader2, HeartPulse, Activity, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#14b8a6']

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState({
    total_ads: 0,
    active_ads: 0,
    pending_reviews: 0,
    expired_ads: 0,
    approval_rate: 0,
    rejection_rate: 0
  })
  const [revenueData, setRevenueData] = useState<{ name: string; revenue: number }[]>([])
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [healthLogs, setHealthLogs] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      try {
        setLoading(true)

        // 1. Total Ads
        const { count: totalAds } = await supabase.from('ads').select('*', { count: 'exact', head: true })
        
        // Active Ads
        const now = new Date().toISOString()
        const { count: activeAds } = await supabase.from('ads')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published')
          .or(`expires_at.is.null,expires_at.gt.${now}`)
          
        // Pending Reviews
        const { count: pendingReviews } = await supabase.from('ads')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'submitted')

        // Expired Ads
        const { count: expiredAds } = await supabase.from('ads')
          .select('*', { count: 'exact', head: true })
          .or(`status.eq.expired,expires_at.lt.${now}`)

        // 2. Revenue by package
        const { data: payments } = await supabase.from('payments')
          .select('amount, packages(name)')
          .eq('status', 'verified')
        
        const revMap: Record<string, number> = {}
        payments?.forEach(p => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pkgName = (p.packages as any)?.name || 'Unknown'
          revMap[pkgName] = (revMap[pkgName] || 0) + Number(p.amount)
        })
        const formattedRev = Object.keys(revMap).map(k => ({ name: k, revenue: revMap[k] }))

        // 3. Approval / Rejection rates
        const { count: totalSubmitted } = await supabase.from('ad_status_history')
          .select('*', { count: 'exact', head: true })
          .eq('old_status', 'submitted')
          
        const { count: totalApproved } = await supabase.from('ad_status_history')
          .select('*', { count: 'exact', head: true })
          .eq('new_status', 'payment_pending')

        const { count: totalRejected } = await supabase.from('ad_status_history')
          .select('*', { count: 'exact', head: true })
          .eq('new_status', 'rejected')

        let approvalRate = 0
        let rejectionRate = 0
        if (totalSubmitted && totalSubmitted > 0) {
          approvalRate = Math.round(((totalApproved || 0) / totalSubmitted) * 100)
          rejectionRate = Math.round(((totalRejected || 0) / totalSubmitted) * 100)
        }

        // 4. Ads by category
        const { data: adsCats } = await supabase.from('ads').select('categories(name)')
        const catMap: Record<string, number> = {}
        adsCats?.forEach(a => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const catName = (a.categories as any)?.name || 'Uncategorized'
          catMap[catName] = (catMap[catName] || 0) + 1
        })
        const formattedCats = Object.keys(catMap).map(k => ({ name: k, value: catMap[k] }))

        const { data: logs } = await supabase.from('system_health_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)

        setKpis({
          total_ads: totalAds || 0,
          active_ads: activeAds || 0,
          pending_reviews: pendingReviews || 0,
          expired_ads: expiredAds || 0,
          approval_rate: approvalRate,
          rejection_rate: rejectionRate
        })
        setRevenueData(formattedRev)
        setCategoryData(formattedCats)
        setHealthLogs(logs || [])

      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="ml-4 text-xl font-medium text-muted-foreground">Loading Analytics...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Platform Analytics</h1>
        <p className="text-muted-foreground text-lg">Detailed metrics and system overview of AdFlow Pro.</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Ads</CardTitle>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <ShoppingBag className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{kpis.total_ads}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Active Published</CardTitle>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600">{kpis.active_ads}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pending Reviews</CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
              <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-600">{kpis.pending_reviews}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Expired Ads</CardTitle>
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <CalendarDays className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-gray-500">{kpis.expired_ads}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue by Package (Bar Chart) */}
        <Card className="lg:col-span-4 shadow-sm border-border/80">
          <CardHeader>
            <CardTitle>Revenue by Package</CardTitle>
            <CardDescription>Total verified revenue grouped by package tier.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No revenue data found</div>
            )}
          </CardContent>
        </Card>

        {/* Ads by Category (Pie Chart) */}
        <Card className="lg:col-span-3 shadow-sm border-border/80">
          <CardHeader>
            <CardTitle>Ads by Category</CardTitle>
            <CardDescription>Distribution of listings across platform.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex flex-col items-center justify-center">
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {categoryData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center text-xs font-medium">
                      <div className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">No category data</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Moderation Rates */}
        <Card className="shadow-sm border-border/80">
          <CardHeader>
            <CardTitle>Moderation Rates</CardTitle>
            <CardDescription>Historical approval and rejection rates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-emerald-500 h-5 w-5" />
                <span className="font-semibold text-lg">Approval Rate</span>
              </div>
              <span className="text-2xl font-black text-emerald-600">{kpis.approval_rate}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2.5">
              <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${kpis.approval_rate}%` }}></div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center space-x-2">
                <XCircle className="text-red-500 h-5 w-5" />
                <span className="font-semibold text-lg">Rejection Rate</span>
              </div>
              <span className="text-2xl font-black text-red-600">{kpis.rejection_rate}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2.5">
              <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${kpis.rejection_rate}%` }}></div>
            </div>
          </CardContent>
        </Card>

        {/* System Health Snapshot */}
        <Card className="shadow-sm border-border/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Recent cron job and database heartbeats</CardDescription>
            </div>
            <HeartPulse className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            {healthLogs.length > 0 ? (
              <div className="space-y-4">
                {healthLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Activity className={log.status === 'success' ? 'text-emerald-500 h-4 w-4' : 'text-red-500 h-4 w-4'} />
                      <span className="font-medium text-sm">{log.metric_name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-8">No health logs recorded yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
