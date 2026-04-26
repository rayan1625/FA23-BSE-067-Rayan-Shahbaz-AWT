import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Do NOT run this in production without modifying. This script will delete data if run repeatedly without ON CONFLICT constraints.
// Best to run this directly via Supabase SQL Editor, but here is a Node script that does it programmatically if needed.
// However, as requested, here is the raw SQL string you can copy-paste into the Supabase SQL Editor.

const SEED_SQL = `
-- 1. Create Sample Users via auth (Simulated for Public.users bypass if trigger fails)
-- Usually users are created via Auth, but we can seed public.users directly for testing if RLS is off.
DO $$ BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@adflow.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin User"}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mod@adflow.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Moderator Bob"}', now(), now()),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'client1@adflow.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Client Alice"}', now(), now()),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'client2@adflow.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Client Dave"}', now(), now()),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'client3@adflow.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Client Eve"}', now(), now())
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN 
  RAISE NOTICE 'Failed to insert auth.users. Make sure you run this as superuser or just rely on the trigger.';
END $$;

-- Update roles
UPDATE public.users SET role = 'admin'::public.user_role WHERE email = 'admin@adflow.com';
UPDATE public.users SET role = 'moderator'::public.user_role WHERE email = 'mod@adflow.com';

-- 2. Seed Learning Questions
INSERT INTO public.learning_questions (id, category, question, options, correct_index, points) VALUES
(gen_random_uuid(), 'Best Practices', 'Which image resolution works best for real estate ads?', '["800x600", "1920x1080", "150x150", "4K Only"]', 1, 10),
(gen_random_uuid(), 'Ad Flow', 'What is the next status after Payment Verified?', '["Draft", "Under Review", "Scheduled or Published", "Archived"]', 2, 10),
(gen_random_uuid(), 'Safety', 'What should you never include in a public ad description?', '["Phone number", "Credit card details", "Company Name", "Pricing"]', 1, 15)
ON CONFLICT DO NOTHING;

-- 3. Seed Ads (Across different statuses and clients)
-- Client 1 (33333333-3333-3333-3333-333333333333)
INSERT INTO public.ads (id, user_id, category_id, city_id, package_id, title, slug, description, price, status, published_at, expires_at) VALUES
('a1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 1, 1, 3, 'Luxury Penthouse in Downtown', 'luxury-penthouse-ny', 'Stunning views, 3 beds, 3 baths.', 1500000, 'published', NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days'),
('a1111111-1111-1111-1111-111111111112', '33333333-3333-3333-3333-333333333333', 2, 2, 1, '2019 Toyota Camry LE', '2019-toyota-camry-lon', 'Great condition, 40k miles.', 18500, 'draft', NULL, NULL),
('a1111111-1111-1111-1111-111111111113', '33333333-3333-3333-3333-333333333333', 3, 3, 2, 'MacBook Pro M2 Max', 'macbook-pro-m2-max-dub', 'Lightly used, perfect for video editing.', 2500, 'submitted', NULL, NULL);

-- Client 2 (44444444-4444-4444-4444-444444444444)
INSERT INTO public.ads (id, user_id, category_id, city_id, package_id, title, slug, description, price, status, published_at, expires_at) VALUES
('a2222222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444444', 4, 4, 1, 'Professional Plumber Services', 'pro-plumber-tor', 'Available 24/7 for emergencies.', 100, 'published', NOW() - INTERVAL '5 days', NOW() + INTERVAL '2 days'),
('a2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 1, 1, 3, 'Cozy Studio Apartment for Rent', 'cozy-studio-rent-ny', 'Perfect for students or singles.', 1200, 'payment_pending', NULL, NULL),
('a2222222-2222-2222-2222-222222222223', '44444444-4444-4444-4444-444444444444', 2, 2, 2, 'Vintage Motorcycle Restored', 'vintage-motorcycle-lon', '1970 Triumph Bonneville.', 8500, 'payment_verified', NULL, NULL);

-- Client 3 (55555555-5555-5555-5555-555555555555)
INSERT INTO public.ads (id, user_id, category_id, city_id, package_id, title, slug, description, price, status, published_at, expires_at) VALUES
('a3333333-3333-3333-3333-333333333331', '55555555-5555-5555-5555-555555555555', 3, 3, 3, 'Sony A7IV Mirrorless Camera', 'sony-a7iv-dub', 'Body only. Shutter count < 5000.', 2100, 'published', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 days'), -- Expired ad
('a3333333-3333-3333-3333-333333333332', '55555555-5555-5555-5555-555555555555', 4, 4, 1, 'Web Development Agency', 'web-dev-agency-tor', 'We build React and Next.js apps.', 5000, 'scheduled', NULL, NULL);

-- 4. Seed Ad Media
INSERT INTO public.ad_media (ad_id, source_type, original_url, order_index) VALUES
('a1111111-1111-1111-1111-111111111111', 'image', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', 0),
('a1111111-1111-1111-1111-111111111112', 'image', 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?w=800&q=80', 0),
('a2222222-2222-2222-2222-222222222221', 'image', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80', 0),
('a3333333-3333-3333-3333-333333333331', 'image', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80', 0);

-- 5. Seed Payments
INSERT INTO public.payments (ad_id, user_id, package_id, amount, status, transaction_ref) VALUES
('a1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 3, 49.99, 'verified', 'TXN-0001'),
('a2222222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444444', 1, 9.99, 'verified', 'TXN-0002'),
('a3333333-3333-3333-3333-333333333331', '55555555-5555-5555-5555-555555555555', 3, 49.99, 'verified', 'TXN-0003'),
('a2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 3, 49.99, 'pending', 'TXN-0004');

-- 6. Seed Notifications
INSERT INTO public.notifications (user_id, title, message) VALUES
('33333333-3333-3333-3333-333333333333', 'Welcome!', 'Welcome to AdFlow Pro! Start posting ads today.'),
('44444444-4444-4444-4444-444444444444', 'Payment Received', 'We received your payment for TXN-0004 and it is pending verification.');
`

console.log("SQL Seed string generated. Paste this into your Supabase SQL Editor.")
