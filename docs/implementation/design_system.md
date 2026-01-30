# Chalk Design System & UI Guidelines

> [!IMPORTANT]
> **Status:** APPROVED (28.01.2026).
> These guidelines are binding for all future UI development.

## 1. Core Philosophy

"Chalk" uses a **Clean & Modern Utility-First Design**.
The focus is on maximum readability (High Contrast) for gym staff and rapid processing of status information (Check-in Traffic Light System).

## 2. Tech Stack & Libraries

- **CSS Framework:** [TailwindCSS v4](https://tailwindcss.com) (using `@import "tailwindcss";`)
- **Component Library:** [Shadcn UI](https://ui.shadcn.com) (`new-york` style, `neutral` base color)
- **Icons:** [Lucide React](https://lucide.dev)
- **Fonts:** `Geist Sans` / `Geist Mono` (Next.js defaults via CSS variables)
- **Color System:** [OKLCH](https://oklch.com/) for modern browser support and better perceptual uniformity. Primary technical definitions are in `app/globals.css`.

## 3. Layout Standards

### A. Admin Dashboard (`/app/admin`)

- **Structure:** Sidebar navigation (Links, fixed width 64/256px) + Main Content Area (scrollable).
- **Theme:**
    - _Sidebar:_ White (Light) / Neutral-800 (Dark).
    - _Background:_ Neutral-100 (Light) / Neutral-900 (Dark).
- **Widgets:** Information grouped in **Cards** (`<Card>`, `<CardHeader>`, `<CardContent>`).

### B. Check-in / POS (`/app/checkin`, `/app/pos`)

- **Structure:** Full-Screen / Immersive Mode. No sidebar.
- **Focus:** Input fields use Auto-Focus. Status messages occupy >50% of the screen.
- **Indicators:** Large, colored areas for quick visual confirmation from a distance.

## 4. Technical Color Definitions (OKLCH)

The project uses semantic CSS variables defined in `@theme inline` (Tailwind v4).

### Base & Semantic Tokens

- **Background/Foreground:** `var(--background)`, `var(--foreground)`
- **Core Semantic:** `var(--primary)`, `var(--secondary)`, `var(--accent)`, `var(--muted)`, `var(--destructive)` (with `*-foreground` counterparts).
- **Other UI:** `var(--border)`, `var(--input)`, `var(--ring)`.

### Sidebar-Specific Tokens

- `var(--sidebar)`, `var(--sidebar-foreground)`
- `var(--sidebar-primary)`, `var(--sidebar-primary-foreground)`
- `var(--sidebar-accent)`, `var(--sidebar-accent-foreground)`
- `var(--sidebar-border)`, `var(--sidebar-ring)`

### Charting

- `var(--chart-1)` through `var(--chart-5)`

## 5. Semantic Colors (Status)

| Status      | Tailwind Class                      | Usage                                                |
| :---------- | :---------------------------------- | :--------------------------------------------------- |
| **Success** | `bg-green-100` / `text-green-600`   | Valid Check-in, Active Subscription, Payment Success |
| **Error**   | `bg-red-100` / `text-red-600`       | Invalid Entry, Payment Failed, Expired Sub           |
| **Warning** | `bg-yellow-100` / `text-yellow-600` | Loading State, Pending Action                        |
| **Neutral** | `bg-white` / `text-neutral-900`     | Standard Content                                     |

## 6. UI Patterns

### Action Feedback (Optimistic UI)

Every action (Scan, Click) must provide **immediate** visual feedback (< 100ms), even before the server responds.

- _Example:_ Scanner input is immediately disabled and a badge changes to "Processing...".

### Styling Best Practices

- **Utility-First:** Use Tailwind classes exclusively.
- **Semantic Variables:** **Do not** hardcode hex or OKLCH values in components; always use the semantic variable names (e.g., `bg-primary`, `text-muted-foreground`).
- **Conditional Merging:** Use the `cn()` utility (clsx + tailwind-merge) for conditional classes.

### Mobile / Touch Targets

Optimized for tablet use:

- Buttons: Min-Height 44px.
- Inputs: Font-Size 16px (prevents iOS auto-zoom).
- Padding: Generous touch areas (p-4).
