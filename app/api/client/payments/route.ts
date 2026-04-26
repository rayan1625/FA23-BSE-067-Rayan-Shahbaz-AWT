import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit, logStatusHistory } from '@/lib/audit'
import { z } from 'zod'

const paymentSchema = z.object({
  ad_id: z.string().uuid(),
  amount: z.number().positive(),
  method: z.string(),
  transaction_ref: z.string().min(3),
  sender_name: z.string().optional(),
  proof_url: z.string().url().optional().or(z.literal(''))
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = paymentSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
    }

    const { ad_id, amount, method, transaction_ref, proof_url } = parsed.data

    // Verify ad ownership and status
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select('id, user_id, status, package_id')
      .eq('id', ad_id)
      .single()

    if (adError || !ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    if (ad.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (ad.status !== 'payment_pending') return NextResponse.json({ error: 'Ad is not pending payment' }, { status: 400 })

    // Check duplicate transaction_ref
    const { count, error: countError } = await supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('transaction_ref', transaction_ref)
      
    if (countError) throw countError
    if (count && count > 0) return NextResponse.json({ error: 'Transaction reference already exists' }, { status: 400 })

    // Insert payment
    const { data: payment, error: insertError } = await supabase
      .from('payments')
      .insert({
        ad_id,
        user_id: user.id,
        package_id: ad.package_id,
        amount,
        status: 'submitted',
        transaction_ref,
        proof_url,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Update ad status
    const { error: updateError } = await supabase
      .from('ads')
      .update({
        status: 'payment_submitted',
        updated_at: new Date().toISOString()
      })
      .eq('id', ad.id)

    if (updateError) throw updateError

    // Logs
    await logStatusHistory(supabase, ad.id, 'payment_pending', 'payment_submitted', user.id, `Payment proof submitted (${method})`)
    await logAudit(supabase, user.id, 'payment_submitted', 'payment', payment.id, null, { amount, transaction_ref })
    await logAudit(supabase, user.id, 'status_change', 'ad', ad.id, 'payment_pending', 'payment_submitted')

    return NextResponse.json({ success: true, payment_id: payment.id }, { status: 200 })
  } catch (error) {
    console.error('Error processing payment proof:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
