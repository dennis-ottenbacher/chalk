# Phase 5: Administration & Reporting [IN PROGRESS]

## 1. Admin Dashboard Overview

- **Feature**: Central hub for gym stats.
- **Implementation**:
    - Route: `/admin`.
    - **KPI Cards**: Active Members, Today's Check-ins, Revenue (Today).
    - **Sidebar**: Global navigation for all admin modules.

## 2. Product Management

- **Feature**: CRUD operations for catalog.
- **Implementation**:
    - **List View**: `/admin/products` Table with filters (Active/Inactive).
    - **Add/Edit**: Forms for Price, Name, category, Tax rate.
    - **Logic**: Server Actions `createProduct`, `updateProduct`.

## 3. Member Management

- **Feature**: CRM-lite for gym members.
- **Implementation**:
    - **Profile View**: Detailed page showing personal info and notes.
    - **History**: List of past check-ins (Visit logs).
    - **Subscription**: Manually add days/entries or cancel memberships.

## 4. Shift Planning

- **Feature**: Roster for staff.
- **Implementation**:
    - **Calendar View**: Weekly view of shifts.
    - **Assignment**: Drag-and-drop or modal to assign Staff to slots.
    - **Roles**: Distinguish between "Counter", "Route Setter", "Cleaner".

## 5. Subscription Management

- **Feature**: Financial tracking.
- **Implementation**:
    - Overview of expiring subscriptions.
    - Payment status tracking (Paid/Pending/Failed).
