-- Create initial tenant
INSERT INTO public.tenants (id, name, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'Organização Principal', 'active')
ON CONFLICT (id) DO NOTHING;

-- Make user superadmin
INSERT INTO public.memberships (tenant_id, user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', '6d5260e3-4674-4c72-8958-82b111ad2e62', 'superadmin')
ON CONFLICT DO NOTHING;