import { NextRequest, NextResponse } from 'next/server'
import { saveAIAdFeedback, getAIAdFeedback } from '@/lib/supabase/ai-ads'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { ai_ad_id, user_id, rating, comment, headline_quality, description_quality, cta_quality, relevance } = body

    // Validate required fields
    if (!ai_ad_id || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields: ai_ad_id, rating' },
        { status: 400 }
      )
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Save feedback
    const feedback = await saveAIAdFeedback({
      ai_ad_id,
      user_id,
      rating,
      comment,
      headline_quality,
      description_quality,
      cta_quality,
      relevance,
      was_helpful: rating >= 3,
      would_use_again: rating >= 4
    })

    return NextResponse.json({
      success: true,
      feedback
    })

  } catch (error) {
    console.error('Error in feedback API:', error)
    return NextResponse.json(
      { error: 'Failed to save feedback', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ai_ad_id = searchParams.get('ai_ad_id')

    if (!ai_ad_id) {
      return NextResponse.json(
        { error: 'Missing required parameter: ai_ad_id' },
        { status: 400 }
      )
    }

    const feedback = await getAIAdFeedback(ai_ad_id)

    return NextResponse.json({
      feedback,
      count: feedback.length,
      average_rating: feedback.length > 0 
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
        : 0
    })

  } catch (error) {
    console.error('Error in feedback API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
