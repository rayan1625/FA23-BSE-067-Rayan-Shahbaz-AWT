import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { DUMMY_CATEGORIES } from '@/lib/dummy-data'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const authHeader = req.headers.get('Authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = {
      posted: false,
      archivedCount: 0,
      errors: [] as string[]
    }

    // 1. ARCHIVE OLD ADS (Older than 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: adsToArchive, error: archiveError } = await supabase
      .from('ads')
      .update({ status: 'archived' })
      .lt('created_at', sevenDaysAgo.toISOString())
      .neq('status', 'archived')
      .select('id')

    if (archiveError) {
      results.errors.push(`Archive error: ${archiveError.message}`)
    } else {
      results.archivedCount = adsToArchive?.length || 0
    }

    // 2. POST DAILY AD
    // Get a random category
    const category = DUMMY_CATEGORIES[Math.floor(Math.random() * DUMMY_CATEGORIES.length)]
    
    // In a real app, we'd pick a random title from a pool or generate one
    const titles = [
      'Premium wireless headphones',
      'Modern 2-bedroom apartment',
      'Mountain bike - nearly new',
      'Vintage leather armchair',
      'High-performance gaming laptop',
      'Professional photography service',
      'Organic garden starter kit'
    ]
    const title = titles[Math.floor(Math.random() * titles.length)]
    
    // Generate AI description (reuse fallback logic if needed)
    let description = ''
    try {
      const prompt = `Write a short, professional ad description for: ${title} in the category ${category.name}. 2 sentences max.`
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
      })
      description = completion.choices[0]?.message?.content?.trim() || ''
    } catch {
      // Fallback
      description = `Check out this amazing ${title}! High quality and great value in the ${category.name} category. Limited time offer, don't miss out!`
    }

    // Get a system user or the first user to assign the ad to
    const { data: userData } = await supabase.from('users').select('id').limit(1).single()
    
    if (userData) {
      const { error: postError } = await supabase.from('ads').insert({
        user_id: userData.id,
        title,
        description,
        price: Math.floor(Math.random() * 500) + 50,
        category_id: category.id,
        status: 'published',
        slug: `${title.toLowerCase().replace(/ /g, '-')}-${Date.now()}`
      })

      if (postError) {
        results.errors.push(`Post error: ${postError.message}`)
      } else {
        results.posted = true
      }
    } else {
      results.errors.push('No users found to assign the automated ad to.')
    }

    return NextResponse.json({ success: true, ...results })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
