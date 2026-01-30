# Initial Database Schema

The Chalk POS system uses Supabase (PostgreSQL) for its backend. The following tables and types form the core of the system's data management.

## Custom Types

- **user_role**: `admin`, `staff`, `manager`, `member`, `athlete`
- **product_type**: `goods`, `entry`, `rental`, `voucher`
- **checkin_status**: `valid`, `invalid`, `pending`
- **subscription_status**: `active`, `paused`, `cancelled`, `expired`
- **shift_status**: `draft`, `published`, `cancelled`

## Core Tables

> [!IMPORTANT]
> **ID Types**: All `id` columns use the `UUID` type. For local development seeding, valid UUID strings (e.g., `'00000000-0000-0000-0000-000000000001'`) must be used. Sequential strings like `'t1'` will cause database errors.

### profiles

Extends the internal `auth.users` table to store application-specific user data.

- `id`: UUID (Primary Key, references `auth.users`)
- `first_name`: Text
- `last_name`: Text
- `role`: user_role (Default: `member`)
- `member_id`: Text (Unique, used for cards/QR codes)
- `birth_date`: Date (Nullable)

- `created_at`: Timestamptz
- `updated_at`: Timestamptz

### products

Stores items available for sale in the POS, including Goods, Entry Passes, and Subscription Plans.

- `id`: UUID (Primary Key)
- `name`: Text
- `description`: Text
- `price`: Decimal (10, 2)
- `tax_rate`: Decimal (5, 2) (Default: `19.00`)
- `type`: product_type (`goods`, `entry`, `rental`, `voucher`, `plan`)
- `duration_months`: Integer (Nullable, for Plans)
- `credits_amount`: Integer (Nullable, for 10-packs like '11er Karte')
- `recurring_interval`: Text (Nullable, e.g. 'month', 'year')
- `active`: Boolean (Default: `true`)

### checkins

Logs every entry into the gym for tracking and validation.

- `id`: UUID (Primary Key)
- `user_id`: UUID (References `profiles`)
- `timestamp`: Timestamptz
- `status`: checkin_status
- `processed_by`: UUID (References `profiles`, denotes the staff member who scanned)
- `location_id`: Text (e.g., 'front_desk_1')

### waivers [PLANNED]

Digital disclaimers signed by users.

- `id`: UUID (Primary Key)
- `user_id`: UUID (References `profiles`)
- `signed_at`: Timestamptz
- `version`: Text (e.g. "v1.0")
- `pdf_url`: Text (Link to stored PDF)

### subscriptions

Tracks user memberships and recurring payments.

- `id`: UUID (Primary Key)
- `user_id`: UUID (References `profiles`)
- `product_id`: UUID (References `products`)
- `start_date`: Timestamptz
- `end_date`: Timestamptz (Nullable for indefinite)
- `remaining_entries`: Integer (Used for 10-packs and similar credits)
- `is_active`: Boolean (Default: `true`)

### shifts

Staff roster and shift planning.

- `id`: UUID (Primary Key)
- `staff_id`: UUID (References `profiles`, Nullable for "Open Shifts")
- `start_time`: Timestamptz
- `end_time`: Timestamptz
- `role`: Text (e.g. "Counter", "Trainer")
- `status`: shift_status (`draft`, `published`, `cancelled`)
- `notes`: Text

### shift_templates

Templates for recurring shifts (e.g. for generating a weekly schedule).

- `id`: UUID (Primary Key)
- `day_of_week`: Integer (0=Sunday, 1=Monday, ..., 6=Saturday)
- `start_time`: Time (e.g. `08:00:00`)
- `end_time`: Time (e.g. `14:00:00`)
- `role`: Text (e.g. "Counter")

### role_permissions

Stores dynamic access control rules for the frontend matrix.

- `id`: UUID (Primary Key)
- `role`: user_role (Enum)
- `permission_key`: Text (e.g., 'products.manage')
- `access_level`: Text ('true', 'false', 'own')
- `created_at`: Timestamptz

## Row Level Security (RLS)

The following policies are implemented to ensure data privacy:

- **Profiles**: Viewable by everyone; updates restricted to the account owner or staff/manager/admin.
- **Products**: Publicly viewable (for shop and POS catalog access).
- **Checkins**: Viewable and insertable by everyone (for the Fast Lane scanner), as initially configured for development ease. Further refinements planned for production.
- **Waivers**: Viewable by the owner or staff/manager/admin.
- **Subscriptions**: Viewable by the owner or staff/manager/admin.
- **Shifts**: Viewable by staff/manager/admin; editable only by admin/manager.

## PostgreSQL Extensions

- **pgvector**: Enabled for AI-powered features, allowing storage and search of high-dimensional vector embeddings for staff knowledge bases and automation tasks.
