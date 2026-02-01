-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Users can view data sources of their tenants" ON public.data_sources;

-- Create new restrictive SELECT policy that only allows tenant admins and superadmins
CREATE POLICY "Tenant admins can view data sources"
ON public.data_sources
FOR SELECT
USING (is_superadmin(auth.uid()) OR is_tenant_admin_or_above(auth.uid(), tenant_id));