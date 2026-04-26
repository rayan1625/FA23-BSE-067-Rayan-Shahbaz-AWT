-- AdFlow Pro - Complete Supabase SQL Schema
-- Run this entire script in your Supabase SQL Editor.
-- It is idempotent (safe to run multiple times).

-------------------------------------------------------
-- 1. ENUMS (Custom Types)
-------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('client', 'moderator', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.ad_status AS ENUM (
    'draft', 'submitted', 'under_review', 'payment_pending', 
    'payment_submitted', 'payment_verified', 'scheduled', 
    'published', 'expired', 'archived', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.media_type AS ENUM ('image', 'youtube');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-------------------------------------------------------
-- 2. CORE TABLES
-------------------------------------------------------

-- Users Table (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  role        public.user_role DEFAULT 'client',
  name        TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seller Profiles
CREATE TABLE IF NOT EXISTS public.seller_profiles (
  user_id         UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  company_name    TEXT,
  phone           TEXT,
  website         TEXT,
  is_verified     BOOLEAN DEFAULT FALSE,
  verified_points INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-------------------------------------------------------
-- 3. AUTH TRIGGER (Auto-create user & seller profile)
-------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, email, name, avatar_url, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'client'
  );
  
  -- Insert default seller profile
  INSERT INTO public.seller_profiles (user_id)
  VALUES (new.id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-------------------------------------------------------
-- 4. CLASSIFICATION & CONFIG TABLES
-------------------------------------------------------

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id    SERIAL PRIMARY KEY,
  name  TEXT UNIQUE NOT NULL,
  slug  TEXT UNIQUE NOT NULL,
  icon  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cities
CREATE TABLE IF NOT EXISTS public.cities (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  country TEXT NOT NULL,
  state TEXT,
  slug  TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Packages (Pricing Tiers)
CREATE TABLE IF NOT EXISTS public.packages (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  price          NUMERIC(10, 2) NOT NULL,
  duration_days  INTEGER NOT NULL,
  weight         INTEGER NOT NULL DEFAULT 0,
  is_featured    BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-------------------------------------------------------
-- 5. SEED SAMPLE DATA (Idempotent)
-------------------------------------------------------
INSERT INTO public.categories (name, slug, icon) VALUES 
('Real Estate', 'real-estate', 'home'),
('Vehicles', 'vehicles', 'car'),
('Electronics', 'electronics', 'smartphone'),
('Services', 'services', 'briefcase')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.cities (name, country, slug) VALUES 
('New York', 'USA', 'new-york-usa'),
('London', 'UK', 'london-uk'),
('Dubai', 'UAE', 'dubai-uae'),
('Toronto', 'Canada', 'toronto-canada')
ON CONFLICT (slug) DO NOTHING;

-- Seed packages if empty
INSERT INTO public.packages (id, name, price, duration_days, weight, is_featured) 
VALUES 
(1, 'Basic', 9.99, 7, 0, false),
(2, 'Standard', 19.99, 14, 5, false),
(3, 'Premium', 49.99, 30, 10, true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  duration_days = EXCLUDED.duration_days, 
  weight = EXCLUDED.weight, 
  is_featured = EXCLUDED.is_featured;

-- Fix auto-increment sequence for packages just in case
SELECT setval('public.packages_id_seq', (SELECT MAX(id) FROM public.packages));

-------------------------------------------------------
-- 6. CORE LISTINGS (Ads)
-------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.users(id) NOT NULL,
  category_id  INTEGER REFERENCES public.categories(id),
  city_id      INTEGER REFERENCES public.cities(id),
  city_name    TEXT, 
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

-- Ad Media (Gallery)
CREATE TABLE IF NOT EXISTS public.ad_media (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id             UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  source_type       public.media_type NOT NULL,
  original_url      TEXT NOT NULL,
  thumbnail_url     TEXT,
  validation_status TEXT DEFAULT 'pending',
  order_index       INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-------------------------------------------------------
-- 7. AUDITING, PAYMENTS, & LIFECYCLE
-------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id           UUID REFERENCES public.ads(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  package_id      INTEGER REFERENCES public.packages(id),
  amount          NUMERIC(10, 2) NOT NULL,
  status          TEXT DEFAULT 'pending', 
  transaction_ref TEXT UNIQUE,
  proof_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ad_status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id       UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  old_status  TEXT,
  new_status  TEXT,
  changed_by  UUID REFERENCES public.users(id),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.users(id),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-------------------------------------------------------
-- 8. COMMUNICATIONS & AI
-------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  link        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_health_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name   TEXT NOT NULL,
  metric_value  JSONB,
  status        TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.learning_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT NOT NULL,
  question      TEXT NOT NULL,
  options       JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  points        INTEGER DEFAULT 10,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_generated_ads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES public.users(id),
  prompt        TEXT NOT NULL,
  generated_data JSONB NOT NULL,
  used          BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_ad_feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES public.ai_generated_ads(id),
  user_id       UUID REFERENCES public.users(id),
  rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
  comments      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-------------------------------------------------------
-- 9. PERFORMANCE INDEXES
-------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ads_status ON public.ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_rank ON public.ads(rank_score DESC);
CREATE INDEX IF NOT EXISTS idx_ads_user ON public.ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_media_ad ON public.ad_media(ad_id);
CREATE INDEX IF NOT EXISTS idx_payments_ad ON public.payments(ad_id);

-------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) 
-- Disabled for easier development/testing right now. 
-- You can enable and refine them later for production.
-------------------------------------------------------
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
