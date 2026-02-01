import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import type { Json } from '@/integrations/supabase/types';

interface LogParams {
  action: string;
  entity: string;
  entity_id?: string;
  metadata?: Record<string, Json>;
}

export function useAuditLog() {
  const { user } = useAuth();
  const { currentTenant } = useTenant();

  const log = useCallback(
    async ({ action, entity, entity_id, metadata = {} }: LogParams) => {
      if (!user) return;

      try {
        await supabase.from('audit_logs').insert([{
          tenant_id: currentTenant?.id ?? null,
          actor_user_id: user.id,
          action,
          entity,
          entity_id: entity_id ?? null,
          metadata_json: metadata,
        }]);
      } catch (error) {
        console.error('Failed to create audit log:', error);
      }
    },
    [user, currentTenant]
  );

  return { log };
}
