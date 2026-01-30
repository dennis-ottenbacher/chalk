# Testing & Verification

As the project is in early development with a high rate of change, testing is currently focused on manual verification of core flows and database integrity.

## Manual Verification Flows

### 1. Database Schema & Integrity

- **Reset/Apply Migrations**:
    - Command: `npx supabase db reset`
    - Check: Table existence (`profiles`, `products`, `tariffs`, `checkins`, `waivers`, `subscriptions`, `shifts`) in the local Supabase dashboard.
- **Type Generation**:
    - Command: `npx supabase gen types typescript --local > types/database.types.ts`
    - Check: `database.types.ts` contains interfaces for the new tables.

### 2. Admin Authentication & RBAC (Role-Based Access Control)

- **Login Flow**:
    - Ensure user can sign in.
- **Unauthorized Access**:
    - Sign in as a user with `role = 'customer'`.
    - Attempt to navigate to `/admin`.
    - **Expected**: Redirect to `/` (home) or access denied.
- **Authorized Access**:
    - Manually set a user's role to `admin` or `staff` in the `profiles` table.
    - Navigate to `/admin`.
    - **Expected**: Dashboard and sidebar should be visible.

### 3. Feature Verification

- **Product Management**:
    - Navigate to `/admin/products`.
    - Create/Edit a product.
    - Verify entry exists in `products` table.
- **Member Detail View**:
    - View list of members at `/admin/members`.
    - Select a member to view their check-in history and subscription status.
- **Check-in System**:
    - Use the `/checkin` interface.
    - **Scanner Focus Verification**: Click anywhere outside the input field; verify focus returns within 100ms.
    - **Full-Screen Logic**: Verify the status card spans the whole width and is clearly legible from 2-3 meters away.
    - **Test Codes**:
        - Input `123` -> Success (Green).
        - Input `expired` -> Rejected (Red).
        - Input `10er` -> Success with remaining count displayed.
    - **DB Check**: Verify a new row is created in the `checkins` table (for valid users) with the correct `user_id` and `timestamp`.
