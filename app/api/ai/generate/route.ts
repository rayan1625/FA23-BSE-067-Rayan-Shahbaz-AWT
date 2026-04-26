import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type BodyShape = {
  title?: string
  category?: string
  price?: number | string
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

function getErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error && typeof (error as { status: unknown }).status === 'number') {
    return (error as { status: number }).status
  }
  return undefined
}

export async function POST(req: Request) {
  let body: BodyShape = {}
  try {
    body = (await req.json()) as BodyShape
    const { title, category, price } = body

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required for AI generation.' }, { status: 400 })
    }

    const prompt = `You are an expert copywriter for an online classifieds marketplace. Write a compelling, natural, and persuasive ad description for the following listing. The description should be 3-4 sentences, highlight key selling points, and end with a clear call-to-action. Do NOT include the title or price in the description itself.

Ad Details:
- Title: ${title}
- Category: ${category || 'General'}
${price ? `- Price: $${price}` : ''}

Write only the description text, nothing else.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 250,
      temperature: 0.7,
    })

    const text = completion.choices[0]?.message?.content?.trim()

    if (!text) {
      throw new Error('No content returned from AI.')
    }

    return NextResponse.json({ success: true, text })
  } catch (error: unknown) {
    console.error('AI generation error:', error)

    const msg = getErrorMessage(error)
    const status = getErrorStatus(error)
    const isQuotaError = status === 429 || msg.includes('quota') || msg.includes('429')

    if (isQuotaError || msg.includes('fetch') || process.env.NODE_ENV === 'development') {
      const { title, category } = body

      let fallbackText = `This premium ${category || 'item'} is now available. Featuring ${title}, it offers exceptional quality and value. Perfect for anyone looking for reliability and style. Don't miss out on this great opportunity—contact us today to learn more!`

      if (category === 'Real Estate') {
        fallbackText = `Welcome to your new dream home! This stunning property features ${title} and is located in a highly sought-after area. With spacious rooms and modern finishes, it's perfect for families or investors. Schedule a viewing today to see this beautiful space in person!`
      } else if (category === 'Vehicles') {
        fallbackText = `Check out this incredible ${title}! Well-maintained and ready for the road, this vehicle offers a smooth driving experience and great features. Whether you're commuting or road-tripping, it's the perfect choice for reliability and performance. Test drive it today!`
      } else if (category === 'Electronics') {
        fallbackText = `Upgrade your tech with this ${title}. High-performance and in excellent condition, it's perfect for work, gaming, or entertainment. Sleek design meets powerful functionality. Get your hands on this premium device today at a competitive price!`
      }

      return NextResponse.json({
        success: true,
        text: fallbackText,
        isMock: true,
        message: isQuotaError ? 'Using fallback (OpenAI quota exceeded)' : 'Using dev fallback',
      })
    }

    return NextResponse.json({ success: false, error: msg || 'AI generation failed' }, { status: 500 })
  }
}
