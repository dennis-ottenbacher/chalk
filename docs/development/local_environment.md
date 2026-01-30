# Local Development Environment

## Project Setup

The project is located at `/Users/dennisottenbacher/Development/Chalk`.
It is a Next.js (App Router) project with a self-hosted Supabase backend running in Docker.

## Local Backend (Supabase)

Supabase is used for database (PostgreSQL), Auth, and Realtime features. It runs locally using Docker.

### Key Commands

- **Start Backend**: `npx supabase start` (must be run from project root)
- **Stop Backend**: `npx supabase stop`
- **Database Migrations**: `npx supabase migration up`
- **Generate Types**: `npx supabase gen types typescript --local > types/database.types.ts`
- **Check Status**: `npx supabase status`
- **Reset Database**: `npx supabase db reset` (Warning: wipes data)

## Backend Utilities

- **Client Supabase**: `utils/supabase/client.ts`
- **Server Supabase**: `utils/supabase/server.ts`

## Frontend

- **Framework**: Next.js
- **UI**: Shadcn UI + Tailwind CSS (v4)
- **Development Server**: `npm run dev`
- **Port Management**: The application typically runs on `http://localhost:3000`. However, if port 3000 is occupied (e.g., by existing Docker services like Shopware), Next.js will automatically failover to `http://localhost:3001`.

## Database Migrations

New database changes should be created as migrations in `supabase/migrations/`.

- `20260128000000_initial_schema.sql`: Consolidated core schema including Profiles, Products, Tariffs, Subscriptions, Checkins, and Waivers.

## Data Seeding

Local test data is managed via `supabase/seed.sql`.

- **Apply Seed**: Run `npx supabase db reset`. This command drops the local schema, reapplies all migrations, and then runs the seed script.
- **Constraints**:
    - Tables must be defined in migration files, not in `seed.sql`.
    - Columns defined as `UUID` require valid UUID strings (e.g., `'00000000-0000-0000-0000-000000000001'`). Sequential IDs like `'t1'` will cause a syntax error (`22P02`).
    - **Foreign Keys**: If seeding tables that reference `auth.users` (like `profiles`), you must manually insert dummy users into the `auth.users` table at the start of your seed script to satisfy foreign key constraints.
