'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'
import { CreditCard, CheckCircle2, Clock, XCircle, Download, Loader2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

const statusConfig: Record<string, { label: string; className: string; icon: LucideIcon }> = {
  verified: { label: 'Verified', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: Clock },
  submitted: { label: 'Pending', className: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: Clock },
  rejected: { label: 'Rejected', className: 'bg-red-500/15 text-red-400 border-red-500/20', icon: XCircle },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } },
}

type PaymentRow = {
  id: string
  amount: number
  status: string
  transaction_ref: string
  created_at: string
  packages: { name: string } | null
  ads: { title: string } | null
}

export default function PaymentsPage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { setSupabase(createClient()) }, [])

  const fetchPayments = useCallback(async () => {
    if (!supabase) return
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('payments')
        .select(`
          id, amount, status, transaction_ref, created_at,
          packages(name),
          ads(title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayments((data ?? []) as unknown as PaymentRow[])
    } catch (err) {
      console.error('Error fetching payments:', err)
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const totalSpent = payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + Number(p.amount), 0)
  const verifiedCount = payments.filter(p => p.status === 'verified').length
  const pendingCount = payments.filter(p => p.status === 'pending' || p.status === 'submitted').length

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">My Payments</h1>
          <p className="text-muted-foreground text-lg">Track all your ad spend and payment history.</p>
        </div>
        <Button variant="outline" className="font-bold gap-2 h-11 border-white/10 bg-white/5 hover:bg-white/10 transition-all">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </motion.div>

      <motion.div variants={containerVariants} className="grid gap-5 md:grid-cols-3">
        <motion.div variants={itemVariants}>
          <Card className="border-white/5 shadow-sm bg-white/[0.02] backdrop-blur-sm hover:border-primary/20 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Spent (Verified)</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg"><CreditCard className="h-4 w-4 text-primary" /></div>
            </CardHeader>
            <CardContent><div className="text-3xl font-extrabold text-white">${totalSpent.toFixed(2)}</div></CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="border-white/5 shadow-sm bg-white/[0.02] backdrop-blur-sm hover:border-emerald-500/20 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Verified</CardTitle>
              <div className="p-2 bg-emerald-500/10 rounded-lg"><CheckCircle2 className="h-4 w-4 text-emerald-400" /></div>
            </CardHeader>
            <CardContent><div className="text-3xl font-extrabold text-white">{verifiedCount}</div></CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="border-white/5 shadow-sm bg-white/[0.02] backdrop-blur-sm hover:border-amber-500/20 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Pending</CardTitle>
              <div className="p-2 bg-amber-500/10 rounded-lg"><Clock className="h-4 w-4 text-amber-400" /></div>
            </CardHeader>
            <CardContent><div className="text-3xl font-extrabold text-white">{pendingCount}</div></CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-white/5 shadow-sm overflow-hidden bg-white/[0.02] backdrop-blur-sm">
          <Table>
            <TableHeader className="bg-white/[0.03]">
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="font-semibold px-6 py-5 text-white">Transaction Ref</TableHead>
                <TableHead className="font-semibold text-white">Ad Listing</TableHead>
                <TableHead className="font-semibold text-white">Package</TableHead>
                <TableHead className="font-semibold text-white">Date</TableHead>
                <TableHead className="font-semibold text-white">Amount</TableHead>
                <TableHead className="font-semibold text-white">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    You haven&apos;t made any payments yet.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => {
                  const s = statusConfig[p.status] || statusConfig.pending
                  const Icon = s.icon
                  return (
                    <TableRow key={p.id} className="hover:bg-white/[0.03] transition-colors border-white/5">
                      <TableCell className="font-mono text-xs text-white/40 px-6 py-4 font-semibold">{p.transaction_ref || 'N/A'}</TableCell>
                      <TableCell className="font-bold text-white max-w-[200px]"><div className="line-clamp-1">{p.ads?.title || 'Unknown'}</div></TableCell>
                      <TableCell className="font-bold text-primary">{p.packages?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-muted-foreground font-medium">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-black text-lg text-white">${Number(p.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={`${s.className} font-bold flex items-center gap-1.5 w-fit border shadow-none text-xs`}>
                          <Icon className="w-3.5 h-3.5" /> {s.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>
    </motion.div>
  )
}
