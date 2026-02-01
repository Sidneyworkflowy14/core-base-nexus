import { useMemo } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { AppRole } from '@/types/auth';

export function useRoles() {
  const { currentMembership, userTenants } = useTenant();

  const isSuperAdmin = useMemo(() => {
    return userTenants.some((m) => m.role === 'superadmin');
  }, [userTenants]);

  const isTenantAdmin = useMemo(() => {
    return currentMembership?.role === 'tenant_admin' || isSuperAdmin;
  }, [currentMembership, isSuperAdmin]);

  const isTenantUser = useMemo(() => {
    return currentMembership?.role === 'tenant_user';
  }, [currentMembership]);

  const currentRole: AppRole | null = useMemo(() => {
    if (isSuperAdmin) return 'superadmin';
    return currentMembership?.role ?? null;
  }, [isSuperAdmin, currentMembership]);

  const hasRole = (role: AppRole): boolean => {
    if (role === 'superadmin') return isSuperAdmin;
    if (role === 'tenant_admin') return isTenantAdmin;
    if (role === 'tenant_user') return !!currentMembership;
    return false;
  };

  const hasMinRole = (minRole: AppRole): boolean => {
    const roleHierarchy: AppRole[] = ['tenant_user', 'tenant_admin', 'superadmin'];
    const minIndex = roleHierarchy.indexOf(minRole);
    const currentIndex = currentRole ? roleHierarchy.indexOf(currentRole) : -1;
    return currentIndex >= minIndex;
  };

  return {
    isSuperAdmin,
    isTenantAdmin,
    isTenantUser,
    currentRole,
    hasRole,
    hasMinRole,
  };
}
