-- Migration: Update match_documents function for multi-tenancy support
-- Purpose: Add organization_id filtering to the vector search function

-- Drop the old function to avoid confusion (optional but cleaner)
DROP FUNCTION IF EXISTS match_documents (vector, float, int);

-- Create the updated function with org_id param
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  org_id uuid
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  AND document_chunks.organization_id = org_id
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;