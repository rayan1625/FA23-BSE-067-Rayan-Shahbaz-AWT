import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit, logStatusHistory } from '@/lib/audit'
import { calculateRankScore } from '@/lib/ranking-system'
import { z } from 'zod'

const scheduleSchema = z.object({
  schedule_action: z.enum(['schedule', 'publish_now']),
  publish_at: z.string().optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check role
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = scheduleSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { schedule_action, publish_at } = parsed.data

    if (schedule_action === 'schedule' && !publish_at) {
      return NextResponse.json({ error: 'publish_at required for schedule action' }, { status: 400 })
    }

    // Get ad
    const { data: ad, error: fetchErr } = await supabase
      .from('ads')
      .select('*, packages(*), users(seller_profiles(*))')
      .eq('id', params.id)
      .single()

    if (fetchErr || !ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    if (ad.status !== 'payment_verified' && ad.status !== 'scheduled') {
      return NextResponse.json({ error: 'Ad must be payment_verified or scheduled' }, { status: 400 })
    }

    const now = new Date().toISOString()
    let newStatus = ad.status
    let newPublishAt = ad.published_at
    let rankScore = ad.rank_score

    if (schedule_action === 'publish_now') {
      newStatus = 'published'
      newPublishAt = now
      
      // Calculate initial rank score on publish
      const isVerified = ad.users?.seller_profiles?.[0]?.is_verified ?? false
      rankScore = calculateRankScore({
        isFeatured: ad.is_featured,
        packageWeight: ad.packages?.weight ?? 0,
        publishedAt: now,
        adminBoost: ad.admin_boost ?? 0,
        isSellerVerified: isVerified
      })
    } else {
      newStatus = 'scheduled'
      newPublishAt = publish_at
    }

    const { error: updateErr } = await supabase
      .from('ads')
      .update({
        status: newStatus,
        published_at: newPublishAt,
        rank_score: rankScore,
        updated_at: now
      })
      .eq('id', params.id)

    if (updateErr) throw updateErr

    await logStatusHistory(supabase, params.id, ad.status, newStatus, user.id, `Admin action: ${schedule_action}`)
    await logAudit(supabase, user.id, `ad_${schedule_action}`, 'ad', params.id, ad.status, newStatus)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error scheduling ad:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
