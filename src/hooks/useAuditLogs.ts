import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuditLogEntry } from '@/types/dashboard';

interface FetchLogsParams {
  tenantId?: string;
  entity?: string;
  limit?: number;
}

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async ({ tenantId, entity, limit = 100 }: FetchLogsParams = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      if (entity) {
        query = query.eq('entity', entity);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setLogs((data || []).map(log => ({
        ...log,
        metadata_json: log.metadata_json as Record<string, unknown> || {},
      })));
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    logs,
    loading,
    fetchLogs,
  };
}
