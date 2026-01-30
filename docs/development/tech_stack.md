# Tech Stack Specification

This document summarizes the technical foundation of the Chalk POS system as of January 2026.

## Core Framework & Language

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (v5)
- **Runtime**: Node.js

## Frontend & UI Architecture

- **Core Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Component System**:
    - [Shadcn/UI](https://ui.shadcn.com/) (Component structure)
    - [Radix UI](https://www.radix-ui.com/) (Headless primitives for accessibility)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Typography**: Geist Sans & Geist Mono (Variable fonts)
- **Utilities**:
    - `clsx` & `tailwind-merge` (Efficient class name merging)
    - `class-variance-authority` (CVA for type-safe variants)
    - `tw-animate-css` (Animations)

## Backend & Database (Supabase)

- **Database**: PostgreSQL (Self-hosted via Docker)
- **Authentication**: Supabase Auth (GoTrue)
- **Realtime**: WebSocket-based database synchronization
- **SDKs**:
    - `@supabase/supabase-js`
    - `@supabase/ssr`

## Design System Configuration

- **Color System**: OKLCH for perceptually uniform colors across themes.
- **Theme Support**: Dark/Light mode implemented via CSS variables and Tailwind theme grounding.
- **Responsive Targets**: Mobile-first for check-in tablets and desktop-first for admin dashboards.
