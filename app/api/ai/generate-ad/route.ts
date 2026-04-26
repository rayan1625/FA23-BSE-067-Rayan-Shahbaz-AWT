import { NextRequest, NextResponse } from 'next/server'
import { generateAdsWorkflow, AdGenerationInput } from '@/lib/crewai/workflow'
import { 
  saveAIGeneratedAd, 
  saveGenerationHistory, 
  getSuccessfulPatterns,
  saveAIAdToMainAds 
} from '@/lib/supabase/ai-ads'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { product_name, audience, platform, tone, userId, demoMode } = body

    console.log('Received ad generation request:', { product_name, audience, platform, tone, userId, demoMode })

    // Validate required fields
    if (!product_name || !audience || !platform || !tone || !userId) {
      console.error('Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: product_name, audience, platform, tone, userId' },
        { status: 400 }
      )
    }

    // If demo mode is requested, set environment variable for this request
    if (demoMode) {
      process.env.DEMO_MODE = 'true'
      console.log('Using demo mode (no OpenAI API calls)')
    } else {
      // Check if OPENAI_API_KEY is set for real AI mode
      if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY is not set in environment variables')
        return NextResponse.json(
          { error: 'Server configuration error: OpenAI API key not configured. Use demo mode instead.' },
          { status: 500 }
        )
      }
      process.env.DEMO_MODE = 'false'
    }

    console.log('Fetching historical patterns...')
    // Get historical patterns for learning
    const historicalContext = await getSuccessfulPatterns()
    console.log('Historical context retrieved successfully')

    // Prepare input for workflow
    const input: AdGenerationInput = {
      product_name,
      audience,
      platform,
      tone,
      userId,
      historicalContext: historicalContext || undefined
    }

    console.log('Starting AI workflow...')
    // Generate ads using AI workflow
    const result = await generateAdsWorkflow(input)
    console.log('AI workflow completed successfully')

    let savedAds = result.ads
    let savedToDb = false

    // Try to save to database, but don't fail if tables don't exist
    try {
      console.log('Saving ads to database...')
      // Save all generated ads to database
      savedAds = await Promise.all(
        result.ads.map(async (ad) => {
          const adToSave = {
            user_id: userId,
            product_name,
            audience,
            platform,
            tone,
            headline: ad.headline,
            description: ad.description,
            cta: ad.cta,
            hashtags: ad.hashtags,
            engagement_score: ad.engagement_score,
            conversion_score: ad.conversion_score,
            overall_score: ad.overall_score,
            generation_method: 'openai',
            prompt_used: JSON.stringify(input),
            variant_number: ad.variant_number,
            is_best_variant: ad.overall_score === result.best_ad.overall_score,
            status: 'generated'
          }
          return await saveAIGeneratedAd(adToSave)
        })
      )
      console.log('Ads saved to database successfully')
      savedToDb = true

      // Automatically save the best ad to main ads table
      console.log('Saving best ad to main ads table...')
      const bestAdData = {
        user_id: userId,
        product_name,
        audience,
        platform,
        tone,
        headline: result.best_ad.headline,
        description: result.best_ad.description,
        cta: result.best_ad.cta,
        hashtags: result.best_ad.hashtags,
        engagement_score: result.best_ad.engagement_score,
        conversion_score: result.best_ad.conversion_score,
        overall_score: result.best_ad.overall_score,
        generation_method: 'openai',
        prompt_used: JSON.stringify(input),
        variant_number: result.best_ad.variant_number,
        is_best_variant: true,
        status: 'generated'
      }
      const savedBestAd = await saveAIGeneratedAd(bestAdData)
      const mainAdId = await saveAIAdToMainAds(savedBestAd, userId)
      
      if (mainAdId) {
        console.log('Best ad saved to main ads table successfully with ID:', mainAdId)
      } else {
        console.warn('Failed to save best ad to main ads table (table may not exist yet)')
      }

      console.log('Saving generation history...')
      // Save generation history for learning
      await saveGenerationHistory({
        user_id: userId,
        product_category: product_name,
        target_audience: audience,
        platform_used: platform,
        tone_used: tone,
        average_rating: result.best_ad.overall_score,
        usage_count: 1,
        successful_patterns: historicalContext ? JSON.parse(historicalContext) : {}
      })
      console.log('Generation history saved successfully')
    } catch (dbError) {
      console.warn('Database save failed (tables may not exist yet), continuing with AI result:', dbError)
      // Continue with the AI-generated ads even if database save fails
      savedAds = result.ads
      savedToDb = false
    }

    return NextResponse.json({
      ads: savedAds,
      best_ad: result.best_ad,
      saved_to_db: savedToDb,
      research_insights: result.research_insights,
      strategy_recommendations: result.strategy_recommendations
    })

  } catch (error) {
    console.error('Error in generate-ad API:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Failed to generate ads', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
