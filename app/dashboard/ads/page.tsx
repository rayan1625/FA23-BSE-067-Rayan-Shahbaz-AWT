'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PlusCircle, ExternalLink, Edit, Trash2, AlertCircle, Send, Loader2, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 }
  },
}

type AdRow = {
  id: string
  user_id: string
  title: string
  slug: string
  category_id: string | null
  price: number | string | null
  status: string
  is_featured: boolean | null
  image_urls?: string[] | null
}

export default function MyAdsPage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [ads, setAds] = useState<AdRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [adToDelete, setAdToDelete] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, totalAmount: 0 })

  useEffect(() => { setSupabase(createClient()) }, [])

  const fetchAds = useCallback(async () => {
    if (!supabase) return
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const allAds = (data as AdRow[]) || []
      setAds(allAds)

      const total = allAds.length
      const pending = allAds.filter(ad => ad.status === 'under_review' || ad.status === 'submitted' || ad.status === 'payment_pending').length
      const approved = allAds.filter(ad => ad.status === 'published' || ad.status === 'scheduled').length
      const totalAmount = allAds.reduce((sum, ad) => {
        const price = typeof ad.price === 'number' ? ad.price : parseFloat(ad.price?.toString() || '0')
        return sum + (isNaN(price) ? 0 : price)
      }, 0)

      setStats({ total, pending, approved, totalAmount })
    } catch (error) {
      console.error('Error fetching ads:', error)
      toast.error('Failed to load ads')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchAds() }, [fetchAds])

  useEffect(() => {
    const handleFocus = () => { if (supabase) fetchAds() }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [supabase, fetchAds])

  const handleDelete = (adId: string) => {
    setAdToDelete(adId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (adToDelete && supabase) {
      try {
        setActionLoading('delete')
        const { error } = await supabase.from('ads').delete().eq('id', adToDelete)
        if (error) throw error
        setAds(ads.filter(ad => ad.id !== adToDelete))
        toast.success('Ad deleted successfully')
        setDeleteDialogOpen(false)
        setAdToDelete(null)
      } catch {
        toast.error('Failed to delete ad')
      } finally {
        setActionLoading(null)
      }
    }
  }

  const handleSubmitReview = async (adId: string) => {
    try {
      setActionLoading(adId)
      const res = await fetch(`/api/ads/${adId}/submit`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit ad')
      }
      toast.success('Ad submitted for review')
      fetchAds()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error submitting ad')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">My Ads</h1>
          <p className="text-muted-foreground text-lg">Manage your classified advertisements ({stats.total} total)</p>
        </div>
        <Link href="/dashboard/create">
          <Button size="lg" className="btn-primary shadow-lg shadow-primary/25 transition-all">
            <PlusCircle className="mr-2 h-5 w-5" /> Create Ad
          </Button>
        </Link>
      </motion.div>

      <motion.div variants={containerVariants} className="grid gap-4 md:grid-cols-4">
        <motion.div variants={itemVariants} className="af-panel p-6 border border-primary/20">
          <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Ads</div>
          <div className="text-3xl font-extrabold text-foreground mt-2">{stats.total}</div>
        </motion.div>
        <motion.div variants={itemVariants} className="af-panel p-6 border border-emerald-600/20">
          <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Approved</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">{stats.approved}</div>
        </motion.div>
        <motion.div variants={itemVariants} className="af-panel p-6 border border-amber-600/20">
          <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pending</div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">{stats.pending}</div>
        </motion.div>
        <motion.div variants={itemVariants} className="af-panel p-6 border border-indigo-600/20">
          <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Value</div>
          <div className="text-3xl font-extrabold text-indigo-600 mt-2">${stats.totalAmount.toLocaleString()}</div>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ads.map((ad) => (
              <motion.div key={ad.id} whileHover={{ scale: 1.02 }} className="af-panel overflow-hidden group">
                <div className="aspect-video bg-muted/30 relative overflow-hidden flex items-center justify-center">
                  <span className="text-4xl font-black text-muted-foreground/30">AD</span>
                  {ad.is_featured && <Badge className="absolute top-3 right-3 bg-[hsl(var(--warning))] text-white font-bold">Featured</Badge>}
                </div>
                
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground line-clamp-1">{ad.title}</h3>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-foreground">
                      {ad.price ? `$${Number(ad.price).toLocaleString()}` : 'N/A'}
                    </span>
                    <Badge variant={ad.status === 'published' ? 'default' : 'secondary'} className="uppercase">
                      {ad.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  {ad.status === 'draft' && (
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
                      onClick={() => handleSubmitReview(ad.id)}
                      disabled={actionLoading === ad.id}
                    >
                      {actionLoading === ad.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                      Submit for Review
                    </Button>
                  )}

                  {ad.status === 'payment_pending' && (
                    <Link href={`/dashboard/create/payment?ad_id=${ad.id}`}>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay to Publish
                      </Button>
                    </Link>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={ad.status !== 'draft'}
                      onClick={() => toast.info(`Edit not implemented yet`)}
                      className="flex-1 border-border/50 hover:bg-muted"
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Link href={`/ad/${ad.slug}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full border-border/50 hover:bg-muted">
                        <ExternalLink className="h-4 w-4 mr-1" /> View
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(ad.id)}
                      className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {ads.length === 0 && (
              <div className="col-span-full">
                <Card className="p-12 text-center border-border/10">
                  <p className="text-muted-foreground font-medium">
                    You haven&apos;t posted any ads yet. <Link href="/dashboard/create" className="text-primary hover:underline">Create your first ad</Link>
                  </p>
                </Card>
              </div>
            )}
          </div>
        )}
      </motion.div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] border-border/10 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[hsl(var(--danger))]">
              <AlertCircle className="h-5 w-5" />
              Delete Ad
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete this ad? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={actionLoading === 'delete'}>
              {actionLoading === 'delete' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Ad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
