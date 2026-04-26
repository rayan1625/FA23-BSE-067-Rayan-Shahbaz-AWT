-- AI Ad Generator Schema Extensions for AdFlow Pro
-- Add these tables to your existing Supabase database

-- AI Generated Ads Table (extends existing ads functionality)
CREATE TABLE IF NOT EXISTS public.ai_generated_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE, -- Link to actual ad if published
  
  -- Input parameters
  product_name TEXT NOT NULL,
  audience TEXT NOT NULL,
  platform TEXT NOT NULL,
  tone TEXT NOT NULL,
  
  -- Generated content
  headline TEXT NOT NULL,
  description TEXT NOT NULL,
  cta TEXT NOT NULL,
  hashtags TEXT[],
  
  -- AI metrics
  engagement_score NUMERIC(3, 2) DEFAULT 0, -- 0.00 to 10.00
  conversion_score NUMERIC(3, 2) DEFAULT 0, -- 0.00 to 10.00
  overall_score NUMERIC(3, 2) DEFAULT 0, -- Combined score
  
  -- Generation metadata
  generation_method TEXT DEFAULT 'crewai', -- crewai, manual, hybrid
  prompt_used TEXT, -- Store the original prompt for learning
  variant_number INTEGER DEFAULT 1, -- Which variant this is
  is_best_variant BOOLEAN DEFAULT FALSE, -- Mark if this was the best generated ad
  
  -- Status tracking
  status TEXT DEFAULT 'generated', -- generated, published, archived
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback Table for AI Learning
CREATE TABLE IF NOT EXISTS public.ai_ad_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_ad_id UUID REFERENCES public.ai_generated_ads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Feedback data
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  
  -- Specific feedback categories
  headline_quality INTEGER CHECK (headline_quality >= 1 AND headline_quality <= 5),
  description_quality INTEGER CHECK (description_quality >= 1 AND description_quality <= 5),
  cta_quality INTEGER CHECK (cta_quality >= 1 AND cta_quality <= 5),
  relevance INTEGER CHECK (relevance >= 1 AND relevance <= 5),
  
  -- Learning data
  was_helpful BOOLEAN DEFAULT TRUE,
  would_use_again BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Generation History (for pattern learning)
CREATE TABLE IF NOT EXISTS public.ai_generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Input patterns
  product_category TEXT,
  target_audience TEXT,
  platform_used TEXT,
  tone_used TEXT,
  
  -- Success metrics
  average_rating NUMERIC(3, 2),
  usage_count INTEGER DEFAULT 0,
  
  -- Pattern learning
  successful_patterns JSONB, -- Store successful headline patterns, etc.
  failed_patterns JSONB, -- Store patterns to avoid
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_ai_ads_user ON public.ai_generated_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_ads_ad ON public.ai_generated_ads(ad_id);
CREATE INDEX IF NOT EXISTS idx_ai_ads_status ON public.ai_generated_ads(status);
CREATE INDEX IF NOT EXISTS idx_ai_ads_score ON public.ai_generated_ads(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_ai_ad ON public.ai_ad_feedback(ai_ad_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON public.ai_ad_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_history_user ON public.ai_generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_category ON public.ai_generation_history(product_category);

-- Row Level Security
ALTER TABLE public.ai_generated_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_ad_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own AI ads" ON public.ai_generated_ads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own AI ads" ON public.ai_generated_ads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own AI ads" ON public.ai_generated_ads
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own AI ads" ON public.ai_generated_ads
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view own feedback" ON public.ai_ad_feedback
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own feedback" ON public.ai_ad_feedback
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own history" ON public.ai_generation_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own history" ON public.ai_generation_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_ai_generated_ads_updated_at
  BEFORE UPDATE ON public.ai_generated_ads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_generation_history_updated_at
  BEFORE UPDATE ON public.ai_generation_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
