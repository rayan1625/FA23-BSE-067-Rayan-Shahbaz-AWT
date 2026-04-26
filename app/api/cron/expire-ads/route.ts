import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const now = new Date().toISOString()

    const { data: ads, error: fetchErr } = await supabase
      .from('ads')
      .select('id')
      .eq('status', 'published')
      .lt('expires_at', now)

    if (fetchErr) throw fetchErr

    let expiredCount = 0

    for (const ad of (ads || [])) {
      const { error: updateErr } = await supabase
        .from('ads')
        .update({
          status: 'expired',
          updated_at: now
        })
        .eq('id', ad.id)

      if (!updateErr) {
        await supabase.from('ad_status_history').insert({
          ad_id: ad.id,
          old_status: 'published',
          new_status: 'expired',
          notes: 'Auto-expired by cron'
        })
        expiredCount++
      }
    }

    return NextResponse.json({ expired_count: expiredCount })
  } catch (error) {
    console.error('Expire cron error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
