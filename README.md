# AdFlow Pro - Premium Classifieds Platform

AdFlow Pro is a state-of-the-art SaaS classifieds platform offering AI-assisted ad generation, robust lifecycle tracking, administrative moderation, and automated cron jobs for ad expiration and publication.

## Features

- **Full Ad Lifecycle Management**: Draft, Submit, Payment Verification, Moderation, Scheduled, Published, Expired.
- **AI Ad Generator**: Users can input rough descriptions and have OpenAI generate high-converting titles and professional descriptions automatically.
- **Supabase Backend**: Complete integration using PostgreSQL RLS, Server-side API Routes, and Triggers.
- **Role-Based Access**: Specialized dashboards for Clients, Moderators, and Admins.
- **Serverless Automation**: Ready-to-deploy Next.js Cron endpoints for scheduled actions.

## Prerequisites

- Node.js (v18+)
- Supabase Project
- OpenAI API Key (Optional, see `DEMO_MODE`)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   - Open your Supabase Dashboard -> SQL Editor.
   - Run the full contents of `complete_supabase_schema.sql` to initialize the tables, enums, triggers, and sample configuration data.
   - Run the contents of `seed.sql` to populate sample users and ads for testing.

3. **Environment Configuration**
   Copy `.env.example` to `.env.local` and populate the fields:
   ```bash
   cp .env.example .env.local
   ```
   *Note: If you do not have an OpenAI API key, ensure `DEMO_MODE=true` is set.*

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:3000`.

## Vercel Deployment

1. Push your repository to GitHub.
2. Import the project in Vercel.
3. Add all the Environment Variables from your `.env.local`.
4. Ensure `CRON_SECRET` is set securely.
5. Vercel will automatically read `vercel.json` and configure the Cron Jobs.
6. Deploy!

## API Documentation
Refer to `api-docs.json` (Postman Collection) for the full list of secure endpoints.
