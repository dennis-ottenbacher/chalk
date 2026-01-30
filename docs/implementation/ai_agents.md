# AI Agent Integration

Chalk integrates AI agents to support staff and improve operational efficiency. The integration leverages modern AI engineering patterns within the existing Next.js and Supabase stack.

## Architecture

The AI features follow the **RAG (Retrieval Augmented Generation)** pattern:

1.  **Vector Storage**: Use Supabase's `pgvector` extension to store document embeddings.
2.  **Embeddings**: Process internal process handbooks, FAQs, and gym rules into high-dimensional vectors.
3.  **Retrieval**: When a query is made, find the most relevant context from the vector database.
4.  **Generation**: Feed the context and query to a Large Language Model (LLM) for a grounded response.

## Core Components

- **API Endpoint**: `/app/api/chat/route.ts` - Handles streaming completions using the [Vercel AI SDK](https://sdk.vercel.ai/).
- **Embedding Logic**: `lib/ai/embeddings.ts` - Utilities for interacting with embedding models and Supabase vector stores.
- **Assistant UI**: `components/ai-assistant.tsx` - A floating chat interface available to staff members on all administrative pages.

## Use Cases

### Staff Process Support ("Ask Chalk")

Staff can ask questions about gym procedures or troubleshooting:

- "The coffee machine is empty, what should I do?" -> Agent: "Call contact XY or check the refill procedure in the manual."
- "How do I process a refund for a 10-pack?"
- "What is the policy for minors checking in without parents?"

### Data Management for Lead Staff

Managers can interact with data via chat:

- "Here is a CSV file with the newest products. Import them."
- "Show me an overview of all active subscriptions."

### Automated Content Creation

The agent can assist in generating simple assets:

- "Create a landing page for our new product." -> Agent generates HTML/CSS code or provides a preview.

## Tech Stack Compliance

The chosen tools ensure data privacy and performance:

- **Supabase pgvector**: Keeps data within the same self-hosted database cluster.
- **Edge Runtime**: Next.js API routes run on the edge for low latency.
- **Streaming**: React Server Components and streaming ensure immediate feedback to the user.
