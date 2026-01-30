# Chalk - Boulder Gym POS Overview

## Project Description

"Chalk" is a specialized Point of Sale (POS) system designed for the unique requirements of boulder gyms. It combines standard retail POS functionality with industry-specific management tools.

## Key Goals

- **Efficiency**: Fast check-in flows (Fast Lane) to reduce queues.
- **Compliance**: Legal requirements (TSE) for German tax law.
- **Integrated Management**: Handling members, courses, rental equipment, and staff planning in one system.
- **Connectivity**: Integration with existing competition platforms.

## Technical Foundation

### Why the Supabase + Next.js Stack?

- **Realtime capabilities**: Essential for the live check-in dashboard. Supabase provides WebSocket-based synchronization "out of the box," allowing staff to see current visitor counts and status changes instantly.
- **Authentication & Backend Efficiency**: Built-in Auth service (GoTrue) and auto-generated REST/GraphQL APIs significantly reduce boilerplate code, allowing focus on boulder-specific logic (e.g., subscription rules).
- **Type Safety**: Automatic TypeScript generation from the PostgreSQL schema ensures a robust connection between the database and the Next.js frontend.
- **AI-Ready Infrastructure**: Supabase's `pgvector` support allows for high-performance retrieval-augmented generation (RAG) to power staff-facing AI assistants and process automation.
- **Data Sovereignty & Cost**: By using the open-source Supabase stack, the system can be self-hosted via **Docker** on local hardware. This ensures zero license costs and keeps sensitive customer data (waivers, personal info) within the gym's own infrastructure.

### Technology Stack

- **Frontend**: **Next.js** (React) with PWA capabilities for cross-device compatibility (Tablet, Mobile, Desktop).
- **Backend/Database**: **Supabase** (PostgreSQL) with `pgvector` for Auth, Realtime, and AI storage.
- **Styling**: **TailwindCSS** + **Shadcn UI** for a professional, responsive interface.
- **AI Integration**: **Vercel AI SDK** and LLM integration for staff-facing assistants.
- **Deployment**: **Docker** Compose for production and local development.
