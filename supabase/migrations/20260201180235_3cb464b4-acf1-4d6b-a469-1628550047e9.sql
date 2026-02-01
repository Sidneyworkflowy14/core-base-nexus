-- Deny all UPDATE operations for authenticated users on audit_logs
CREATE POLICY "Deny authenticated users from updating audit logs"
ON public.audit_logs
FOR UPDATE
TO authenticated
USING (false);

-- Deny all DELETE operations for authenticated users on audit_logs
CREATE POLICY "Deny authenticated users from deleting audit logs"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (false);