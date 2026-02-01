-- Create function to update timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create views table for custom pages per tenant
CREATE TABLE public.views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    content JSONB DEFAULT '{}',
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, slug)
);

-- Create indexes for views
CREATE INDEX idx_views_tenant_id ON public.views(tenant_id);
CREATE INDEX idx_views_slug ON public.views(tenant_id, slug);

-- Enable RLS on views
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for views
CREATE POLICY "Users can view published views of their tenants"
ON public.views FOR SELECT
TO authenticated
USING (
    public.is_superadmin(auth.uid())
    OR (
        tenant_id IN (SELECT public.get_user_tenant_ids(auth.uid()))
        AND (is_published = true OR public.is_tenant_admin_or_above(auth.uid(), tenant_id))
    )
);

CREATE POLICY "Tenant admins can insert views"
ON public.views FOR INSERT
TO authenticated
WITH CHECK (
    public.is_superadmin(auth.uid())
    OR public.is_tenant_admin_or_above(auth.uid(), tenant_id)
);

CREATE POLICY "Tenant admins can update views"
ON public.views FOR UPDATE
TO authenticated
USING (
    public.is_superadmin(auth.uid())
    OR public.is_tenant_admin_or_above(auth.uid(), tenant_id)
);

CREATE POLICY "Tenant admins can delete views"
ON public.views FOR DELETE
TO authenticated
USING (
    public.is_superadmin(auth.uid())
    OR public.is_tenant_admin_or_above(auth.uid(), tenant_id)
);

-- Trigger for updated_at on views
CREATE TRIGGER update_views_updated_at
BEFORE UPDATE ON public.views
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();