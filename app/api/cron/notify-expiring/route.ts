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

    const now = new Date()
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)

    const { data: ads, error: fetchErr } = await supabase
      .from('ads')
      .select('id, title, user_id, expires_at')
      .eq('status', 'published')
      .gte('expires_at', now.toISOString())
      .lte('expires_at', twoDaysFromNow.toISOString())

    if (fetchErr) throw fetchErr

    let notifiedCount = 0

    for (const ad of (ads || [])) {
      // Check if we already sent an expiry notification recently
      const { count } = await supabase.from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', ad.user_id)
        .like('title', '%Expiring Soon%')
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        
      if (count === 0) {
        await supabase.from('notifications').insert({
          user_id: ad.user_id,
          title: 'Ad Expiring Soon',
          message: `Your ad "${ad.title}" will expire on ${new Date(ad.expires_at).toLocaleDateString()}. Renew it to keep it active.`,
          link: `/dashboard/ads`
        })
        notifiedCount++
      }
    }

    return NextResponse.json({ notified_count: notifiedCount })
  } catch (error) {
    console.error('Notify cron error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
