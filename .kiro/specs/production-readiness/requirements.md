# Requirements Document

## Introduction

AdFlow Pro is a Next.js 14 App Router marketplace application backed by Supabase. The current codebase contains placeholder implementations for several critical production systems: payment processing uses a fake form with a `setTimeout`, file uploads accept only external URLs, email notifications are absent, cron jobs are stubbed out, the explore page filters are wired to dummy data, and real-time updates require manual page refreshes. This feature set replaces all seven placeholder systems with production-grade implementations using Stripe, Supabase Storage, Resend, Vercel Cron, live Supabase queries, and Supabase Realtime WebSockets — while also completing the Row Level Security policy layer across all database tables.

---

## Glossary

- **System**: The AdFlow Pro Next.js 14 application and its Supabase backend collectively.
- **RLS_Policy**: A Supabase Row Level Security policy that restricts database row access based on the authenticated user's identity and role.
- **Stripe_Checkout**: A Stripe-hosted payment page session created via the Stripe API.
- **Stripe_Webhook**: An HTTP POST event sent by Stripe to the System to confirm payment outcomes.
- **Payment_Processor**: The System component responsible for creating Stripe Checkout sessions, receiving Stripe Webhooks, and updating payment and ad records accordingly.
- **Storage_Service**: The Supabase Storage component used to upload, store, and serve ad media files.
- **Email_Service**: The Resend-powered component responsible for sending transactional email notifications.
- **Cron_Runner**: The Vercel Cron scheduler that invokes System API routes on a defined schedule.
- **Explore_Filter**: The set of category, city, price range, and package filter controls on the explore page.
- **Realtime_Subscription**: A Supabase Realtime WebSocket channel that pushes database change events to connected clients.
- **Moderator**: A user with the `moderator`, `admin`, or `super_admin` role who reviews submitted ads.
- **Seller**: A user with the `client` role who creates and manages ads.
- **Ad**: A listing record in the `ads` table with a lifecycle status tracked by `ad_status`.
- **Service_Role_Client**: A Supabase client instantiated with the `SUPABASE_SERVICE_ROLE_KEY`, used only in server-side API routes and cron jobs to bypass RLS where necessary.
- **Anon_Client**: A Supabase client instantiated with the `NEXT_PUBLIC_SUPABASE_ANON_KEY`, subject to all RLS policies.
- **CRON_SECRET**: A shared secret environment variable used to authenticate requests to cron API routes.

---

## Requirements

### Requirement 1: Row Level Security Policies

**User Story:** As a platform operator, I want all database tables protected by RLS policies, so that users can only read and write data they are authorized to access.

#### Acceptance Criteria

1. THE System SHALL enable RLS on all tables: `users`, `ads`, `payments`, `notifications`, `seller_profiles`, `categories`, `cities`, `packages`, `ad_media`, `ad_status_history`, `audit_logs`, `ai_generated_ads`, `ai_ad_feedback`, `ai_generation_history`.
2. WHEN an authenticated user queries the `users` table, THE RLS_Policy SHALL permit the user to SELECT, UPDATE, and DELETE only the row where `id = auth.uid()`.
3. WHEN a user with role `admin` or `super_admin` queries the `users` table, THE RLS_Policy SHALL permit SELECT and UPDATE on all rows.
4. WHEN an authenticated user queries the `ads` table, THE RLS_Policy SHALL permit SELECT on rows where `user_id = auth.uid()` or `status = 'published'`.
5. WHEN a user with role `moderator`, `admin`, or `super_admin` queries the `ads` table, THE RLS_Policy SHALL permit SELECT on all rows.
6. WHEN an authenticated user inserts into the `ads` table, THE RLS_Policy SHALL permit INSERT only when `user_id = auth.uid()`.
7. WHEN an authenticated user updates the `ads` table, THE RLS_Policy SHALL permit UPDATE only on rows where `user_id = auth.uid()` and the current `status` is `draft`.
8. WHEN a user with role `moderator`, `admin`, or `super_admin` updates the `ads` table, THE RLS_Policy SHALL permit UPDATE on all rows.
9. WHEN an authenticated user queries the `payments` table, THE RLS_Policy SHALL permit SELECT only on rows where `user_id = auth.uid()`.
10. WHEN a user with role `admin` or `super_admin` queries the `payments` table, THE RLS_Policy SHALL permit SELECT on all rows.
11. WHEN an authenticated user queries the `notifications` table, THE RLS_Policy SHALL permit SELECT, UPDATE, and DELETE only on rows where `user_id = auth.uid()`.
12. WHEN an authenticated user queries the `seller_profiles` table, THE RLS_Policy SHALL permit SELECT, INSERT, and UPDATE only on the row where `user_id = auth.uid()`.
13. WHEN any authenticated or anonymous user queries the `categories`, `cities`, or `packages` tables, THE RLS_Policy SHALL permit SELECT on all rows.
14. WHEN an authenticated user queries the `ad_media` table, THE RLS_Policy SHALL permit SELECT on rows belonging to ads the user owns or ads with `status = 'published'`.
15. WHEN an authenticated user inserts into the `ad_media` table, THE RLS_Policy SHALL permit INSERT only when the referenced `ad_id` belongs to an ad owned by `auth.uid()`.
16. WHEN an authenticated user queries the `ad_status_history` table, THE RLS_Policy SHALL permit SELECT only on rows where the referenced ad's `user_id = auth.uid()`.
17. WHEN a user with role `moderator`, `admin`, or `super_admin` queries the `ad_status_history` table, THE RLS_Policy SHALL permit SELECT on all rows.
18. WHEN an authenticated user queries the `audit_logs` table, THE RLS_Policy SHALL permit SELECT only on rows where `user_id = auth.uid()`.
19. WHEN a user with role `admin` or `super_admin` queries the `audit_logs` table, THE RLS_Policy SHALL permit SELECT on all rows.

---

### Requirement 2: Stripe Payment Processing

**User Story:** As a Seller, I want to pay for my ad package using a real payment method, so that my ad can be submitted for review after a verified transaction.

#### Acceptance Criteria

1. WHEN a Seller selects a package and proceeds to payment, THE Payment_Processor SHALL create a Stripe Checkout session via `POST /api/payments/create-checkout` and return a `session_url` to redirect the Seller.
2. WHEN creating a Stripe Checkout session, THE Payment_Processor SHALL include the package name, price in cents, ad ID, and user ID as session metadata.
3. WHEN Stripe redirects the Seller to the success URL after payment, THE System SHALL display a confirmation page and update the ad status to `payment_submitted`.
4. WHEN Stripe sends a `checkout.session.completed` webhook event to `POST /api/payments/webhook`, THE Payment_Processor SHALL verify the Stripe webhook signature using `STRIPE_WEBHOOK_SECRET`.
5. IF the Stripe webhook signature verification fails, THEN THE Payment_Processor SHALL return HTTP 400 and take no further action.
6. WHEN a verified `checkout.session.completed` event is received, THE Payment_Processor SHALL update the corresponding `payments` record status to `verified` and the linked `ads` record status to `payment_verified`.
7. WHEN a verified `checkout.session.completed` event is received, THE Payment_Processor SHALL record a row in `ad_status_history` with `new_status = 'payment_verified'` and `notes` referencing the Stripe session ID.
8. WHEN a Stripe `checkout.session.expired` or `payment_intent.payment_failed` event is received, THE Payment_Processor SHALL update the `payments` record status to `rejected`.
9. THE Payment_Processor SHALL use the `STRIPE_SECRET_KEY` environment variable for all Stripe API calls and SHALL NOT expose this key to the client.
10. WHERE the `STRIPE_SECRET_KEY` environment variable is absent, THE Payment_Processor SHALL return HTTP 500 with a descriptive error and SHALL NOT attempt to call the Stripe API.

---

### Requirement 3: File Upload via Supabase Storage

**User Story:** As a Seller, I want to upload images directly from my device when creating an ad, so that I do not need to host images externally.

#### Acceptance Criteria

1. WHEN a Seller selects image files during ad creation, THE Storage_Service SHALL upload each file to the `ad-media` Supabase Storage bucket via `POST /api/upload/media`.
2. THE Storage_Service SHALL accept files of MIME type `image/jpeg`, `image/png`, `image/webp`, and `image/gif` only.
3. IF a file exceeds 5 MB, THEN THE Storage_Service SHALL reject the upload and return HTTP 422 with a message indicating the size limit.
4. IF a file has an unsupported MIME type, THEN THE Storage_Service SHALL reject the upload and return HTTP 422 with a message indicating the allowed types.
5. WHEN a file is successfully uploaded, THE Storage_Service SHALL return the public URL of the stored file.
6. WHEN a file is successfully uploaded, THE Storage_Service SHALL insert a row into the `ad_media` table with `source_type = 'image'`, `original_url` set to the public URL, and `validation_status = 'approved'`.
7. THE Storage_Service SHALL store files under the path `{user_id}/{ad_id}/{filename}` within the `ad-media` bucket to scope access by owner.
8. WHEN an ad is deleted, THE Storage_Service SHALL delete all associated files from the `ad-media` bucket.
9. THE Storage_Service SHALL use the Service_Role_Client for storage operations and SHALL NOT expose the service role key to the client.

---

### Requirement 4: Email Notifications via Resend

**User Story:** As a Seller, I want to receive email notifications for key events in my ad's lifecycle, so that I stay informed without having to check the dashboard manually.

#### Acceptance Criteria

1. WHEN an ad's status changes to `submitted`, THE Email_Service SHALL send a confirmation email to the Seller with the ad title and a link to the dashboard.
2. WHEN an ad's status changes to `payment_verified`, THE Email_Service SHALL send a payment confirmation email to the Seller with the transaction reference and package details.
3. WHEN a Moderator approves an ad and its status changes to `published`, THE Email_Service SHALL send an ad-published email to the Seller with the public ad URL.
4. WHEN a Moderator rejects an ad and its status changes to `rejected`, THE Email_Service SHALL send a rejection email to the Seller including the rejection reason provided by the Moderator.
5. WHEN a Cron_Runner job detects an ad with `expires_at` within 3 days and `status = 'published'`, THE Email_Service SHALL send an ad-expiring-soon email to the Seller with the expiry date and a renewal link.
6. THE Email_Service SHALL send all emails from the address configured in the `RESEND_FROM_EMAIL` environment variable using the Resend API key in `RESEND_API_KEY`.
7. IF the Resend API call fails, THEN THE Email_Service SHALL log the error and SHALL NOT throw an exception that would interrupt the primary workflow (e.g., status update).
8. WHERE the `RESEND_API_KEY` environment variable is absent, THE Email_Service SHALL skip sending and log a warning.

---

### Requirement 5: Vercel Cron Jobs

**User Story:** As a platform operator, I want scheduled tasks to run automatically, so that ads are published, expired, and ranked without manual intervention.

#### Acceptance Criteria

1. THE Cron_Runner SHALL invoke `GET /api/cron/publish-scheduled` every 5 minutes to publish ads where `status = 'scheduled'` and `published_at <= NOW()`.
2. WHEN `GET /api/cron/publish-scheduled` is invoked, THE System SHALL update matching ads' `status` to `published` and record a row in `ad_status_history`.
3. THE Cron_Runner SHALL invoke `GET /api/cron/expire-ads` every hour to expire ads where `status = 'published'` and `expires_at <= NOW()`.
4. WHEN `GET /api/cron/expire-ads` is invoked, THE System SHALL update matching ads' `status` to `expired` and record a row in `ad_status_history`.
5. THE Cron_Runner SHALL invoke `GET /api/cron/sync-rank-scores` once daily to recalculate and update the `rank_score` column for all published ads.
6. WHEN `GET /api/cron/sync-rank-scores` is invoked, THE System SHALL compute `rank_score` based on `is_featured`, `admin_boost`, package weight, and recency, then update each ad's `rank_score`.
7. WHEN any cron route is invoked, THE System SHALL verify the `Authorization: Bearer {CRON_SECRET}` header before executing any database operations.
8. IF the `Authorization` header is missing or does not match `CRON_SECRET`, THEN THE System SHALL return HTTP 401 and perform no database operations.
9. THE Cron_Runner SHALL send expiring-soon email notifications for ads expiring within 3 days as part of the `GET /api/cron/expire-ads` job.
10. THE System SHALL define all cron schedules in `vercel.json` under the `crons` key using valid cron expression syntax.

---

### Requirement 6: Explore Page Filters with Pagination

**User Story:** As a visitor, I want to filter ads by category, city, price range, and package on the explore page, so that I can find relevant listings quickly.

#### Acceptance Criteria

1. WHEN a visitor loads the explore page, THE System SHALL fetch published ads from Supabase with `status = 'published'`, ordered by `rank_score DESC`, paginated at 12 ads per page.
2. WHEN a visitor selects a category filter, THE Explore_Filter SHALL add a `category_id` equality condition to the Supabase query and reset the page to 1.
3. WHEN a visitor selects a city filter, THE Explore_Filter SHALL add a `city_id` equality condition to the Supabase query and reset the page to 1.
4. WHEN a visitor enters a minimum price, THE Explore_Filter SHALL add a `price >= minPrice` condition to the Supabase query and reset the page to 1.
5. WHEN a visitor enters a maximum price, THE Explore_Filter SHALL add a `price <= maxPrice` condition to the Supabase query and reset the page to 1.
6. WHEN a visitor selects a package filter, THE Explore_Filter SHALL add a `package_id` equality condition to the Supabase query and reset the page to 1.
7. WHEN a visitor enters a search term, THE Explore_Filter SHALL add a full-text `ilike` condition on `title` and `description` to the Supabase query and reset the page to 1.
8. WHEN a visitor clicks a pagination control, THE Explore_Filter SHALL fetch the corresponding page of results using Supabase range queries.
9. THE System SHALL load available categories, cities, and packages for the filter controls from Supabase on initial page load.
10. WHEN no ads match the active filters, THE System SHALL display a "No ads found" message with a prompt to clear filters.
11. IF a Supabase query error occurs, THEN THE System SHALL display an error message and SHALL NOT render a broken page.

---

### Requirement 7: Real-time Subscriptions

**User Story:** As a Moderator and as a Seller, I want the UI to update automatically when relevant data changes, so that I do not need to refresh the page to see new information.

#### Acceptance Criteria

1. WHEN a Moderator views the review queue page, THE Realtime_Subscription SHALL subscribe to INSERT and UPDATE events on the `ads` table filtered to `status IN ('submitted', 'under_review')`.
2. WHEN a new ad enters the moderation queue via a Realtime_Subscription event, THE System SHALL add the ad to the queue list without requiring a page refresh.
3. WHEN an ad is approved or rejected and leaves the queue via a Realtime_Subscription event, THE System SHALL remove the ad from the queue list without requiring a page refresh.
4. WHEN an authenticated user views any page with a notification bell, THE Realtime_Subscription SHALL subscribe to INSERT events on the `notifications` table filtered to `user_id = auth.uid()`.
5. WHEN a new notification arrives via a Realtime_Subscription event, THE System SHALL increment the unread notification count badge without requiring a page refresh.
6. WHEN a Seller views their dashboard ads list, THE Realtime_Subscription SHALL subscribe to UPDATE events on the `ads` table filtered to `user_id = auth.uid()`.
7. WHEN an ad's status changes via a Realtime_Subscription event, THE System SHALL update the displayed status badge for that ad without requiring a page refresh.
8. WHEN a component using a Realtime_Subscription is unmounted, THE System SHALL unsubscribe from the Supabase Realtime channel to prevent memory leaks.
9. IF a Realtime_Subscription connection is lost, THEN THE System SHALL attempt to reconnect using Supabase's built-in reconnection behavior.
10. THE Realtime_Subscription SHALL use the Anon_Client and SHALL be subject to RLS policies, ensuring users only receive events for rows they are authorized to read.
