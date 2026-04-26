'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { CreditCard, Lock, ShieldCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

function PaymentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const adId = searchParams.get('ad_id')
  
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ad, setAd] = useState<any>(null)

  // Payment form state
  const [cardName, setCardName] = useState('')

  useEffect(() => { setSupabase(createClient()) }, [])

  useEffect(() => {
    if (!supabase || !adId) {
      if (!adId) {
        toast.error('No ad specified for payment.')
        router.push('/dashboard/ads')
      }
      return
    }

    const fetchAd = async () => {
      try {
        const { data, error } = await supabase
          .from('ads')
          .select('id, title, status, packages(name, price, duration_days, is_featured)')
          .eq('id', adId)
          .single()

        if (error || !data) throw new Error('Ad not found')
        if (data.status !== 'payment_pending') {
          toast.error('This ad is not pending payment.')
          router.push('/dashboard/ads')
          return
        }

        setAd(data)
      } catch {
        toast.error('Failed to load ad details.')
        router.push('/dashboard/ads')
      } finally {
        setLoading(false)
      }
    }
    void fetchAd()
  }, [supabase, adId, router])

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ad) return
    setIsProcessing(true)
    
    try {
      // Mocking transaction ref for demo
      const transaction_ref = `txn_${Math.random().toString(36).substring(2, 10)}`

      const res = await fetch('/api/client/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad_id: ad.id,
          amount: ad.packages?.price || 0,
          method: 'Credit Card',
          transaction_ref,
          sender_name: cardName,
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Payment submission failed')
      }

      toast.success('Payment successful! Your ad is now pending verification.')
      router.push('/dashboard/payments')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred during payment.')
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!ad) return null

  const pkgName = ad.packages?.name || 'Standard'
  const price = ad.packages?.price || 0
  const duration = ad.packages?.duration_days || 0
  const isFeatured = ad.packages?.is_featured || false

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Complete Payment</h1>
        <p className="text-muted-foreground text-lg">Enter your payment details for: <span className="font-semibold text-foreground">{ad.title}</span></p>
      </div>

      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="flex-1 h-2.5 rounded-full shadow-inner bg-indigo-600" />
        <div className="flex-1 h-2.5 rounded-full shadow-inner bg-indigo-600" />
        <div className="flex-1 h-2.5 rounded-full shadow-inner bg-gradient-to-r from-indigo-500 to-purple-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <form onSubmit={handlePayment}>
            <Card className="border-border/80 shadow-md">
              <CardHeader className="bg-muted/10 border-b border-border/40 pb-6 mb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-500" /> Payment Details
                </CardTitle>
                <CardDescription>All transactions are secure and encrypted.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-6">
                <div className="space-y-3">
                  <Label className="font-semibold text-foreground/80">Cardholder Name</Label>
                  <Input 
                    required 
                    placeholder="Jane Doe" 
                    className="h-12 bg-muted/20 font-medium text-base" 
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label className="font-semibold text-foreground/80">Card Number (Demo)</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                    <Input required placeholder="0000 0000 0000 0000" className="pl-12 h-12 bg-muted/20 font-medium text-base font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="font-semibold text-foreground/80">Expiration Date</Label>
                    <Input required placeholder="MM/YY" className="h-12 bg-muted/20 font-medium text-base font-mono" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-semibold text-foreground/80">CVC</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                      <Input required type="password" placeholder="123" maxLength={4} className="pl-12 h-12 bg-muted/20 font-medium text-base font-mono tracking-widest" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-6 pb-6 px-6 mt-4 bg-muted/5 border-t border-border/40 flex justify-end gap-4">
                <Button type="button" variant="ghost" className="h-12 px-6 font-medium" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 h-12 px-10 font-bold shadow-md shadow-indigo-500/20" disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  {isProcessing ? 'Processing securely...' : `Pay $${price} & Submit Ad`}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

        <div>
          <Card className="border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm sticky top-24 overflow-hidden rounded-xl">
            <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm font-medium px-6">
              <div className="flex justify-between items-center text-base">
                <span className="text-foreground/80">{pkgName} Package</span>
                <span className="font-bold">${price}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Duration</span>
                <span>{duration} Days</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Featured Badge</span>
                {isFeatured ? (
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Included</span>
                ) : (
                  <span>No</span>
                )}
              </div>
              <div className="pt-4 border-t border-indigo-200 dark:border-indigo-800 flex justify-between font-extrabold text-xl lg:text-2xl mt-4">
                <span>Total</span>
                <span className="text-indigo-600 dark:text-indigo-400">${price}</span>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-center justify-center pt-4 pb-8 text-center space-y-3 bg-muted/10 mt-2">
              <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-full">
                <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xs text-muted-foreground font-semibold">Guaranteed Safe & Secure Checkout</p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <PaymentForm />
    </Suspense>
  )
}
