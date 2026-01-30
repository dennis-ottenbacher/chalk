-- Add organization_id to knowledge base tables
-- This migration adds organization_id to documents and document_chunks for multi-tenancy support

-- 1. Add organization_id to documents
ALTER TABLE documents
ADD COLUMN organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE;

-- 2. Add organization_id to document_chunks
ALTER TABLE document_chunks
ADD COLUMN organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE;

-- 3. Create indexes for performance
CREATE INDEX idx_documents_organization_id ON documents (organization_id);

CREATE INDEX idx_document_chunks_organization_id ON document_chunks (organization_id);

-- 4. Drop old RLS policies
DROP POLICY IF EXISTS "Documents are viewable by staff and admins" ON documents;

DROP POLICY IF EXISTS "Documents are insertable by admins" ON documents;

DROP POLICY IF EXISTS "Documents are deletable by admins" ON documents;

DROP POLICY IF EXISTS "Chunks are viewable by staff and admins" ON document_chunks;

DROP POLICY IF EXISTS "Chunks are insertable by admins" ON document_chunks;

DROP POLICY IF EXISTS "Chunks are deletable by admins" ON document_chunks;

-- 5. Create new organization-aware RLS policies for documents
CREATE POLICY "Documents are viewable by organization staff and admins" ON documents FOR
SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
                AND role IN ('staff', 'manager', 'admin')
        )
    );

CREATE POLICY "Documents are insertable by organization admins" ON documents FOR
INSERT
WITH
    CHECK (
        organization_id IN (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
                AND role IN ('manager', 'admin')
        )
    );

CREATE POLICY "Documents are updatable by organization admins" ON documents FOR
UPDATE USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('manager', 'admin')
    )
);

CREATE POLICY "Documents are deletable by organization admins" ON documents FOR DELETE USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('manager', 'admin')
    )
);

-- 6. Create new organization-aware RLS policies for document_chunks
CREATE POLICY "Chunks are viewable by organization staff and admins" ON document_chunks FOR
SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
                AND role IN ('staff', 'manager', 'admin')
        )
    );

CREATE POLICY "Chunks are insertable by organization admins" ON document_chunks FOR
INSERT
WITH
    CHECK (
        organization_id IN (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
                AND role IN ('manager', 'admin')
        )
    );

CREATE POLICY "Chunks are updatable by organization admins" ON document_chunks FOR
UPDATE USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('manager', 'admin')
    )
);

CREATE POLICY "Chunks are deletable by organization admins" ON document_chunks FOR DELETE USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('manager', 'admin')
    )
);

-- 7. Update match_documents function to be organization-aware
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
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  FROM document_chunks
  WHERE 
    document_chunks.organization_id = org_id
    AND 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;