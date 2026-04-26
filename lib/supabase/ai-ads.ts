import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Types for AI-generated ads
export interface AIGeneratedAd {
  id?: string
  user_id: string
  ad_id?: string
  product_name: string
  audience: string
  platform: string
  tone: string
  headline: string
  description: string
  cta: string
  hashtags: string[]
  engagement_score: number
  conversion_score: number
  overall_score: number
  generation_method: string
  prompt_used?: string
  variant_number: number
  is_best_variant: boolean
  status: string
  created_at?: string
  updated_at?: string
}

export interface AIAdFeedback {
  id?: string
  ai_ad_id: string
  user_id?: string
  rating: number
  comment?: string
  headline_quality?: number
  description_quality?: number
  cta_quality?: number
  relevance?: number
  was_helpful?: boolean
  would_use_again?: boolean
  created_at?: string
}

export interface AIGenerationHistory {
  id?: string
  user_id: string
  product_category?: string
  target_audience?: string
  platform_used?: string
  tone_used?: string
  average_rating?: number
  usage_count?: number
  successful_patterns?: Record<string, unknown>
  failed_patterns?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

// Save AI-generated ad to database
export async function saveAIGeneratedAd(ad: AIGeneratedAd): Promise<AIGeneratedAd> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('ai_generated_ads')
      .insert(ad)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error saving AI-generated ad:', error)
    throw error
  }
}

// Get all AI-generated ads for a user
export async function getAIGeneratedAds(userId: string): Promise<AIGeneratedAd[]> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('ai_generated_ads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching AI-generated ads:', error)
    throw error
  }
}

// Get top-rated AI-generated ads for learning
export async function getTopRatedAds(limit: number = 10): Promise<AIGeneratedAd[]> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('ai_generated_ads')
      .select('*')
      .gte('overall_score', 7.0)
      .order('overall_score', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching top-rated ads:', error)
    throw error
  }
}

// Save feedback for AI-generated ad
export async function saveAIAdFeedback(feedback: AIAdFeedback): Promise<AIAdFeedback> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('ai_ad_feedback')
      .insert(feedback)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error saving AI ad feedback:', error)
    throw error
  }
}

// Get feedback for an AI-generated ad
export async function getAIAdFeedback(aiAdId: string): Promise<AIAdFeedback[]> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('ai_ad_feedback')
      .select('*')
      .eq('ai_ad_id', aiAdId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching AI ad feedback:', error)
    throw error
  }
}

// Save generation history for learning
export async function saveGenerationHistory(history: AIGenerationHistory): Promise<AIGenerationHistory> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('ai_generation_history')
      .insert(history)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error saving generation history:', error)
    throw error
  }
}

// Get generation history for a user
export async function getGenerationHistory(userId: string): Promise<AIGenerationHistory[]> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('ai_generation_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching generation history:', error)
    throw error
  }
}

// Get successful patterns from top-rated ads
export async function getSuccessfulPatterns(): Promise<string> {
  try {
    const topAds = await getTopRatedAds(5)
    
    if (topAds.length === 0) return ''
    
    const patterns = topAds.map(ad => ({
      headline: ad.headline,
      description: ad.description,
      cta: ad.cta,
      hashtags: ad.hashtags,
      tone: ad.tone,
      platform: ad.platform,
      audience: ad.audience,
      score: ad.overall_score
    }))

    return JSON.stringify(patterns, null, 2)
  } catch (error) {
    // If tables don't exist, return empty string instead of failing
    console.warn('Database tables may not exist yet, skipping pattern learning', error)
    return ''
  }
}

// Update AI-generated ad status
export async function updateAIAdStatus(
  aiAdId: string,
  status: string,
  adId?: string
): Promise<void> {
  try {
    const updateData: { status: string; ad_id?: string } = { status }
    if (adId) updateData.ad_id = adId

    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('ai_generated_ads')
      .update(updateData)
      .eq('id', aiAdId)

    if (error) throw error
  } catch (error) {
    console.error('Error updating AI ad status:', error)
    throw error
  }
}

// Save AI-generated ad to main ads table
export async function saveAIAdToMainAds(
  aiAd: AIGeneratedAd,
  userId: string
): Promise<string | null> {
  try {
    // Generate slug from headline
    const slug = aiAd.headline
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100) + '-' + Date.now()

    const adData = {
      user_id: userId,
      title: aiAd.headline,
      slug,
      description: aiAd.description,
      status: 'draft' as const,
      is_featured: false,
      admin_boost: 0,
      rank_score: 0,
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('ads')
      .insert(adData)
      .select('id')
      .single()

    if (error) throw error

    // Update the AI-generated ad to link to the main ad
    await updateAIAdStatus(aiAd.id || '', 'published', data.id)

    return data.id
  } catch (error) {
    console.error('Error saving AI ad to main ads table:', error)
    return null
  }
}
