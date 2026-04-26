import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit, logStatusHistory } from '@/lib/audit'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the ad
    const { data: ad, error: fetchError } = await supabase
      .from('ads')
      .select('id, user_id, status')
      .eq('id', params.id)
      .single()

    if (fetchError || !ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    if (ad.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (ad.status !== 'draft') {
      return NextResponse.json({ error: 'Ad must be in draft status to submit' }, { status: 400 })
    }

    // Update status
    const { error: updateError } = await supabase
      .from('ads')
      .update({
        status: 'submitted',
        updated_at: new Date().toISOString()
      })
      .eq('id', ad.id)

    if (updateError) throw updateError

    // Log history and audit
    await logStatusHistory(supabase, ad.id, 'draft', 'submitted', user.id, 'Client submitted for review')
    await logAudit(supabase, user.id, 'status_change', 'ad', ad.id, 'draft', 'submitted')

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error submitting ad:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
