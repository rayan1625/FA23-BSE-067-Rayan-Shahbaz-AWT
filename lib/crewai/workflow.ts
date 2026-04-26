import { 
  researchAgent, 
  strategyAgent, 
  copywritingAgent, 
  variantsAgent, 
  criticAgent, 
  optimizationAgent,
  executeAgentTask 
} from './agents'

export interface AdGenerationInput {
  product_name: string
  audience: string
  platform: string
  tone: string
  userId: string
  historicalContext?: string // Past successful patterns
}

export interface GeneratedAd {
  headline: string
  description: string
  cta: string
  hashtags: string[]
  engagement_score: number
  conversion_score: number
  overall_score: number
  variant_number: number
  feedback?: string
}

export interface WorkflowResult {
  ads: GeneratedAd[]
  best_ad: GeneratedAd
  saved_to_db: boolean
  research_insights: string
  strategy_recommendations: string
}

// Main workflow for AI ad generation
export async function generateAdsWorkflow(input: AdGenerationInput): Promise<WorkflowResult> {
  const { product_name, audience, platform, tone, historicalContext } = input

  try {
    // Step 1: Research - Analyze input and gather context
    console.log('Step 1: Research Analysis')
    const researchTask = `Analyze the following product information:
    - Product: ${product_name}
    - Target Audience: ${audience}
    - Platform: ${platform}
    - Tone: ${tone}

    Provide:
    1. Key product benefits and features
    2. Audience pain points and desires
    3. Platform-specific best practices
    4. Tone-appropriate messaging approach

    ${historicalContext ? `Historical Context (successful patterns): ${historicalContext}` : ''}`

    const researchInsights = await executeAgentTask(researchAgent, researchTask)

    // Step 2: Strategy - Determine ad angle and approach
    console.log('Step 2: Strategy Development')
    const strategyTask = `Based on the research insights:
    ${researchInsights}

    Develop a comprehensive ad strategy including:
    1. Primary emotional hook
    2. Key value proposition
    3. Platform-specific angle (e.g., Instagram visual-first, LinkedIn professional)
    4. Messaging framework
    5. Call-to-action strategy

    Provide specific, actionable recommendations.`

    const strategyRecommendations = await executeAgentTask(strategyAgent, strategyTask)

    // Step 3: Copywriting - Generate initial ad
    console.log('Step 3: Initial Copywriting')
    const copywritingTask = `Using the strategy:
    ${strategyRecommendations}

    Create a compelling ad with:
    1. A catchy headline (max 100 characters)
    2. Engaging description (150-200 characters)
    3. Strong call-to-action (max 50 characters)
    4. 5 relevant hashtags

    Format as JSON:
    {
      "headline": "...",
      "description": "...",
      "cta": "...",
      "hashtags": ["...", "...", "...", "...", "..."]
    }`

    const initialAdResponse = await executeAgentTask(copywritingAgent, copywritingTask)
    const initialAd = parseAdResponse(initialAdResponse)

    // Step 4: Variants - Create multiple versions
    console.log('Step 4: Creating Variants')
    const variantsTask = `Based on the initial ad:
    ${JSON.stringify(initialAd)}

    Create 3 different ad variants with:
    - Variant 1: Different emotional angle
    - Variant 2: Different benefit focus
    - Variant 3: Different CTA approach

    Format as JSON array:
    [
      {
        "headline": "...",
        "description": "...",
        "cta": "...",
        "hashtags": ["...", "...", "...", "...", "..."]
      },
      ...
    ]`

    const variantsResponse = await executeAgentTask(variantsAgent, variantsTask)
    const variants = parseVariantsResponse(variantsResponse)

    // Step 5: Critic - Score all ads
    console.log('Step 5: Evaluating Ads')
    const allAds = [initialAd, ...variants]
    const scoredAds = await scoreAds(allAds, product_name, audience, platform, tone)

    // Step 6: Optimization - Improve best ad
    console.log('Step 6: Optimizing Best Ad')
    const bestAd = scoredAds.reduce((best, current) => 
      current.overall_score > best.overall_score ? current : best
    )

    const optimizationTask = `Here's the best ad with score ${bestAd.overall_score}:
    ${JSON.stringify(bestAd)}

    Critic feedback: ${bestAd.feedback}

    Optimize this ad to improve its score. Focus on:
    1. Making the headline more compelling
    2. Strengthening the description
    3. Making the CTA more action-oriented
    4. Improving hashtag relevance

    Return optimized ad as JSON:
    {
      "headline": "...",
      "description": "...",
      "cta": "...",
      "hashtags": ["...", "...", "...", "...", "..."]
    }`

    const optimizedAdResponse = await executeAgentTask(optimizationAgent, optimizationTask)
    const optimizedAd = parseAdResponse(optimizedAdResponse)

    // Re-score the optimized ad
    const optimizedScored = await scoreSingleAd(
      { ...optimizedAd, variant_number: 0 },
      product_name,
      audience,
      platform,
      tone
    )

    // Replace the best ad with the optimized version if it scores better
    const finalBestAd = optimizedScored.overall_score > bestAd.overall_score 
      ? optimizedScored 
      : bestAd

    // Prepare final result
    const finalAds = scoredAds.map((ad, index) => ({
      ...ad,
      variant_number: index + 1
    }))

    return {
      ads: finalAds,
      best_ad: finalBestAd,
      saved_to_db: false, // Will be set after DB save
      research_insights: researchInsights,
      strategy_recommendations: strategyRecommendations
    }
  } catch (error) {
    console.error('Error in ad generation workflow:', error)
    throw new Error('Failed to generate ads')
  }
}

// Helper function to parse ad response from AI
function parseAdResponse(response: string): GeneratedAd {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        headline?: string
        description?: string
        cta?: string
        hashtags?: string[]
      }
      return {
        headline: parsed.headline || '',
        description: parsed.description || '',
        cta: parsed.cta || '',
        hashtags: parsed.hashtags || [],
        engagement_score: 0,
        conversion_score: 0,
        overall_score: 0,
        variant_number: 0
      }
    }
  } catch (error) {
    console.error('Error parsing ad response:', error)
  }

  // Fallback: extract from text
  return {
    headline: extractFromText(response, 'headline'),
    description: extractFromText(response, 'description'),
    cta: extractFromText(response, 'cta'),
    hashtags: extractHashtags(response),
    engagement_score: 0,
    conversion_score: 0,
    overall_score: 0,
    variant_number: 0
  }
}

// Helper function to parse variants response
function parseVariantsResponse(response: string): GeneratedAd[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Array<{
        headline?: string
        description?: string
        cta?: string
        hashtags?: string[]
      }>
      return parsed.map((ad) => ({
        headline: ad.headline || '',
        description: ad.description || '',
        cta: ad.cta || '',
        hashtags: ad.hashtags || [],
        engagement_score: 0,
        conversion_score: 0,
        overall_score: 0,
        variant_number: 0
      }))
    }
  } catch (error) {
    console.error('Error parsing variants response:', error)
  }
  return []
}

// Helper function to score all ads
async function scoreAds(
  ads: GeneratedAd[],
  product_name: string,
  audience: string,
  platform: string,
  tone: string
): Promise<GeneratedAd[]> {
  const scoredAds = await Promise.all(
    ads.map(ad => scoreSingleAd(ad, product_name, audience, platform, tone))
  )
  return scoredAds
}

// Helper function to score a single ad
async function scoreSingleAd(
  ad: GeneratedAd,
  product_name: string,
  audience: string,
  platform: string,
  tone: string
): Promise<GeneratedAd> {
  const criticTask = `Evaluate this ad for the following:
    - Product: ${product_name}
    - Audience: ${audience}
    - Platform: ${platform}
    - Tone: ${tone}

    Ad:
    Headline: ${ad.headline}
    Description: ${ad.description}
    CTA: ${ad.cta}
    Hashtags: ${ad.hashtags.join(', ')}

    Rate each aspect from 1-10:
    1. Engagement Score (how likely to get attention)
    2. Conversion Score (how likely to drive action)

    Also provide brief feedback for improvement.

    Format as JSON:
    {
      "engagement_score": 7.5,
      "conversion_score": 8.0,
      "feedback": "..."
    }`

  const criticResponse = await executeAgentTask(criticAgent, criticTask)
  
  try {
    const jsonMatch = criticResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        ...ad,
        engagement_score: parsed.engagement_score || 5,
        conversion_score: parsed.conversion_score || 5,
        overall_score: ((parsed.engagement_score || 5) + (parsed.conversion_score || 5)) / 2,
        feedback: parsed.feedback || ''
      }
    }
  } catch (error) {
    console.error('Error parsing critic response:', error)
  }

  // Fallback scores
  return {
    ...ad,
    engagement_score: 5,
    conversion_score: 5,
    overall_score: 5,
    feedback: 'Unable to generate feedback'
  }
}

// Helper function to extract text from AI response
function extractFromText(response: string, field: string): string {
  const patterns = [
    new RegExp(`${field}:\\s*["']?([^"'\n]+)["']?`, 'i'),
    new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`, 'i')
  ]
  
  for (const pattern of patterns) {
    const match = response.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return ''
}

// Helper function to extract hashtags
function extractHashtags(response: string): string[] {
  const hashtagMatch = response.match(/hashtags[:\s]*\[([^\]]+)\]/i)
  if (hashtagMatch) {
    return hashtagMatch[1].split(',').map(tag => tag.trim().replace(/["']/g, ''))
  }
  return []
}
