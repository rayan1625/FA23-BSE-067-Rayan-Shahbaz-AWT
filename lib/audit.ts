import { SupabaseClient } from '@supabase/supabase-js'

export async function logAudit(
  supabase: SupabaseClient,
  user_id: string,
  action: string,
  entity_type: string,
  entity_id: string,
  old_value: unknown,
  new_value: unknown,
  details?: Record<string, unknown>
) {
  const { error } = await supabase.from('audit_logs').insert({
    user_id,
    action,
    entity_type,
    entity_id,
    details: { old_value, new_value, ...(details || {}) },
  })
  
  if (error) {
    console.error('Failed to log audit:', error)
  }
}

export async function logStatusHistory(
  supabase: SupabaseClient,
  ad_id: string,
  old_status: string,
  new_status: string,
  changed_by: string,
  notes?: string
) {
  const { error } = await supabase.from('ad_status_history').insert({
    ad_id,
    old_status,
    new_status,
    changed_by,
    notes,
  })
  
  if (error) {
    console.error('Failed to log status history:', error)
  }
}
