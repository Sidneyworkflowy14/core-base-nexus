-- Create tenant_branding table for visual customization per tenant
CREATE TABLE public.tenant_branding (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    theme_mode TEXT NOT NULL DEFAULT 'system' CHECK (theme_mode IN ('light', 'dark', 'system')),
    tokens_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id)
);

-- Enable RLS
ALTER TABLE public.tenant_branding ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view branding of their tenants"
ON public.tenant_branding
FOR SELECT
USING (
    is_superadmin(auth.uid()) 
    OR tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
);

CREATE POLICY "Tenant admins can insert branding"
ON public.tenant_branding
FOR INSERT
WITH CHECK (
    is_superadmin(auth.uid()) 
    OR is_tenant_admin_or_above(auth.uid(), tenant_id)
);

CREATE POLICY "Tenant admins can update branding"
ON public.tenant_branding
FOR UPDATE
USING (
    is_superadmin(auth.uid()) 
    OR is_tenant_admin_or_above(auth.uid(), tenant_id)
);

CREATE POLICY "Tenant admins can delete branding"
ON public.tenant_branding
FOR DELETE
USING (
    is_superadmin(auth.uid()) 
    OR is_tenant_admin_or_above(auth.uid(), tenant_id)
);

-- Trigger for updated_at
CREATE TRIGGER update_tenant_branding_updated_at
BEFORE UPDATE ON public.tenant_branding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();