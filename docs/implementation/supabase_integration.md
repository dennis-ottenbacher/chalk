# Supabase Integration Utilities

To facilitate seamless communication with the self-hosted Supabase instance, the project uses standardized utility functions located in `utils/supabase/`.

## Server Client (`utils/supabase/server.ts`)

Used in Server Components, Server Actions, and Route Handlers.

### Features:

- **SSR Support**: Uses `@supabase/ssr` to manage session cookies.
- **Permission Handling**: Correctly handles cookie storage across different server-side contexts.
- **Dynamic Context**: Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from environment variables.

## Browser Client (`utils/supabase/client.ts`)

Used in Client Components.

### Features:

- Lightweight client for client-side interactions and Realtime subscriptions.
- Initialized with the same public environment variables.

## Environment Configuration

The application requires the following keys in `.env.local`, which are retrieved from `npx supabase status`:

- `NEXT_PUBLIC_SUPABASE_URL`: The API Gateway URL (default `http://127.0.0.1:54321`).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The public anonymous key for client-side access.
