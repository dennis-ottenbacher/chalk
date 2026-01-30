-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Create documents table
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS for documents
alter table documents enable row level security;

-- Create policy for documents (viewable by staff/admin, editable by admin)
create policy "Documents are viewable by staff and admins" on documents for
select using (
        auth.uid () in (
            select id
            from profiles
            where
                role in ('staff', 'manager', 'admin')
        )
    );

create policy "Documents are insertable by admins" on documents for
insert
with
    check (
        auth.uid () in (
            select id
            from profiles
            where
                role in ('manager', 'admin')
        )
    );

create policy "Documents are deletable by admins" on documents for delete using (
    auth.uid () in (
        select id
        from profiles
        where
            role in ('manager', 'admin')
    )
);

-- Create document_chunks table
create table if not exists document_chunks (
    id uuid primary key default gen_random_uuid (),
    document_id uuid references documents (id) on delete cascade,
    content text not null,
    embedding vector (1536), -- for text-embedding-3-small
    chunk_index integer,
    created_at timestamptz default now()
);

-- Enable RLS for chunks
alter table document_chunks enable row level security;

create policy "Chunks are viewable by staff and admins" on document_chunks for
select using (
        auth.uid () in (
            select id
            from profiles
            where
                role in ('staff', 'manager', 'admin')
        )
    );

create policy "Chunks are insertable by admins" on document_chunks for
insert
with
    check (
        auth.uid () in (
            select id
            from profiles
            where
                role in ('manager', 'admin')
        )
    );

create policy "Chunks are deletable by admins" on document_chunks for delete using (
    auth.uid () in (
        select id
        from profiles
        where
            role in ('manager', 'admin')
    )
);

-- Create index for faster similarity search
create index on document_chunks using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create a function to search for documents
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;