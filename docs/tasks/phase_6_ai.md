# Phase 6: AI Integration (Agents)

## 1. RAG Knowledge Base

- **Feature**: "Brain" for the gym processes.
- **Implementation**:
    - **Storage**: Supabase `pgvector` extension.
    - **Ingestion**: Script to process Markdown docs (Rules, Procedures) -> Embeddings.
    - **Retrieval**: Vector similarity search on query.

## 2. Staff Assistant ("Ask Chalk")

- **Feature**: Floating chat for operational questions.
- **Implementation**:
    - **UI**: Floating Button/Widget on Admin pages.
    - **Backend**: API Route `/api/chat` using Vercel AI SDK.
    - **Prompting**: System prompt with RAG context injection.

## 3. Real-time Billing Support

- **Feature**: Specialized agent for finance questions.
- **Implementation**:
    - Access to anonymized subscription data.
    - Ability to explain billing logic (e.g., "Why did X pay Y?").
    - **Safety**: Read-only access to specific tables.
