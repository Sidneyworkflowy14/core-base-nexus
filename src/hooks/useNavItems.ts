import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useRoles } from '@/hooks/useRoles';
import { useAuditLog } from '@/hooks/useAuditLog';
import { NavItem, IconName } from '@/types/nav';
import { AppRole } from '@/types/auth';

interface NavItemRow {
  id: string;
  tenant_id: string;
  title: string;
  icon: string;
  route: string;
  order: number;
  parent_id: string | null;
  permissions: string[];
  is_visible: boolean;
  created_at: string;
}

export function useNavItems() {
  const { currentTenant } = useTenant();
  const { currentRole } = useRoles();
  const { log } = useAuditLog();
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNavItems = useCallback(async () => {
    if (!currentTenant) {
      setNavItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('nav_items' as any)
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('order', { ascending: true });

      if (error) throw error;

      const items: NavItem[] = ((data as unknown as NavItemRow[]) || []).map((item) => ({
        id: item.id,
        tenant_id: item.tenant_id,
        title: item.title,
        icon: item.icon,
        route: item.route,
        order: item.order,
        parent_id: item.parent_id,
        permissions: item.permissions as AppRole[],
        is_visible: item.is_visible,
        created_at: item.created_at,
      }));

      setNavItems(items);
    } catch (error) {
      console.error('Error fetching nav items:', error);
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    fetchNavItems();
  }, [fetchNavItems]);

  // Filter items based on user role and visibility
  const visibleNavItems = navItems.filter((item) => {
    if (!item.is_visible) return false;
    if (!currentRole) return false;
    
    // Check if user has one of the required permissions
    const roleHierarchy: AppRole[] = ['tenant_user', 'tenant_admin', 'superadmin'];
    const userRoleIndex = roleHierarchy.indexOf(currentRole);
    
    return item.permissions.some((perm) => {
      const permIndex = roleHierarchy.indexOf(perm);
      return userRoleIndex >= permIndex;
    });
  });

  const createNavItem = async (data: {
    title: string;
    icon: IconName;
    route: string;
    permissions?: AppRole[];
    is_visible?: boolean;
    parent_id?: string | null;
  }) => {
    if (!currentTenant) return null;

    // Get max order
    const maxOrder = navItems.reduce((max, item) => Math.max(max, item.order), -1);

    const { data: newItem, error } = await supabase
      .from('nav_items' as any)
      .insert([{
        tenant_id: currentTenant.id,
        title: data.title,
        icon: data.icon,
        route: data.route,
        order: maxOrder + 1,
        permissions: data.permissions || ['tenant_user'],
        is_visible: data.is_visible ?? true,
        parent_id: data.parent_id ?? null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating nav item:', error);
      throw error;
    }

    await log({
      action: 'nav_item_created',
      entity: 'nav_item',
      entity_id: (newItem as any).id,
      metadata: { title: data.title, route: data.route },
    });

    await fetchNavItems();
    return newItem;
  };

  const updateNavItem = async (id: string, data: Partial<{
    title: string;
    icon: IconName;
    route: string;
    order: number;
    permissions: AppRole[];
    is_visible: boolean;
    parent_id: string | null;
  }>) => {
    const { error } = await supabase
      .from('nav_items' as any)
      .update(data as any)
      .eq('id', id);

    if (error) {
      console.error('Error updating nav item:', error);
      throw error;
    }

    await log({
      action: 'nav_item_updated',
      entity: 'nav_item',
      entity_id: id,
      metadata: data as Record<string, string | number | boolean | null>,
    });

    await fetchNavItems();
  };

  const deleteNavItem = async (id: string) => {
    const { error } = await supabase
      .from('nav_items' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting nav item:', error);
      throw error;
    }

    await log({
      action: 'nav_item_deleted',
      entity: 'nav_item',
      entity_id: id,
    });

    await fetchNavItems();
  };

  const reorderNavItems = async (items: { id: string; order: number }[]) => {
    // Update each item's order
    for (const item of items) {
      await supabase
        .from('nav_items' as any)
        .update({ order: item.order } as any)
        .eq('id', item.id);
    }

    await log({
      action: 'nav_items_reordered',
      entity: 'nav_item',
      metadata: { count: items.length },
    });

    await fetchNavItems();
  };

  return {
    navItems,
    visibleNavItems,
    loading,
    refetch: fetchNavItems,
    createNavItem,
    updateNavItem,
    deleteNavItem,
    reorderNavItems,
  };
}
