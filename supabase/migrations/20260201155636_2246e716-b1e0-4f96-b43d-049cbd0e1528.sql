-- Add soft delete to pages
ALTER TABLE public.pages ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create dashboards table
CREATE TABLE public.dashboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  layout_json JSONB NOT NULL DEFAULT '{"columns": 2, "widgets": []}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create widgets table
CREATE TABLE public.widgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  dashboard_id UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'kpi', 'table', 'chart', 'list'
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  page_id UUID REFERENCES public.pages(id) ON DELETE SET NULL,
  data_source_id UUID REFERENCES public.data_sources(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;

-- Dashboards policies
CREATE POLICY "Users can view dashboards of their tenants"
ON public.dashboards FOR SELECT
USING (is_superadmin(auth.uid()) OR tenant_id IN (SELECT get_user_tenant_ids(auth.uid())));

CREATE POLICY "Tenant admins can insert dashboards"
ON public.dashboards FOR INSERT
WITH CHECK (is_superadmin(auth.uid()) OR is_tenant_admin_or_above(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can update dashboards"
ON public.dashboards FOR UPDATE
USING (is_superadmin(auth.uid()) OR is_tenant_admin_or_above(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can delete dashboards"
ON public.dashboards FOR DELETE
USING (is_superadmin(auth.uid()) OR is_tenant_admin_or_above(auth.uid(), tenant_id));

-- Widgets policies
CREATE POLICY "Users can view widgets of their tenants"
ON public.widgets FOR SELECT
USING (is_superadmin(auth.uid()) OR tenant_id IN (SELECT get_user_tenant_ids(auth.uid())));

CREATE POLICY "Tenant admins can insert widgets"
ON public.widgets FOR INSERT
WITH CHECK (is_superadmin(auth.uid()) OR is_tenant_admin_or_above(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can update widgets"
ON public.widgets FOR UPDATE
USING (is_superadmin(auth.uid()) OR is_tenant_admin_or_above(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can delete widgets"
ON public.widgets FOR DELETE
USING (is_superadmin(auth.uid()) OR is_tenant_admin_or_above(auth.uid(), tenant_id));

-- Triggers for updated_at
CREATE TRIGGER update_dashboards_updated_at
BEFORE UPDATE ON public.dashboards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_widgets_updated_at
BEFORE UPDATE ON public.widgets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_dashboards_tenant_id ON public.dashboards(tenant_id);
CREATE INDEX idx_widgets_dashboard_id ON public.widgets(dashboard_id);
CREATE INDEX idx_widgets_tenant_id ON public.widgets(tenant_id);
CREATE INDEX idx_pages_deleted_at ON public.pages(deleted_at);