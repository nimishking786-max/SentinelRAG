-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enums
CREATE TYPE user_role AS ENUM ('ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER', 'EMPLOYEE');
CREATE TYPE document_sensitivity AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED');
CREATE TYPE document_department AS ENUM ('GENERAL', 'HR', 'FINANCE', 'SALES', 'RESEARCH', 'ADMIN');

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'EMPLOYEE',
    department document_department DEFAULT 'GENERAL',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Documents table
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    department document_department DEFAULT 'GENERAL',
    sensitivity document_sensitivity DEFAULT 'INTERNAL',
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Document permissions (For user-specific overrides, though RBAC handles most)
CREATE TABLE public.document_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    role user_role, -- If null, applies to specific user
    user_id UUID REFERENCES public.profiles(id),
    permission_type TEXT DEFAULT 'READ',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Document chunks (Vector store)
CREATE TABLE public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536), -- Assuming OpenAI text-embedding-3-small
    page_number INTEGER,
    source_type TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Index for vector search (HNSW for better recall)
CREATE INDEX on public.document_chunks USING hnsw (embedding vector_cosine_ops);

-- Conversations
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Messages
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    citations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Audit logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    status TEXT NOT NULL, -- 'SUCCESS', 'DENIED', 'ERROR'
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Security events
CREATE TABLE public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    description TEXT NOT NULL,
    document_id UUID REFERENCES public.documents(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Note: Row Level Security (RLS) policies will be enforced at the API layer for simplicity,
-- but we enable RLS on these tables as a best practice, with service_role bypass.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Allow service_role to access all (FastAPI will use service_role and apply logic)
CREATE POLICY "Service Role All Access Profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Service Role All Access Documents" ON public.documents FOR ALL USING (true);
CREATE POLICY "Service Role All Access Chunks" ON public.document_chunks FOR ALL USING (true);

-- RPC Function for secure vector similarity search
CREATE OR REPLACE FUNCTION public.search_chunks(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    allowed_doc_ids uuid[]
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    chunk_index int,
    content text,
    page_number int,
    source_type text,
    similarity float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        c.id,
        c.document_id,
        c.chunk_index,
        c.content,
        c.page_number,
        c.source_type,
        1 - (c.embedding <=> query_embedding) as similarity
    FROM public.document_chunks c
    WHERE c.document_id = ANY(allowed_doc_ids)
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
$$;
