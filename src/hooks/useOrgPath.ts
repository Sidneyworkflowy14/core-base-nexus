import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';

export function useOrgPath() {
  const params = useParams();
  const { currentTenant } = useTenant();

  const orgSlug = (params as { orgSlug?: string }).orgSlug || currentTenant?.slug || '';

  const withOrg = useMemo(() => {
    return (path: string) => {
      if (!orgSlug) return path;
      if (path.startsWith('http')) return path;
      if (path.startsWith(`/${orgSlug}/`) || path === `/${orgSlug}`) return path;
      if (path.startsWith('/')) return `/${orgSlug}${path}`;
      return `/${orgSlug}/${path}`;
    };
  }, [orgSlug]);

  return { orgSlug, withOrg };
}
