import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateRankScore } from '@/lib/ranking-system'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Must use service role for cron jobs to bypass RLS in case it is enabled later
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const now = new Date().toISOString()

    const { data: ads, error: fetchErr } = await supabase
      .from('ads')
      .select('id, packages(weight), is_featured, admin_boost, users(seller_profiles(is_verified))')
      .eq('status', 'scheduled')
      .lte('published_at', now)

    if (fetchErr) throw fetchErr

    let publishedCount = 0
    const errors = []

    for (const ad of (ads || [])) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isVerified = (ad.users as any)?.seller_profiles?.[0]?.is_verified ?? false
        const rankScore = calculateRankScore({
          isFeatured: ad.is_featured,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          packageWeight: (ad.packages as any)?.weight ?? 0,
          publishedAt: now,
          adminBoost: ad.admin_boost ?? 0,
          isSellerVerified: isVerified
        })

        const { error: updateErr } = await supabase
          .from('ads')
          .update({
            status: 'published',
            rank_score: rankScore,
            updated_at: now
          })
          .eq('id', ad.id)

        if (updateErr) throw updateErr

        // Log history & audit
        await supabase.from('ad_status_history').insert({
          ad_id: ad.id,
          old_status: 'scheduled',
          new_status: 'published',
          notes: 'Auto-published by cron'
        })
        
        await supabase.from('audit_logs').insert({
          action: 'cron_publish',
          entity_type: 'ad',
          entity_id: ad.id,
          details: { status: 'published', rankScore }
        })

        publishedCount++
      } catch (err) {
        console.error(`Failed to publish ad ${ad.id}`, err)
        errors.push(ad.id)
      }
    }

    return NextResponse.json({ published_count: publishedCount, errors })
  } catch (error) {
    console.error('Publish cron error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
