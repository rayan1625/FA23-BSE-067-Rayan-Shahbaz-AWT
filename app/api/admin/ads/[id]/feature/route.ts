import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { calculateRankScore } from '@/lib/ranking-system'
import { z } from 'zod'

const featureSchema = z.object({
  is_featured: z.boolean(),
  admin_boost: z.number().min(0).max(100).optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = featureSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { is_featured, admin_boost } = parsed.data

    const { data: ad, error: fetchErr } = await supabase
      .from('ads')
      .select('*, packages(*), users(seller_profiles(*))')
      .eq('id', params.id)
      .single()

    if (fetchErr || !ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    if (ad.status !== 'published') return NextResponse.json({ error: 'Ad must be published to modify feature status' }, { status: 400 })

    const isVerified = ad.users?.seller_profiles?.[0]?.is_verified ?? false
    const newBoost = admin_boost !== undefined ? admin_boost : (ad.admin_boost ?? 0)
    
    const rankScore = calculateRankScore({
      isFeatured: is_featured,
      packageWeight: ad.packages?.weight ?? 0,
      publishedAt: ad.published_at || ad.created_at,
      adminBoost: newBoost,
      isSellerVerified: isVerified
    })

    const { error: updateErr } = await supabase
      .from('ads')
      .update({
        is_featured,
        admin_boost: newBoost,
        rank_score: rankScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (updateErr) throw updateErr

    await logAudit(supabase, user.id, 'ad_featured_update', 'ad', params.id, 
      { is_featured: ad.is_featured, boost: ad.admin_boost },
      { is_featured, boost: newBoost, rankScore }
    )

    return NextResponse.json({ success: true, rank_score: rankScore }, { status: 200 })
  } catch (error) {
    console.error('Error updating feature status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
