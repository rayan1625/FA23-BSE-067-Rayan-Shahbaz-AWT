import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    
    const { 
      title, 
      description, 
      price, 
      category, 
      city, 
      imageUrls = [], 
      videoUrl = '',
      userId,
      is_featured = false 
    } = body

    // Validate required fields
    if (!title || !description || !price || !category || !city || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Create ad in database
    const { data: ad, error } = await supabase
      .from('ads')
      .insert({
        title,
        slug,
        description,
        price: parseFloat(price),
        category_id: category,
        city_id: city,
        user_id: userId,
        status: 'draft',
        is_featured,
        thumbnail: imageUrls[0] || null,
        images: imageUrls,
        video_url: videoUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating ad:', error)
      return NextResponse.json(
        { error: 'Failed to create ad' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, ad }, { status: 201 })
  } catch (error) {
    console.error('Error in create ad API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
