-- Drop existing views table (we'll recreate with enhanced schema)
DROP TABLE IF EXISTS public.views CASCADE;

-- Create pages table (replaces views)
CREATE TABLE public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    schema_json JSONB NOT NULL DEFAULT '{"blocks": []}',
    version INTEGER NOT NULL DEFAULT 1,
    data_source_id UUID,
    has_filters BOOLEAN NOT NULL DEFAULT false,
    filter_params JSONB DEFAULT '[]',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, slug)
);

-- Create page_versions table
CREATE TABLE public.page_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    schema_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(page_id, version)
);

-- Create data_sources table
CREATE TABLE public.data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('supabase_table', 'n8n_http')),
    config JSONB NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- Create indexes
CREATE INDEX idx_pages_tenant_id ON public.pages(tenant_id);
CREATE INDEX idx_pages_slug ON public.pages(tenant_id, slug);
CREATE INDEX idx_pages_status ON public.pages(tenant_id, status);
CREATE INDEX idx_page_versions_page_id ON public.page_versions(page_id);
CREATE INDEX idx_data_sources_tenant_id ON public.data_sources(tenant_id);

-- Enable RLS
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

-- RLS for pages
CREATE POLICY "Users can view published pages of their tenants"
ON public.pages FOR SELECT
TO authenticated
USING (
    public.is_superadmin(auth.uid())
    OR (
        tenant_id IN (SELECT public.get_user_tenant_ids(auth.uid()))
        AND (status = 'published' OR public.is_tenant_admin_or_above(auth.uid(), tenant_id))
    )
);

CREATE POLICY "Tenant admins can insert pages"
ON public.pages FOR INSERT
TO authenticated
WITH CHECK (
    public.is_superadmin(auth.uid())
    OR public.is_tenant_admin_or_above(auth.uid(), tenant_id)
);

CREATE POLICY "Tenant admins can update pages"
ON public.pages FOR UPDATE
TO authenticated
USING (
    public.is_superadmin(auth.uid())
    OR public.is_tenant_admin_or_above(auth.uid(), tenant_id)
);

CREATE POLICY "Tenant admins can delete pages"
ON public.pages FOR DELETE
TO authenticated
USING (
    public.is_superadmin(auth.uid())
    OR public.is_tenant_admin_or_above(auth.uid(), tenant_id)
);

-- RLS for page_versions
CREATE POLICY "Users can view page versions of their tenants"
ON public.page_versions FOR SELECT
TO authenticated
USING (
    public.is_superadmin(auth.uid())
    OR tenant_id IN (SELECT public.get_user_tenant_ids(auth.uid()))
);

CREATE POLICY "Tenant admins can insert page versions"
ON public.page_versions FOR INSERT
TO authenticated
WITH CHECK (
    public.is_superadmin(auth.uid())
    OR public.is_tenant_admin_or_above(auth.uid(), tenant_id)
);

-- RLS for data_sources
CREATE POLICY "Users can view data sources of their tenants"
ON public.data_sources FOR SELECT
TO authenticated
USING (
    public.is_superadmin(auth.uid())
    OR tenant_id IN (SELECT public.get_user_tenant_ids(auth.uid()))
);

CREATE POLICY "Tenant admins can insert data sources"
ON public.data_sources FOR INSERT
TO authenticated
WITH CHECK (
    public.is_superadmin(auth.uid())
    OR public.is_tenant_admin_or_above(auth.uid(), tenant_id)
);

CREATE POLICY "Tenant admins can update data sources"
ON public.data_sources FOR UPDATE
TO authenticated
USING (
    public.is_superadmin(auth.uid())
    OR public.is_tenant_admin_or_above(auth.uid(), tenant_id)
);

CREATE POLICY "Tenant admins can delete data sources"
ON public.data_sources FOR DELETE
TO authenticated
USING (
    public.is_superadmin(auth.uid())
    OR public.is_tenant_admin_or_above(auth.uid(), tenant_id)
);

-- Add foreign key for data_source_id after data_sources table exists
ALTER TABLE public.pages 
ADD CONSTRAINT pages_data_source_id_fkey 
FOREIGN KEY (data_source_id) REFERENCES public.data_sources(id) ON DELETE SET NULL;

-- Triggers for updated_at
CREATE TRIGGER update_pages_updated_at
BEFORE UPDATE ON public.pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_sources_updated_at
BEFORE UPDATE ON public.data_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();