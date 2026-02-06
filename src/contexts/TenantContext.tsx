import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Tenant, Membership, TenantContextType, AppRole } from '@/types/auth';

const TENANT_STORAGE_KEY = 'current_tenant_id';

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentTenant, setCurrentTenantState] = useState<Tenant | null>(null);
  const [currentMembership, setCurrentMembership] = useState<Membership | null>(null);
  const [userTenants, setUserTenants] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserTenants = useCallback(async () => {
    if (!user) {
      setUserTenants([]);
      setCurrentTenantState(null);
      setCurrentMembership(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: memberships, error } = await supabase
        .from('memberships')
        .select(`
          id,
          tenant_id,
          user_id,
          role,
          created_at,
          tenant:tenants (
            id,
            name,
            slug,
            status,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const formattedMemberships: Membership[] = (memberships || []).map((m) => {
        const tenant = m.tenant as unknown as Tenant | null;
        return {
          id: m.id,
          tenant_id: m.tenant_id,
          user_id: m.user_id,
          role: m.role as AppRole,
          created_at: m.created_at,
          tenant: tenant
            ? {
                ...tenant,
                slug: tenant.slug || '',
              }
            : undefined,
        };
      });

      setUserTenants(formattedMemberships);

      // Try to restore previous tenant selection
      const storedTenantId = localStorage.getItem(TENANT_STORAGE_KEY);
      const matchingMembership = formattedMemberships.find(
        (m) => m.tenant_id === storedTenantId
      );

      if (matchingMembership && matchingMembership.tenant) {
        setCurrentTenantState(matchingMembership.tenant);
        setCurrentMembership(matchingMembership);
      } else if (formattedMemberships.length === 1 && formattedMemberships[0].tenant) {
        // Auto-select if only one tenant
        setCurrentTenantState(formattedMemberships[0].tenant);
        setCurrentMembership(formattedMemberships[0]);
        localStorage.setItem(TENANT_STORAGE_KEY, formattedMemberships[0].tenant_id);
      } else {
        setCurrentTenantState(null);
        setCurrentMembership(null);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserTenants();
  }, [fetchUserTenants]);

  const setCurrentTenant = useCallback((tenantId: string) => {
    const membership = userTenants.find((m) => m.tenant_id === tenantId);
    if (membership && membership.tenant) {
      setCurrentTenantState(membership.tenant);
      setCurrentMembership(membership);
      localStorage.setItem(TENANT_STORAGE_KEY, tenantId);
    }
  }, [userTenants]);

  const refetchTenants = useCallback(async () => {
    await fetchUserTenants();
  }, [fetchUserTenants]);

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        currentMembership,
        userTenants,
        loading,
        setCurrentTenant,
        refetchTenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
