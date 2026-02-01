import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { DataSource, DataSourceType, SupabaseTableConfig, N8nHttpConfig } from '@/types/builder';

export interface DataSourceRow {
  [key: string]: unknown;
}

interface DataSourceDbRow {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  config: unknown;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useDataSources() {
  const { currentTenant } = useTenant();
  const { user } = useAuth();
  const { log } = useAuditLog();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDataSources = useCallback(async () => {
    if (!currentTenant) {
      setDataSources([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_sources' as any)
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('name', { ascending: true });

      if (error) throw error;

      const items: DataSource[] = ((data as unknown as DataSourceDbRow[]) || []).map((item) => ({
        id: item.id,
        tenant_id: item.tenant_id,
        name: item.name,
        type: item.type as DataSourceType,
        config: item.config as SupabaseTableConfig | N8nHttpConfig,
        created_by: item.created_by,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setDataSources(items);
    } catch (error) {
      console.error('Error fetching data sources:', error);
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    fetchDataSources();
  }, [fetchDataSources]);

  const getDataSourceById = async (id: string): Promise<DataSource | null> => {
    const { data, error } = await supabase
      .from('data_sources' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching data source:', error);
      return null;
    }

    const item = data as unknown as DataSourceDbRow;
    return {
      id: item.id,
      tenant_id: item.tenant_id,
      name: item.name,
      type: item.type as DataSourceType,
      config: item.config as SupabaseTableConfig | N8nHttpConfig,
      created_by: item.created_by,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  };

  const createDataSource = async (data: {
    name: string;
    type: DataSourceType;
    config: SupabaseTableConfig | N8nHttpConfig;
  }) => {
    if (!currentTenant || !user) return null;

    const { data: newDs, error } = await supabase
      .from('data_sources' as any)
      .insert([{
        tenant_id: currentTenant.id,
        name: data.name,
        type: data.type,
        config: data.config,
        created_by: user.id,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating data source:', error);
      throw error;
    }

    await log({
      action: 'data_source_created',
      entity: 'data_source',
      entity_id: (newDs as any).id,
      metadata: { name: data.name, type: data.type },
    });

    await fetchDataSources();
    return newDs as unknown as DataSource;
  };

  const updateDataSource = async (id: string, data: Partial<{
    name: string;
    type: DataSourceType;
    config: SupabaseTableConfig | N8nHttpConfig;
  }>) => {
    const { error } = await supabase
      .from('data_sources' as any)
      .update(data as any)
      .eq('id', id);

    if (error) {
      console.error('Error updating data source:', error);
      throw error;
    }

    await log({
      action: 'data_source_updated',
      entity: 'data_source',
      entity_id: id,
    });

    await fetchDataSources();
  };

  const deleteDataSource = async (id: string) => {
    const { error } = await supabase
      .from('data_sources' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting data source:', error);
      throw error;
    }

    await log({
      action: 'data_source_deleted',
      entity: 'data_source',
      entity_id: id,
    });

    await fetchDataSources();
  };

  const testDataSource = async (dsOrId: DataSource | string, params?: Record<string, string>): Promise<{ data: DataSourceRow[] | null; error: string | null }> => {
    let ds: DataSource | null = null;
    if (typeof dsOrId === 'string') {
      ds = await getDataSourceById(dsOrId);
      if (!ds) return { data: null, error: 'Data source não encontrado' };
    } else {
      ds = dsOrId;
    }
    try {
      if (ds.type === 'supabase_table') {
        const config = ds.config as SupabaseTableConfig;
        const { data, error } = await supabase
          .from(config.table_name as any)
          .select(config.columns?.join(',') || '*')
          .limit(100);
        
        if (error) throw error;
        return { data: (data as unknown as DataSourceRow[]) || [], error: null };
      } else if (ds.type === 'n8n_http') {
        const config = ds.config as N8nHttpConfig;
        
        // Build URL with params
        let url = config.url;
        if (params && Object.keys(params).length > 0) {
          const searchParams = new URLSearchParams(params);
          url += (url.includes('?') ? '&' : '?') + searchParams.toString();
        }
        
        const response = await fetch(url, {
          method: config.method,
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return { data: Array.isArray(data) ? data : [data], error: null };
      }
      
      return { data: null, error: 'Tipo de data source não suportado' };
    } catch (err: any) {
      console.error('Error testing data source:', err.message);
      return { data: null, error: err.message };
    }
  };

  return {
    dataSources,
    loading,
    refetch: fetchDataSources,
    getDataSourceById,
    createDataSource,
    updateDataSource,
    deleteDataSource,
    testDataSource,
  };
}
