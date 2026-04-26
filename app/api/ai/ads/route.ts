import { NextRequest, NextResponse } from 'next/server'
import { getAIGeneratedAds } from '@/lib/supabase/ai-ads'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      )
    }

    const ads = await getAIGeneratedAds(userId)

    return NextResponse.json({
      ads,
      count: ads.length
    })

  } catch (error) {
    console.error('Error in ads API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ads', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
