-- AdFlow Pro - Comprehensive Supabase SQL Schema
-- Paste this into your Supabase SQL Editor (https://supabase.com)

-- 1. ENUMS (Custom Types)
CREATE TYPE public.user_role AS ENUM ('client', 'moderator', 'admin', 'super_admin');
CREATE TYPE public.ad_status AS ENUM (
  'draft', 
  'submitted', 
  'under_review', 
  'payment_pending', 
  'payment_submitted', 
  'payment_verified', 
  'scheduled', 
  'published', 
  'expired', 
  'archived',
  'rejected'
);
CREATE TYPE public.media_type AS ENUM ('image', 'youtube');

-- 2. CORE TABLES

-- Users Table (Extends Supabase Auth)
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  role        public.user_role DEFAULT 'client',
  name        TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seller Profiles (Company/Verification specialized data)
CREATE TABLE public.seller_profiles (
  user_id         UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  company_name    TEXT,
  phone           TEXT,
  website         TEXT,
  is_verified     BOOLEAN DEFAULT FALSE,
  verified_points INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLASSIFICATION DATA

-- Categories
CREATE TABLE public.categories (
  id    SERIAL PRIMARY KEY,
  name  TEXT UNIQUE NOT NULL,
  slug  TEXT UNIQUE NOT NULL,
  icon  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cities (Worldwide support)
CREATE TABLE public.cities (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  country TEXT NOT NULL,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Packages (Pricing Tiers)
CREATE TABLE public.packages (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  price          NUMERIC(10, 2) NOT NULL,
  duration_days  INTEGER NOT NULL,
  weight         INTEGER NOT NULL DEFAULT 0,
  is_featured    BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LISTINGS / ADS

-- Ads Table (The Core Listings)
CREATE TABLE public.ads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.users(id) NOT NULL,
  category_id  INTEGER REFERENCES public.categories(id),
  city_id      INTEGER REFERENCES public.cities(id), -- Optional link to city table
  city_name    TEXT, -- Worldwide city name from API
  package_id   INTEGER REFERENCES public.packages(id),
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  description  TEXT NOT NULL,
  price        NUMERIC(12, 2),
  status       public.ad_status DEFAULT 'draft',
  
  -- Ranking tracking
  is_featured  BOOLEAN DEFAULT FALSE,
  admin_boost  INTEGER DEFAULT 0,
  rank_score   INTEGER DEFAULT 0,
  
  published_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Ad Media (Gallery management)
CREATE TABLE public.ad_media (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id             UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  source_type       public.media_type NOT NULL,
  original_url      TEXT NOT NULL,
  thumbnail_url     TEXT,
  validation_status TEXT DEFAULT 'pending',
  order_index       INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AUDITING & LIFECYCLE

-- Payments Table (Transaction Tracking)
CREATE TABLE public.payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id           UUID REFERENCES public.ads(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  package_id      INTEGER REFERENCES public.packages(id),
  amount          NUMERIC(10, 2) NOT NULL,
  status          TEXT DEFAULT 'pending', -- pending, submitted, verified, rejected
  transaction_ref TEXT,
  proof_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Ad Status History (For moderators/sellers to see progress)
CREATE TABLE public.ad_status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id       UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  old_status  public.ad_status,
  new_status  public.ad_status,
  changed_by  UUID REFERENCES public.users(id),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs (System-wide tracking)
CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.users(id),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COMMUNICATION & HEALTH

-- Notifications
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  link        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- System Health Logs (DevOps)
CREATE TABLE public.system_health_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name   TEXT NOT NULL,
  metric_value  JSONB,
  status        TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PERFORMANCE INDEXES
CREATE INDEX idx_ads_status ON public.ads(status);
CREATE INDEX idx_ads_rank ON public.ads(rank_score DESC);
CREATE INDEX idx_ads_user ON public.ads(user_id);
CREATE INDEX idx_ads_category ON public.ads(category_id);
CREATE INDEX idx_ad_media_ad ON public.ad_media(ad_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);

-- 8. SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Note: Policies should be created specifically based on your app's access patterns.
-- Example: Users can only see their own notifications.
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
