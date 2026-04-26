-- AdFlow Pro - Production Database Schema Export
-- Includes tables, custom types, functions, and triggers.

-- ENUMS
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

-- CORE TABLES
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  role        public.user_role DEFAULT 'client',
  name        TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

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

-- AUTH TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, role)
  VALUES (
    new.id, 
    COALESCE(new.email, ''), 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'client'::public.user_role
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.seller_profiles (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATEGORIES & CONFIG
CREATE TABLE IF NOT EXISTS public.categories (
  id    SERIAL PRIMARY KEY,
  name  TEXT UNIQUE NOT NULL,
  slug  TEXT UNIQUE NOT NULL,
  icon  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cities (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  country TEXT NOT NULL,
  state TEXT,
  slug  TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.packages (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  price          NUMERIC(10, 2) NOT NULL,
  duration_days  INTEGER NOT NULL,
  weight         INTEGER NOT NULL DEFAULT 0,
  is_featured    BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ADS & MEDIA
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
  
  is_featured  BOOLEAN DEFAULT FALSE,
  admin_boost  INTEGER DEFAULT 0,
  rank_score   INTEGER DEFAULT 0,
  
  published_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

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

-- PAYMENTS & LOGS
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

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_ads_status ON public.ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_rank ON public.ads(rank_score DESC);
CREATE INDEX IF NOT EXISTS idx_ads_user ON public.ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_media_ad ON public.ad_media(ad_id);
CREATE INDEX IF NOT EXISTS idx_payments_ad ON public.payments(ad_id);
