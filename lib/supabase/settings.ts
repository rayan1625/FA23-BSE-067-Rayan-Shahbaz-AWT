import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export interface UserSettings {
  id: string
  user_id: string
  two_factor_enabled: boolean
  two_factor_method: 'email' | 'authenticator'
  language: string
  timezone: string
  currency: string
  show_phone: boolean
  show_email: boolean
  profile_visibility: boolean
  private_mode: boolean
  email_ad_approved: boolean
  email_ad_rejected: boolean
  email_payment_verified: boolean
  in_app_notifications: boolean
  sound_notifications: boolean
  default_category: string
  default_city: string
  auto_renew_ads: boolean
  featured_ad_preference: boolean
  theme_color: string
  compact_mode: boolean
  card_list_view: boolean
  updated_at: string
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching user settings:', error)
    return null
  }

  return data
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      ...settings,
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error updating user settings:', error)
    return false
  }

  return true
}

export async function createUserSettingsIfNotExists(userId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { data: existing } = await supabase
    .from('user_settings')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!existing) {
    await supabase.from('user_settings').insert({
      user_id: userId,
      two_factor_enabled: false,
      two_factor_method: 'email',
      language: 'en',
      timezone: 'UTC+5',
      currency: 'PKR',
      show_phone: true,
      show_email: false,
      profile_visibility: true,
      private_mode: false,
      email_ad_approved: true,
      email_ad_rejected: true,
      email_payment_verified: true,
      in_app_notifications: true,
      sound_notifications: false,
      default_category: 'all',
      default_city: 'all',
      auto_renew_ads: false,
      featured_ad_preference: false,
      theme_color: 'indigo',
      compact_mode: false,
      card_list_view: true
    })
  }
}
