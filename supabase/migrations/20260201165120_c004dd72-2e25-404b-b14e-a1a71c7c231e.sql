-- Create a function to list basic user info for superadmins
-- This safely exposes only necessary fields from auth.users
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    au.id,
    au.email,
    au.created_at
  FROM auth.users au
  WHERE is_superadmin(auth.uid())
  ORDER BY au.created_at DESC;
$$;