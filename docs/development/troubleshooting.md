# Database Troubleshooting Guide

This document captures specific issues encountered during the setup and expansion of the Chalk database and how they were resolved.

## Seeding & Migrations

### Issue: "Relation 'table_name' already exists"

**Symptoms**: `npx supabase db reset` fails with an error stating a table already exists.
**Cause**: This usually happens when a table is defined in multiple migration files or if a table was created manually/via seed file and the reset process encounters a naming conflict.
**Resolution**:

1. Check all files in `supabase/migrations/` for duplicate `CREATE TABLE` statements.
2. Consolidate related schema changes into a single migration file or ensure chronological order.
3. Use `npx supabase db reset` to ensure a clean state.

### Issue: "Invalid input syntax for type uuid" (SQLSTATE 22P02)

**Symptoms**: Seeding fails when inserting IDs like `'t1'`, `'t2'`, or `'user_1'`.
**Cause**: PostgreSQL columns defined with the `UUID` type (very common in Supabase/Postgres) strictly require a valid UUID format. Strings or short identifiers are rejected.
**Resolution**: Use valid UUID strings in `seed.sql`.

- Example of valid seed UUIDs:
    - `'00000000-0000-0000-0000-000000000001'`
    - `'00000000-0000-0000-0000-000000000002'`

### Issue: Seeding Tables Defined inside `seed.sql`

**Symptoms**: `ERROR: column "..." of relation "..." does not exist` or `relation "..." does not exist`.
**Cause**: The Supabase `db reset` command applies migrations _before_ running `seed.sql`. If you try to `CREATE TABLE` inside `seed.sql`, the sequence might break or logical dependencies (like RLS or composite types) might not be fully initialized.
**Resolution**: **ALWAYS** define table structures, types, and RLS policies in `supabase/migrations/`. Use `supabase/seed.sql` **ONLY** for `INSERT` statements.

### Issue: "Insert or update on table 'profiles' violates foreign key constraint"

**Symptoms**: Seeding fails with `violates foreign key constraint "profiles_id_fkey"`.
**Cause**: The `profiles` table has a foreign key referencing `auth.users`. When seeding `profiles` directly, the corresponding user must exist in the `auth.users` table first.
**Resolution**: Mock entries in `auth.users` at the beginning of `seed.sql`.

- Example SQL for `seed.sql`:

    ```sql
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
    VALUES ('00000000-0000-0000-0000-000000000001', 'admin@chalk.app', 'hashed_pass', NOW());

    INSERT INTO public.profiles (id, first_name, last_name, role)
    VALUES ('00000000-0000-0000-0000-000000000001', 'Dennis', 'Ottenbacher', 'admin');
    ```

## Next.js & Server Actions

### Issue: Syntax Errors breaking the Page

**Symptoms**: The page fails to load or shows a "Next.js internal error" in the browser.
**Cause**: Often due to missing or extra closing tags (`</div>`) in JSX/TSX files or syntax errors in Server Actions.
**Resolution**: Check the terminal running `npm run dev`. It usually provides the exact line number of the syntax error. In one instance, an extra `</div>` at the end of `app/checkin/page.tsx` prevented the page from rendering.

### Issue: Unexpected "Server Not Found" or Connection Errors

**Symptoms**: The page is not accessible on `http://localhost:3000`.
**Cause**: If multiple development servers or Docker containers (e.g., Shopware) are running, port 3000 might be occupied. Next.js automatically fails over to `3001` or higher.
**Resolution**: Check the terminal output for the correct URL. Use `http://localhost:3001` if necessary.

### Issue: Build or Runtime Error: Unescaped Apostrophes

**Symptoms**: `Error: ' can be escaped with &apos;, ...` or similar JSX parsing errors.
**Cause**: Next.js/ESLint requires special characters like `'` or `"` to be escaped in JSX strings (e.g., `Today's Check-ins`).
**Resolution**: Use HTML entities:

- Change `'` to `&apos;` (e.g., `Today&apos;s`).
- Or wrap the text in a string literal within braces: `{ "Today's Check-ins" }`.

### Issue: 404 Error when accessing Admin Routes

**Symptoms**: Accessing `http://localhost:3001/admin` results in a 404 Error.
**Cause**: The `AdminLayout` (`app/admin/layout.tsx`) contains an authentication check that redirects unauthenticated users to `/login`. If the `/login` route has not been implemented yet, Next.js returns a 404.
**Resolution**:

1. Implement the `/login` route.
2. Temporarily disable the redirect in `AdminLayout` for development if authentication is not yet handled.

## Row Level Security (RLS)

### Issue: "Access Denied" or Empty Results despite Data Presence

**Symptoms**: Dashboard shows 0 check-ins or the `checkInUser` action fails to insert logs, even when database records exist.
**Cause**: Supabase "denies by default". If a table has RLS enabled but no policies defined, all queries (except from service role) will return empty results or fail. During early development without auth, public access policies are often missing.
**Resolution**: Define a public policy for the affected table.

- Example for `checkins`:
    ```sql
    CREATE POLICY "Public Access" ON public.checkins FOR ALL USING (true);
    ```

## Database Schema Consistency

### Issue: No data or "Column not found" in Admin Dashboard

**Symptoms**: Dashboard shows 0 or throws a SQL error.
**Cause**: Mismatch between expected column names in the view and the actual database schema (e.g., querying `status` when the schema uses `is_active`).
**Resolution**: Ensure queries in `.eq()` or `.select()` calls exactly match the migration files (`20260128000000_initial_schema.sql`).
