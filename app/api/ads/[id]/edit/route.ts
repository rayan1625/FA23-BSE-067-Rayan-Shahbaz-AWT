import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: ad, error: fetchErr } = await supabase
      .from('ads')
      .select('id, user_id, status')
      .eq('id', params.id)
      .single()

    if (fetchErr || !ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    if (ad.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (ad.status !== 'draft') {
      return NextResponse.json({ error: 'Only drafts can be edited' }, { status: 403 })
    }

    const body = await request.json()

    const { error: updateErr } = await supabase
      .from('ads')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', ad.id)

    if (updateErr) throw updateErr

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error editing ad:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
