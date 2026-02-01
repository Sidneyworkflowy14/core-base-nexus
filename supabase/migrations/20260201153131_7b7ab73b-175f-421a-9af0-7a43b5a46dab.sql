-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('superadmin', 'tenant_admin', 'tenant_user');

-- Create tenants table
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create memberships table (user belongs to tenant with a role)
CREATE TABLE public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'tenant_user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, user_id)
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    metadata_json JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_memberships_tenant_id ON public.memberships(tenant_id);
CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.memberships
        WHERE user_id = _user_id AND role = 'superadmin'
    )
$$;

-- Security definer function to check if user has role in tenant
CREATE OR REPLACE FUNCTION public.has_tenant_role(_user_id UUID, _tenant_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.memberships
        WHERE user_id = _user_id 
          AND tenant_id = _tenant_id 
          AND role = _role
    )
$$;

-- Security definer function to check if user is member of tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.memberships
        WHERE user_id = _user_id AND tenant_id = _tenant_id
    )
$$;

-- Security definer function to check if user is tenant_admin or superadmin
CREATE OR REPLACE FUNCTION public.is_tenant_admin_or_above(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.memberships
        WHERE user_id = _user_id 
          AND (
              role = 'superadmin' 
              OR (tenant_id = _tenant_id AND role = 'tenant_admin')
          )
    )
$$;

-- Function to get user's tenants
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT tenant_id FROM public.memberships WHERE user_id = _user_id
$$;

-- RLS Policies for tenants table
CREATE POLICY "Users can view their tenants"
ON public.tenants FOR SELECT
TO authenticated
USING (
    public.is_superadmin(auth.uid()) 
    OR id IN (SELECT public.get_user_tenant_ids(auth.uid()))
);

CREATE POLICY "Superadmins can insert tenants"
ON public.tenants FOR INSERT
TO authenticated
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can update tenants"
ON public.tenants FOR UPDATE
TO authenticated
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can delete tenants"
ON public.tenants FOR DELETE
TO authenticated
USING (public.is_superadmin(auth.uid()));

-- RLS Policies for memberships table
CREATE POLICY "Users can view memberships of their tenants"
ON public.memberships FOR SELECT
TO authenticated
USING (
    public.is_superadmin(auth.uid())
    OR tenant_id IN (SELECT public.get_user_tenant_ids(auth.uid()))
);

CREATE POLICY "Tenant admins can insert memberships"
ON public.memberships FOR INSERT
TO authenticated
WITH CHECK (
    public.is_superadmin(auth.uid())
    OR public.is_tenant_admin_or_above(auth.uid(), tenant_id)
);

CREATE POLICY "Tenant admins can update memberships"
ON public.memberships FOR UPDATE
TO authenticated
USING (
    public.is_superadmin(auth.uid())
    OR public.is_tenant_admin_or_above(auth.uid(), tenant_id)
);

CREATE POLICY "Tenant admins can delete memberships"
ON public.memberships FOR DELETE
TO authenticated
USING (
    public.is_superadmin(auth.uid())
    OR public.is_tenant_admin_or_above(auth.uid(), tenant_id)
);

-- RLS Policies for audit_logs table
CREATE POLICY "Users can view audit logs of their tenants"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
    public.is_superadmin(auth.uid())
    OR tenant_id IN (SELECT public.get_user_tenant_ids(auth.uid()))
);

CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (
    actor_user_id = auth.uid()
    AND (
        tenant_id IS NULL 
        OR tenant_id IN (SELECT public.get_user_tenant_ids(auth.uid()))
    )
);