import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET - Fetch single ad
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: ad, error } = await supabase
      .from('ads')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Ad not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ad }, { status: 200 })
  } catch (error) {
    console.error('Error fetching ad:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update ad
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      imageUrls, 
      videoUrl,
      status,
      is_featured 
    } = body

    // Generate new slug if title changed
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const { data: ad, error } = await supabase
      .from('ads')
      .update({
        title,
        slug,
        description,
        price: price ? parseFloat(price) : undefined,
        category_id: category,
        city_id: city,
        status,
        is_featured,
        thumbnail: imageUrls?.[0] || undefined,
        images: imageUrls,
        video_url: videoUrl || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating ad:', error)
      return NextResponse.json(
        { error: 'Failed to update ad' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, ad }, { status: 200 })
  } catch (error) {
    console.error('Error in update ad API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete ad
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting ad:', error)
      return NextResponse.json(
        { error: 'Failed to delete ad' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error in delete ad API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
