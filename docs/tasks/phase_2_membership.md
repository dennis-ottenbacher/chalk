# Phase 2: User & Membership Management

## 1. Authentication Flows

- **Feature**: Secure login for Staff and Members.
- **Implementation**:
    - Use Supabase Auth (GoTrue).
    - Implement Login Page (`/login`) with Email/Password.
    - **Staff/Admin**: Protected routes via Middleware or RLS policies.
    - **Members**: Public facing portal (future scope).

## 2. Member Registration

- **Feature**: Interface to add new gym members.
- **Implementation**:
    - Create `MemberForm` component using `react-hook-form` and `zod` validation.
    - Server Action `createMember` to insert into `profiles` table.

## 3. Waiver Management

- **Feature**: Liability waiver tracking `waiver_signed`.
- **Implementation**:
    - Add boolean/timestamp field to `profiles`.
    - UI switch/checkbox in Member Profile to toggle waiver status.
    - Block check-in if waiver is missing (logic in Phase 3).

## 4. Subscription Logic

- **Feature**: Manage access rights (Time-based vs. Entry-based).
- **Implementation**:
    - **Schema**: `subscriptions` table linked to `profiles/products`.
    - **Logic**:
        - _Time-based_: `start_date` and `end_date`.
        - _Entry-based_: `remaining_entries` integer (decrement on check-in).
    - **Status**: Computed field or boolean `is_active` based on dates/entries.
