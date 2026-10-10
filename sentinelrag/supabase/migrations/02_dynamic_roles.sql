-- Dynamic roles and administrator-created members.
-- This migration is intentionally idempotent so it can be run safely in Supabase SQL Editor.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
    ALTER COLUMN role DROP DEFAULT;

ALTER TABLE public.profiles
    ALTER COLUMN role TYPE TEXT USING role::text;

ALTER TABLE public.profiles
    ALTER COLUMN role SET DEFAULT 'EMPLOYEE';

ALTER TABLE public.document_permissions
    ALTER COLUMN role TYPE TEXT USING role::text;

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc', now())
);

INSERT INTO public.roles (name, description) VALUES
    ('ADMIN', 'Full platform administration'),
    ('HR_MANAGER', 'Human resources management'),
    ('FINANCE_MANAGER', 'Finance management'),
    ('EMPLOYEE', 'Standard employee access')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service Role All Access Roles" ON public.roles;
CREATE POLICY "Service Role All Access Roles"
    ON public.roles FOR ALL USING (true) WITH CHECK (true);
