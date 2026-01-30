# 🧗 Chalk Project ToDo List

## Phase 1: Foundation & Setup [Details](./tasks/phase_1_foundation.md)

- [x] Project Bootstrapping (Next.js, React, Supabase)
- [x] UI Framework Setup (Tailwind v4, shadcn-ui)
- [x] Local Database & Docker Setup
- [x] Database Typing (`database.types.ts`)

## Phase 2: User & Membership Management [Details](./tasks/phase_2_membership.md)

- [ ] Implement Authentication Flows (Staff/Member login)
- [ ] Create Member Registration Forms
- [ ] Implement Waiver Management System
- [ ] Develop Subscription Logic & Tracking

## Phase 3: Fast Lane Check-in (Core Feature) [Details](./tasks/phase_3_checkin.md)

- [x] QR-code Scanner Interface (`app/checkin/page.tsx`)
- [x] Visual Status Dashboard (Green/Red feedback)
- [x] Server-side Check-in Logic (`app/actions/checkin.ts`)

## Phase 4: POS & Checkout [Details](./tasks/phase_4_pos.md)

- [ ] Build Product Grid Interface
- [ ] Implement Shopping Cart State
- [ ] Develop Checkout Flow (Cash/Card/SEPA)
- [ ] Generate Receipts (PDF/Print)

## Phase 5: Administration & Reporting [Details](./tasks/phase_5_admin.md) [IN PROGRESS]

- [ ] **Admin Dashboard**: Sidebar & Overview Stats
- [ ] **Product Management**: List, Add, Edit Products
- [ ] **Member Management**:
    - [ ] Profile View
    - [ ] Check-in History
    - [ ] Waiver Status
- [ ] **Shift Planning**: Roster Management
- [ ] **Subscription Management**: Payment Tracking

## Phase 6: AI Integration (Agents) [Details](./tasks/phase_6_ai.md)

- [ ] Setup RAG Knowledge Base for Staff Docs
- [ ] Build Floating Chat Interface
- [ ] Implement Real-time Billing Support Agent
