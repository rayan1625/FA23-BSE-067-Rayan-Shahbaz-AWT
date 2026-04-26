import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit, logStatusHistory } from '@/lib/audit'
import { z } from 'zod'

const verifySchema = z.object({
  action: z.enum(['verify', 'reject']),
  admin_note: z.string().optional()
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
      return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = verifySchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { action, admin_note } = parsed.data

    // Get payment and ad
    const { data: payment, error: fetchErr } = await supabase
      .from('payments')
      .select('*, ads(id, status)')
      .eq('id', params.id)
      .single()

    if (fetchErr || !payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    if (payment.status !== 'submitted') return NextResponse.json({ error: 'Payment is not in submitted status' }, { status: 400 })
    
    // Type checking the joined relation
    const adId = (payment.ads as unknown as {id: string})?.id
    const adStatus = (payment.ads as unknown as {status: string})?.status

    if (!adId) return NextResponse.json({ error: 'Linked ad not found' }, { status: 404 })

    const now = new Date().toISOString()
    const newPaymentStatus = action === 'verify' ? 'verified' : 'rejected'
    const newAdStatus = action === 'verify' ? 'payment_verified' : 'rejected'

    const paymentUpdate: Record<string, string> = { 
      status: newPaymentStatus, 
      updated_at: now
    }
    // Rejection reason isn't in schema directly as a column, storing it in notes or skipping if not there
    // We'll just update status.
    await supabase.from('payments').update(paymentUpdate).eq('id', payment.id)

    // Update Ad
    await supabase.from('ads').update({ 
      status: newAdStatus,
      updated_at: now 
    }).eq('id', adId)

    // Logs
    await logStatusHistory(supabase, adId, adStatus, newAdStatus, user.id, admin_note || `Payment ${action}d`)
    await logAudit(supabase, user.id, `payment_${action}d`, 'payment', payment.id, 'submitted', newPaymentStatus)
    await logAudit(supabase, user.id, 'status_change', 'ad', adId, adStatus, newAdStatus)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
