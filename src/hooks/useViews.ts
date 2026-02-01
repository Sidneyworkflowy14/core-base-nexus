import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { View } from '@/types/nav';

interface ViewRow {
  id: string;
  tenant_id: string;
  slug: string;
  title: string;
  content: Record<string, unknown>;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export function useViews() {
  const { currentTenant } = useTenant();
  const { log } = useAuditLog();
  const [views, setViews] = useState<View[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchViews = useCallback(async () => {
    if (!currentTenant) {
      setViews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('views' as any)
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items: View[] = ((data as unknown as ViewRow[]) || []).map((item) => ({
        id: item.id,
        tenant_id: item.tenant_id,
        slug: item.slug,
        title: item.title,
        content: item.content,
        is_published: item.is_published,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setViews(items);
    } catch (error) {
      console.error('Error fetching views:', error);
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    fetchViews();
  }, [fetchViews]);

  const getViewBySlug = async (slug: string): Promise<View | null> => {
    if (!currentTenant) return null;

    const { data, error } = await supabase
      .from('views' as any)
      .select('*')
      .eq('tenant_id', currentTenant.id)
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching view:', error);
      return null;
    }

    const item = data as unknown as ViewRow;
    return {
      id: item.id,
      tenant_id: item.tenant_id,
      slug: item.slug,
      title: item.title,
      content: item.content,
      is_published: item.is_published,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  };

  const createView = async (data: {
    title: string;
    slug: string;
    content?: Record<string, unknown>;
    is_published?: boolean;
  }) => {
    if (!currentTenant) return null;

    const { data: newView, error } = await supabase
      .from('views' as any)
      .insert([{
        tenant_id: currentTenant.id,
        title: data.title,
        slug: data.slug,
        content: data.content || {},
        is_published: data.is_published ?? false,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating view:', error);
      throw error;
    }

    await log({
      action: 'view_created',
      entity: 'view',
      entity_id: (newView as unknown as View).id,
      metadata: { title: data.title, slug: data.slug },
    });

    await fetchViews();
    return newView as unknown as View;
  };

  const updateView = async (id: string, data: Partial<{
    title: string;
    slug: string;
    content: Record<string, unknown>;
    is_published: boolean;
  }>) => {
    const { error } = await supabase
      .from('views' as any)
      .update(data as any)
      .eq('id', id);

    if (error) {
      console.error('Error updating view:', error);
      throw error;
    }

    await log({
      action: 'view_updated',
      entity: 'view',
      entity_id: id,
    });

    await fetchViews();
  };

  const deleteView = async (id: string) => {
    const { error } = await supabase
      .from('views' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting view:', error);
      throw error;
    }

    await log({
      action: 'view_deleted',
      entity: 'view',
      entity_id: id,
    });

    await fetchViews();
  };

  return {
    views,
    loading,
    refetch: fetchViews,
    getViewBySlug,
    createView,
    updateView,
    deleteView,
  };
}
