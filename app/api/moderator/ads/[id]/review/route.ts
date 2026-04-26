import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit, logStatusHistory } from '@/lib/audit'
import { z } from 'zod'

const reviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().optional()
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
    if (!userData || !['moderator', 'admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { action, note } = parsed.data

    const { data: ad, error: fetchErr } = await supabase
      .from('ads')
      .select('id, status')
      .eq('id', params.id)
      .single()

    if (fetchErr || !ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    if (ad.status !== 'submitted') return NextResponse.json({ error: 'Ad is not in submitted status' }, { status: 400 })

    const newStatus = action === 'approve' ? 'payment_pending' : 'rejected'

    const { error: updateErr } = await supabase
      .from('ads')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', ad.id)

    if (updateErr) throw updateErr

    await logStatusHistory(supabase, ad.id, ad.status, newStatus, user.id, note || `Moderator ${action}d`)
    await logAudit(supabase, user.id, `ad_review_${action}`, 'ad', ad.id, ad.status, newStatus)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error reviewing ad:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
