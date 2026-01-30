# Admin Dashboard Implementation (Phase 5)

The Admin Dashboard is the central management interface for gym staff and administrators. It is located under the `/admin` route and uses Next.js App Router features (Server Components, Server Actions).

## Routing & Layout

- **Base Route**: `/admin`
- **Layout**: `app/admin/layout.tsx`
    - Implements a global sidebar for navigation.
    - **Authorization**: Server-side check ensures the user has `role IN ('admin', 'staff')`. Redirects unauthorized customers to home.
    - **Navigation Items**: Dashboard, Members, Products, Shifts, Staff, Tariffs.

## Implemented Modules

### 1. Overview Dashboard (`app/admin/page.tsx`)

- Displays real-time KPIs using server-side fetching from Supabase:
    - **Active Members**: Count of subscriptions where `is_active = true` (corrected from initial `status = 'active'` attempt to match schema).
    - **Today's Check-ins**: Count of entries in the `checkins` table since midnight.
    - **Active Products**: Count of items in the `products` table where `active = true`.

### 2. Security & Access

- **Authentication**: Redirects to `/login` if no user session is found.
    - **Development Note**: As of 28.01.2026, the `/login` route is not yet implemented. This causes a 404 error when attempting to access `/admin`.
    - **Workaround**: The authentication check in `app/admin/layout.tsx` is temporarily commented out for local development.
- **RLS Requirements**: Since the dashboard is server-side rendered without a shared "Admin" auth session in early dev, the database tables (`subscriptions`, `checkins`, `products`) must have permissive RLS policies for the dashboard to display counts correctly.

### 2. Product Management (`app/admin/products/`)

- **Product List** (`page.tsx`): Displays all products in a table with filtering by status and type.
- **Add Product** (`new/page.tsx`): Form to create new products.
- **Edit Product** (`[id]/page.tsx`): Form to modify existing products.
- **Server Actions** (`app/actions/products.ts`):
    - `createProduct`: Handles insertion of new product data.
    - `updateProduct`: Handles updates to existing records.

### 3. Staff Management (`/admin/staff`)

- Management of employee profiles and roles.
- Overview of all users with `admin` or `staff` status.
- Integrated into the global admin sidebar.

## Planned Modules

### 4. Member Management (`/admin/members`)

## Backend Integration

- **Database**: Leverages Supabase RLS policies to restrict non-staff access at the data level.
- **Server Actions**: Used for CRUD operations to ensure type-safety and server-side validation.

### 4. Permissions Management (`/admin/permissions`)

- **Interactive Matrix** (`page.tsx` + `permission-matrix.tsx`):
    - Visualizes capabilities (Create/Read/Update/Delete) across all system roles.
    - Allows dynamic updating of permissions via the `role_permissions` table.
    - Uses optimistic UI updates for instant feedback.
- **Backend Enforcements**:
    - **RLS**: The database `role_permissions` table is protected so only admins can modify it.
    - **Server Action**: `updatePermission` validates the requestor is an admin before saving changes.
