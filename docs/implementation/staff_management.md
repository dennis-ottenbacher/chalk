# Staff Management Implementation

## Overview

The Staff Management module allows administrators to view all gym employees and administrators. It is accessible via the `/admin/staff` route.

## Implementation Details

Implemented as a Next.js Server Component that fetches data directly from Supabase.

- **Route**: `app/admin/staff/page.tsx`
- **Data Source**: `profiles` table.
- **Query**:
    ```typescript
    const { data: staffMembers } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'staff'])
        .order('role', { ascending: true }) // admin comes before staff
        .order('last_name', { ascending: true })
    ```

## Features

- **Staff List**: A comprehensive list of all users with `admin` or `staff` roles.
- **Role Badges**: Uses Shadcn UI Badge component to distinguish between `admin` (default) and `staff` (secondary).
- **Profile Integration**: Displays employee avatars (with fallback to initials), full names, and member IDs.
- **Navigation**: Integrated into the `AdminLayout` sidebar with the `UserCog` icon.

## UI Components Used

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Table` (Standard HTML table with Tailwind styling)
- `Avatar`, `AvatarImage`, `AvatarFallback`
- `Badge` (from Shadcn UI)
