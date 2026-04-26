import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const startTime = Date.now()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Run a simple query to check DB health
    const { error: healthErr } = await supabase.from('users').select('id').limit(1)

    const responseMs = Date.now() - startTime

    await supabase.from('system_health_logs').insert({
      metric_name: 'cron-heartbeat',
      metric_value: { response_ms: responseMs },
      status: healthErr ? 'failed' : 'success'
    })

    if (healthErr) throw healthErr

    return NextResponse.json({ status: 'ok', response_ms: responseMs })
  } catch (error) {
    console.error('Heartbeat cron error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
