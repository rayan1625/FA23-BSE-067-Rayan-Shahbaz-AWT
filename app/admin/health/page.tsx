'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { HeartPulse, Activity, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type HealthLog = {
  id: string
  metric_name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metric_value: any
  status: string
  created_at: string
}

export default function SystemHealthPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<HealthLog[]>([])
  const [stats, setStats] = useState({
    successCount: 0,
    failCount: 0,
    lastHeartbeat: null as string | null
  })

  useEffect(() => {
    const fetchHealthLogs = async () => {
      const supabase = createClient()
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('system_health_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) throw error

        const typedLogs = (data || []) as HealthLog[]
        setLogs(typedLogs)

        const successes = typedLogs.filter(l => l.status === 'success').length
        const failures = typedLogs.filter(l => l.status === 'failed').length
        const hb = typedLogs.find(l => l.metric_name === 'cron-heartbeat')

        setStats({
          successCount: successes,
          failCount: failures,
          lastHeartbeat: hb ? hb.created_at : null
        })

      } catch (error) {
        console.error('Error fetching health logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHealthLogs()
  }, [])

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">System Health</h1>
          <p className="text-muted-foreground text-lg">Monitor database availability and automated cron job executions.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Successful Executions</CardTitle>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600">{stats.successCount}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Failed Executions</CardTitle>
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-red-600">{stats.failCount}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Last Heartbeat</CardTitle>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <HeartPulse className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold mt-2">
              {stats.lastHeartbeat ? new Date(stats.lastHeartbeat).toLocaleString() : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border/80 overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-500" />
            Recent System Logs
          </CardTitle>
          <CardDescription>The last 100 system events recorded by automated services.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="px-6 py-4">Event Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Latency / Details</TableHead>
                <TableHead className="text-right px-6">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No system logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/30">
                    <TableCell className="px-6 py-4 font-semibold text-foreground/80">
                      {log.metric_name}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={log.status === 'success' ? 'default' : 'destructive'} 
                        className={log.status === 'success' ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20' : ''}
                      >
                        {log.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.metric_value?.response_ms ? `${log.metric_value.response_ms}ms` : JSON.stringify(log.metric_value)}
                    </TableCell>
                    <TableCell className="text-right px-6 text-sm text-muted-foreground flex items-center justify-end gap-1.5">
                      <Clock className="h-3 w-3" />
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
