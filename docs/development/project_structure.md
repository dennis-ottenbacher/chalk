# Chalk Project Structure

The Chalk POS system follows a standard Next.js directory structure with a clear separation between code and documentation.

## Directory Overview

- `/app`: Next.js App Router source files (Routes, Pages, APIs, Styles).
    - `globals.css`: Core Tailwind CSS v4 and OKLCH color definitions.
- `/components`: Reusable UI components.
    - `/ui`: shadcn/ui generated components.
- `/docs`: Non-code documentation, project specifications, and AI-related brainstorming.
    - `overview.md`: Project goals and foundation.
    - `requirements.md`: Functional and non-functional requirements.
    - `implementation_strategy.md`: Development phases and status.
    - `design_system.md`: Approved UI/UX guidelines and color tokens.
    - `tech_stack.md`: Detailed library versions and framework details.
    - `ai_agent_ideas.md`: Repository for future AI capabilities and prompts.
- `/lib`: Shared utilities and library configurations.
- `/public`: Static assets (images, icons, etc.).
- `/supabase`: Database migrations, seed data, and configuration (Docker-based self-hosting).
- `/types`: TypeScript type definitions.
- `/utils`: Helper functions.

## Documentation Standard

Non-code documentation MUST be stored in the `/docs` directory to keep the root directory clean.
Standard files to be found here:

- Feature specifications & Requirements.
- Implementation strategies & Phasing.
- Design system & UI patterns.
- Tech stack documentation.
- Brainstorming notes (e.g., AI Agent use cases).
- Architecture diagrams.
