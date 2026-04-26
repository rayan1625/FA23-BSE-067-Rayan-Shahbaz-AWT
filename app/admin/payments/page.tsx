'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle2, Search, ExternalLink, AlertCircle, XCircle, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

type PaymentRow = {
  id: string
  amount: number
  status: string
  transaction_ref: string
  created_at: string
  users: { name: string | null; email: string | null } | null
  ads: { id: string; title: string; slug: string } | null
}

export default function PaymentVerificationQueuePage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [paymentToReject, setPaymentToReject] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => { setSupabase(createClient()) }, [])

  const fetchPayments = useCallback(async () => {
    if (!supabase) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id, amount, status, transaction_ref, created_at,
          users(name, email),
          ads(id, title, slug)
        `)
        .eq('status', 'submitted')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayments((data ?? []) as unknown as PaymentRow[])
    } catch (err) {
      console.error('Error fetching payments:', err)
      toast.error('Failed to load pending payments')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const handleAction = async (paymentId: string, action: 'verify' | 'reject') => {
    try {
      setActionLoading(paymentId)
      const res = await fetch(`/api/admin/payments/${paymentId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Failed to ${action} payment`)
      }

      toast.success(`Payment successfully ${action}ed`)
      setPayments((prev) => prev.filter(p => p.id !== paymentId))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setActionLoading(null)
      if (action === 'reject') {
        setRejectDialogOpen(false)
        setPaymentToReject(null)
      }
    }
  }

  const handleRejectClick = (paymentId: string) => {
    setPaymentToReject(paymentId)
    setRejectDialogOpen(true)
  }

  const confirmReject = () => {
    if (paymentToReject) {
      void handleAction(paymentToReject, 'reject')
    }
  }

  const filteredPayments = payments.filter(p =>
    p.transaction_ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.users?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.users?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Payment Verifications</h1>
          <p className="text-muted-foreground text-lg">Manually verify pending payments before ads go live.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search Txn ID or User..." 
            className="pl-11 h-11 bg-muted/30" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-border/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="font-semibold px-6 py-5">Transaction Ref</TableHead>
              <TableHead className="font-semibold">User & Ad Info</TableHead>
              <TableHead className="font-semibold">Amount</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="text-right font-semibold px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No pending payments found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((pay) => (
                <TableRow key={pay.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold px-6 py-4 text-muted-foreground">
                    {pay.transaction_ref || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-foreground/90">{pay.users?.name || pay.users?.email || 'Unknown User'}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1 flex items-center gap-1 font-medium">
                      <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400 px-1.5 py-0.5 rounded mr-1">AD</span> 
                      {pay.ads?.title || 'Unknown Ad'} 
                      {pay.ads?.slug && (
                        <Link href={`/ad/${pay.ads.slug}`} target="_blank">
                          <ExternalLink className="w-3 h-3 text-indigo-500 hover:text-indigo-700 ml-1"/>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-xl text-foreground tracking-tighter">
                    ${Number(pay.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold tracking-widest uppercase text-[10px] bg-muted/50 border-border/80 text-foreground/70 py-1">
                      {new Date(pay.created_at).toLocaleDateString()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-2">
                      <Button 
                        onClick={() => handleAction(pay.id, 'verify')} 
                        disabled={actionLoading === pay.id}
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 font-bold h-10 px-6 transition-all"
                      >
                        {actionLoading === pay.id ? <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" /> : <CheckCircle2 className="h-4.5 w-4.5 mr-2" />} 
                        Verify
                      </Button>
                      <Button 
                        onClick={() => handleRejectClick(pay.id)} 
                        variant="destructive" 
                        disabled={actionLoading === pay.id}
                        className="font-bold h-10 px-6 transition-all"
                      >
                        <XCircle className="h-4.5 w-4.5 mr-2" /> Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px] border-white/10 bg-surface-container">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              Reject Payment
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to reject this payment? The user will be notified and the ad will be marked as rejected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} className="border-white/10" disabled={actionLoading !== null}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmReject}
              disabled={actionLoading !== null}
              className="bg-red-500 hover:bg-red-600"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
