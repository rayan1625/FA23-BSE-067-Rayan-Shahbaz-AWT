import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Fallback logic when DEMO_MODE is true or no OpenAI key
function generateMockResponse(message: string): string {
  const lowerMsg = message.toLowerCase()
  if (lowerMsg.includes('create ad') || lowerMsg.includes('post ad') || lowerMsg.includes('new ad')) {
    return "To create a new ad, simply navigate to your Dashboard and click on the 'Post Ad' button. You'll need to provide a title, select a category, upload media, and choose a pricing package."
  }
  if (lowerMsg.includes('payment') || lowerMsg.includes('price') || lowerMsg.includes('package')) {
    return "We offer Basic, Standard, and Premium packages. Payments are securely processed, and your ad will be sent to moderation once payment is verified."
  }
  if (lowerMsg.includes('moderation') || lowerMsg.includes('review') || lowerMsg.includes('approve')) {
    return "After submitting an ad, it goes into our moderation queue. Our team reviews ads to ensure they meet our quality guidelines. This usually takes less than 24 hours."
  }
  if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
    return "Hello there! I'm the AdFlow Pro Assistant. How can I help you today?"
  }
  return "I'm processing your request. As an AI assistant, I can help you understand how to create ads, manage payments, or navigate the moderation process. What specifically would you like to know?"
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 })
    }

    const latestMessage = messages[messages.length - 1].content

    // Check if we should use mock router (no API key or demo mode)
    const apiKey = process.env.OPENAI_API_KEY
    const isDemoMode = process.env.DEMO_MODE === 'true'

    if (!apiKey || apiKey === 'your_openai_api_key_here' || isDemoMode) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800))
      return NextResponse.json({ 
        role: 'assistant',
        content: generateMockResponse(latestMessage) 
      })
    }

    // Call actual OpenAI API
    const openai = new OpenAI({ apiKey })
    
    const systemPrompt = `You are the AdFlow Pro Assistant, an expert AI embedded within an ad marketplace platform. 
    You help users navigate the platform, understand how to post ads, explain moderation policies, and provide ad optimization tips.
    Be concise, professional, and helpful. Format your responses with markdown if necessary.`

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 300,
    })

    return NextResponse.json({
      role: 'assistant',
      content: completion.choices[0].message.content
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}
