import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Dashboard, Widget, WidgetConfig, DashboardLayout, WidgetType } from '@/types/dashboard';
import type { Json } from '@/integrations/supabase/types';

export function useDashboard() {
  const { currentTenant } = useTenant();
  const { log } = useAuditLog();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    if (!currentTenant) return;
    
    setLoading(true);
    try {
      // Get or create dashboard for tenant
      let { data: existingDashboard, error } = await supabase
        .from('dashboards')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No dashboard exists, create one
        const { data: newDashboard, error: createError } = await supabase
          .from('dashboards')
          .insert([{ tenant_id: currentTenant.id }])
          .select()
          .single();

        if (createError) throw createError;
        existingDashboard = newDashboard;
        
        await log({
          action: 'dashboard_created',
          entity: 'dashboard',
          entity_id: newDashboard.id,
        });
      } else if (error) {
        throw error;
      }

      if (existingDashboard) {
        setDashboard({
          ...existingDashboard,
          layout_json: existingDashboard.layout_json as unknown as DashboardLayout,
        });

        // Fetch widgets
        const { data: widgetsData, error: widgetsError } = await supabase
          .from('widgets')
          .select('*')
          .eq('dashboard_id', existingDashboard.id)
          .order('sort_order', { ascending: true });

        if (widgetsError) throw widgetsError;
        
        setWidgets((widgetsData || []).map(w => ({
          ...w,
          type: w.type as WidgetType,
          config_json: w.config_json as unknown as WidgetConfig,
        })));
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [currentTenant, log]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const addWidget = async (
    title: string,
    type: WidgetType,
    config: WidgetConfig,
    pageId?: string,
    dataSourceId?: string
  ) => {
    if (!dashboard || !currentTenant) return null;

    try {
      const newOrder = widgets.length;
      const { data, error } = await supabase
        .from('widgets')
        .insert([{
          tenant_id: currentTenant.id,
          dashboard_id: dashboard.id,
          title,
          type,
          config_json: config as unknown as Json,
          page_id: pageId || null,
          data_source_id: dataSourceId || null,
          sort_order: newOrder,
        }])
        .select()
        .single();

      if (error) throw error;

      await log({
        action: 'widget_created',
        entity: 'widget',
        entity_id: data.id,
        metadata: { title, type },
      });

      await fetchDashboard();
      return data;
    } catch (err) {
      console.error('Error adding widget:', err);
      return null;
    }
  };

  const updateWidget = async (widgetId: string, updates: Partial<Pick<Widget, 'title' | 'config_json' | 'page_id' | 'data_source_id'>>) => {
    try {
      const updateData: Record<string, unknown> = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.config_json !== undefined) updateData.config_json = updates.config_json as unknown as Json;
      if (updates.page_id !== undefined) updateData.page_id = updates.page_id;
      if (updates.data_source_id !== undefined) updateData.data_source_id = updates.data_source_id;

      const { error } = await supabase
        .from('widgets')
        .update(updateData)
        .eq('id', widgetId);

      if (error) throw error;

      await log({
        action: 'widget_updated',
        entity: 'widget',
        entity_id: widgetId,
      });

      await fetchDashboard();
    } catch (err) {
      console.error('Error updating widget:', err);
    }
  };

  const deleteWidget = async (widgetId: string) => {
    try {
      const { error } = await supabase
        .from('widgets')
        .delete()
        .eq('id', widgetId);

      if (error) throw error;

      await log({
        action: 'widget_deleted',
        entity: 'widget',
        entity_id: widgetId,
      });

      await fetchDashboard();
    } catch (err) {
      console.error('Error deleting widget:', err);
    }
  };

  const reorderWidgets = async (widgetIds: string[]) => {
    try {
      const updates = widgetIds.map((id, index) => 
        supabase
          .from('widgets')
          .update({ sort_order: index })
          .eq('id', id)
      );

      await Promise.all(updates);
      await fetchDashboard();
    } catch (err) {
      console.error('Error reordering widgets:', err);
    }
  };

  const updateLayout = async (layout: Partial<DashboardLayout>) => {
    if (!dashboard) return;

    try {
      const newLayout = { ...dashboard.layout_json, ...layout };
      const { error } = await supabase
        .from('dashboards')
        .update({ layout_json: newLayout as unknown as Json })
        .eq('id', dashboard.id);

      if (error) throw error;
      
      setDashboard(prev => prev ? { ...prev, layout_json: newLayout } : null);
    } catch (err) {
      console.error('Error updating layout:', err);
    }
  };

  return {
    dashboard,
    widgets,
    loading,
    addWidget,
    updateWidget,
    deleteWidget,
    reorderWidgets,
    updateLayout,
    refetch: fetchDashboard,
  };
}
