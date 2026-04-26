import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Agent configuration types
export interface AgentConfig {
  role: string
  goal: string
  backstory: string
}

// Research Agent - Analyzes input and gathers context
export const researchAgent: AgentConfig = {
  role: 'Ad Research Specialist',
  goal: 'Analyze product information and target audience to understand the marketing context',
  backstory: `You are an expert market researcher with 15 years of experience in digital advertising. 
  You excel at understanding product positioning, audience demographics, and market trends. 
  Your analysis forms the foundation for successful ad campaigns.`,
}

// Strategy Agent - Decides ad angle and approach
export const strategyAgent: AgentConfig = {
  role: 'Ad Strategy Architect',
  goal: 'Determine the optimal ad angle, messaging strategy, and platform-specific approach',
  backstory: `You are a strategic marketing consultant who has worked with Fortune 500 companies. 
  You know how to craft compelling narratives that resonate with specific audiences. 
  You excel at translating product features into emotional benefits.`,
}

// Copywriting Agent - Generates ad content
export const copywritingAgent: AgentConfig = {
  role: 'Creative Copywriter',
  goal: 'Write compelling headlines, descriptions, and CTAs that drive engagement and conversions',
  backstory: `You are an award-winning copywriter with a talent for crafting irresistible ad copy. 
  Your headlines have generated millions in revenue. You understand the psychology of persuasion 
  and know how to create urgency and desire without being pushy.`,
}

// Variants Agent - Creates multiple versions
export const variantsAgent: AgentConfig = {
  role: 'A/B Testing Specialist',
  goal: 'Create multiple ad variants with different angles, tones, and approaches for testing',
  backstory: `You are a conversion rate optimization expert who specializes in A/B testing. 
  You know that different audiences respond to different messaging, and you excel at creating 
  variations that allow for data-driven optimization.`,
}

// Critic Agent - Scores and evaluates ads
export const criticAgent: AgentConfig = {
  role: 'Ad Quality Critic',
  goal: 'Evaluate ad quality based on engagement potential, conversion likelihood, and brand alignment',
  backstory: `You are a strict but fair advertising critic with deep knowledge of what makes ads successful. 
  You evaluate ads based on multiple criteria: clarity, appeal, credibility, and actionability. 
  You provide constructive feedback and numerical scores.`,
}

// Optimization Agent - Improves best ad
export const optimizationAgent: AgentConfig = {
  role: 'Ad Optimization Expert',
  goal: 'Refine and improve the best-performing ad variant based on critic feedback and historical patterns',
  backstory: `You are a data-driven optimization specialist who knows how to turn good ads into great ads. 
  You analyze performance data and feedback to make targeted improvements that boost conversion rates. 
  You understand the fine line between persuasion and annoyance.`,
}

// Define agent types
export type AgentType = 'research' | 'strategy' | 'copywriting' | 'variants' | 'critic' | 'optimization'

// Define agent interface
export interface Agent {
  name: string
  role: string
  goal: string
  backstory: string
  type: AgentType
}

// Define all agents
export const agents: Record<AgentType, Agent> = {
  research: {
    name: 'Ad Research Specialist',
    role: 'Market Research Analyst',
    goal: 'Analyze the product and target audience to identify key selling points and market trends',
    backstory: 'You are an expert market researcher with 10+ years of experience in advertising and consumer psychology. You excel at identifying what makes products appeal to specific audiences.',
    type: 'research'
  },
  strategy: {
    name: 'Ad Strategy Expert',
    role: 'Marketing Strategist',
    goal: 'Develop a comprehensive advertising strategy based on research findings',
    backstory: 'You are a seasoned marketing strategist who has worked with Fortune 500 companies. You know how to craft compelling ad angles that resonate with target audiences.',
    type: 'strategy'
  },
  copywriting: {
    name: 'Creative Copywriter',
    role: 'Senior Copywriter',
    goal: 'Write compelling ad copy that converts',
    backstory: 'You are an award-winning copywriter with a talent for crafting persuasive messages that drive action. Your copy is always clear, engaging, and conversion-focused.',
    type: 'copywriting'
  },
  variants: {
    name: 'Variant Generator',
    role: 'Creative Director',
    goal: 'Create multiple ad variations for A/B testing',
    backstory: 'You are a creative director who understands the importance of testing different approaches. You can quickly generate multiple variations while maintaining brand consistency.',
    type: 'variants'
  },
  critic: {
    name: 'Ad Quality Critic',
    role: 'Quality Assurance Specialist',
    goal: 'Evaluate and score ad variations based on engagement and conversion potential',
    backstory: 'You have a keen eye for what makes ads successful. You can predict which variations will perform better based on psychological principles and industry best practices.',
    type: 'critic'
  },
  optimization: {
    name: 'Ad Optimizer',
    role: 'Performance Marketer',
    goal: 'Refine the best-performing ad to maximize its impact',
    backstory: 'You are a data-driven marketer who specializes in optimization. You know exactly what tweaks will improve ad performance without changing the core message.',
    type: 'optimization'
  }
}

// Check if demo mode (no API key or quota exceeded)
export function isDemoMode(): boolean {
  return !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === '' || process.env.DEMO_MODE === 'true'
}

// Generate mock response for demo mode
function generateMockResponse(agentType: AgentType, task: string, context?: string): string {
  const mockResponses: Record<AgentType, string> = {
    research: `Based on analysis of the product "${context?.split('product_name:')[1]?.split(',')[0] || 'product'}" for ${context?.split('audience:')[1]?.split(',')[0] || 'adults'} audience:\n\nKey insights:\n- Target audience values authenticity and practicality\n- Pain points include time constraints and information overload\n- Competitors focus on price, not value proposition\n- Market opportunity in emphasizing quality and convenience`,
    strategy: `Strategic approach:\n\n1. Primary angle: Emphasize how this product solves daily problems\n2. Secondary angle: Highlight quality and reliability\n3. Platform-specific tactics: Use storytelling for Facebook, quick value propositions for Twitter\n4. Tone balance: Mix humor with practical information`,
    copywriting: `Generated ad copy:\n\nHeadline: Transform Your Daily Routine Today\n\nDescription: Discover how our solution saves you time while delivering exceptional results. Join thousands who have already upgraded their experience.\n\nCTA: Get Started Now\n\nHashtags: #lifestyle #upgrade #quality #convenience`,
    variants: `Ad variations:\n\n[\n  {\n    "headline": "Upgrade Your Life Today",\n    "description": "Experience the difference quality makes. Simple, effective, and designed for you.",\n    "cta": "Shop Now",\n    "hashtags": ["#quality", "#lifestyle"]\n  },\n  {\n    "headline": "Why Wait? Start Now",\n    "description": "Don't settle for less. Get the premium experience you deserve.",\n    "cta": "Learn More",\n    "hashtags": ["#premium", "#lifestyle"]\n  },\n  {\n    "headline": "Smart Choice, Smart You",\n    "description": "Make the decision that thousands have already made. Quality you can trust.",\n    "cta": "Join Us",\n    "hashtags": ["#smart", "#quality"]\n  }\n]`,
    critic: `Ad evaluation scores:\n\nVariant 1: Engagement 8/10, Conversion 7/10, Overall 7.5/10\nVariant 2: Engagement 7/10, Conversion 8/10, Overall 7.5/10\nVariant 3: Engagement 9/10, Conversion 8/10, Overall 8.5/10\n\nBest performer: Variant 3 - Strong emotional appeal with clear value proposition`,
    optimization: `Optimized ad:\n\nHeadline: Make the Smart Choice Today\n\nDescription: Join thousands who've upgraded their experience. Quality you can trust, results you can see.\n\nCTA: Start Your Journey\n\nHashtags: #smartchoice #quality #lifestyle\n\nOptimizations made:\n- Strengthened social proof\n- Improved clarity\n- Enhanced emotional appeal`
  }

  return mockResponses[agentType] || 'Mock response for demo mode'
}

// Helper function to execute agent task
export async function executeAgentTask(
  agent: AgentConfig,
  task: string,
  context?: string
): Promise<string> {
  // Use demo mode if no API key or explicitly enabled
  if (isDemoMode()) {
    console.log(`[DEMO MODE] Executing ${agent.role} task (no API call)`)
    const agentType = agent.role.toLowerCase() as AgentType
    return generateMockResponse(agentType, task, context)
  }

  try {
    const systemPrompt = `You are a ${agent.role}. 
${agent.backstory}

Your goal: ${agent.goal}

${context ? `Context: ${context}` : ''}

Instructions:
- Think step by step
- Be specific and actionable
- Provide clear, concise output
- Use professional marketing terminology`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: task }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    return response.choices[0]?.message?.content || 'No response generated'
  } catch (error) {
    console.error(`Error executing ${agent.role} task:`, error)
    
    // Fall back to demo mode on API error (quota exceeded, etc.)
    console.log(`[FALLBACK] Using demo mode due to API error`)
    const agentType = agent.role.toLowerCase() as AgentType
    return generateMockResponse(agentType, task, context)
  }
}

export { openai }
