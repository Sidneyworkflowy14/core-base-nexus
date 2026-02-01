import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Page, PageSchema, PageVersion, FilterParam } from '@/types/builder';

interface PageRow {
  id: string;
  tenant_id: string;
  title: string;
  slug: string;
  status: string;
  schema_json: unknown;
  version: number;
  data_source_id: string | null;
  has_filters: boolean;
  filter_params: unknown;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function usePages() {
  const { currentTenant } = useTenant();
  const { user } = useAuth();
  const { log } = useAuditLog();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = useCallback(async () => {
    if (!currentTenant) {
      setPages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pages' as any)
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const items: Page[] = ((data as unknown as PageRow[]) || []).map((item) => ({
        id: item.id,
        tenant_id: item.tenant_id,
        title: item.title,
        slug: item.slug,
        status: item.status as 'draft' | 'published',
        schema_json: item.schema_json as PageSchema,
        version: item.version,
        data_source_id: item.data_source_id,
        has_filters: item.has_filters,
        filter_params: item.filter_params as FilterParam[],
        created_by: item.created_by,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setPages(items);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const getPageById = async (id: string): Promise<Page | null> => {
    const { data, error } = await supabase
      .from('pages' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching page:', error);
      return null;
    }

    const item = data as unknown as PageRow;
    return {
      id: item.id,
      tenant_id: item.tenant_id,
      title: item.title,
      slug: item.slug,
      status: item.status as 'draft' | 'published',
      schema_json: item.schema_json as PageSchema,
      version: item.version,
      data_source_id: item.data_source_id,
      has_filters: item.has_filters,
      filter_params: item.filter_params as FilterParam[],
      created_by: item.created_by,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  };

  const getPageBySlug = async (slug: string): Promise<Page | null> => {
    if (!currentTenant) return null;

    const { data, error } = await supabase
      .from('pages' as any)
      .select('*')
      .eq('tenant_id', currentTenant.id)
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching page:', error);
      return null;
    }

    const item = data as unknown as PageRow;
    return {
      id: item.id,
      tenant_id: item.tenant_id,
      title: item.title,
      slug: item.slug,
      status: item.status as 'draft' | 'published',
      schema_json: item.schema_json as PageSchema,
      version: item.version,
      data_source_id: item.data_source_id,
      has_filters: item.has_filters,
      filter_params: item.filter_params as FilterParam[],
      created_by: item.created_by,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  };

  const createPage = async (data: {
    title: string;
    slug: string;
    has_filters?: boolean;
    filter_params?: FilterParam[];
    data_source_id?: string | null;
  }) => {
    if (!currentTenant || !user) return null;

    const { data: newPage, error } = await supabase
      .from('pages' as any)
      .insert([{
        tenant_id: currentTenant.id,
        title: data.title,
        slug: data.slug,
        status: 'draft',
        schema_json: { blocks: [] },
        version: 1,
        has_filters: data.has_filters ?? false,
        filter_params: data.filter_params ?? [],
        data_source_id: data.data_source_id ?? null,
        created_by: user.id,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating page:', error);
      throw error;
    }

    await log({
      action: 'page_created',
      entity: 'page',
      entity_id: (newPage as any).id,
      metadata: { title: data.title, slug: data.slug },
    });

    await fetchPages();
    return newPage as unknown as Page;
  };

  const updatePage = async (id: string, data: Partial<{
    title: string;
    slug: string;
    schema_json: PageSchema;
    data_source_id: string | null;
    has_filters: boolean;
    filter_params: FilterParam[];
  }>) => {
    const { error } = await supabase
      .from('pages' as any)
      .update(data as any)
      .eq('id', id);

    if (error) {
      console.error('Error updating page:', error);
      throw error;
    }

    await log({
      action: 'page_updated',
      entity: 'page',
      entity_id: id,
    });

    await fetchPages();
  };

  const saveDraft = async (id: string, schema_json: PageSchema) => {
    const page = await getPageById(id);
    if (!page) return;

    await updatePage(id, { schema_json });
  };

  const publishPage = async (id: string, schema_json: PageSchema) => {
    const page = await getPageById(id);
    if (!page || !currentTenant || !user) return;

    const newVersion = page.version + 1;

    // Save current version to page_versions
    await supabase
      .from('page_versions' as any)
      .insert([{
        tenant_id: currentTenant.id,
        page_id: id,
        version: page.version,
        schema_json: page.schema_json,
        created_by: user.id,
      }]);

    // Update page with new version and published status
    const { error } = await supabase
      .from('pages' as any)
      .update({
        schema_json,
        version: newVersion,
        status: 'published',
      } as any)
      .eq('id', id);

    if (error) {
      console.error('Error publishing page:', error);
      throw error;
    }

    await log({
      action: 'page_published',
      entity: 'page',
      entity_id: id,
      metadata: { version: newVersion },
    });

    await fetchPages();
  };

  const deletePage = async (id: string) => {
    const { error } = await supabase
      .from('pages' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting page:', error);
      throw error;
    }

    await log({
      action: 'page_deleted',
      entity: 'page',
      entity_id: id,
    });

    await fetchPages();
  };

  return {
    pages,
    loading,
    refetch: fetchPages,
    getPageById,
    getPageBySlug,
    createPage,
    updatePage,
    saveDraft,
    publishPage,
    deletePage,
  };
}
