import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Settings, LayoutGrid, Shield, Menu } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { useTenant } from '@/contexts/TenantContext';
import { useNavItems } from '@/hooks/useNavItems';
import { DynamicIcon } from './DynamicIcon';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const { currentTenant, userTenants } = useTenant();
  const { isTenantAdmin, isSuperAdmin } = useRoles();
  const { visibleNavItems, loading } = useNavItems();

  const isActive = (path: string) => location.pathname === path;
  const collapsed = state === 'collapsed';

  // Native menu items always present
  const nativeItems = [
    { title: 'Dashboard', route: '/dashboard', icon: 'home' },
  ];

  // Admin items
  const adminItems = isTenantAdmin
    ? [
        { title: 'Usuários', route: '/users', icon: 'users' },
        { title: 'Views', route: '/views', icon: 'layout' },
        { title: 'Configurações', route: '/settings', icon: 'settings' },
      ]
    : [];

  // Superadmin items
  const superAdminItems = isSuperAdmin
    ? [{ title: 'Super Admin', route: '/superadmin', icon: 'shield' }]
    : [];

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="truncate">
              <p className="text-sm font-semibold truncate">
                {currentTenant?.name ?? 'Selecione org'}
              </p>
              {userTenants.length > 1 && (
                <Link
                  to="/select-tenant"
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Trocar
                </Link>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Native Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>{collapsed ? '' : 'Principal'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nativeItems.map((item) => (
                <SidebarMenuItem key={item.route}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.route)}
                  >
                    <Link to={item.route}>
                      <DynamicIcon name={item.icon} className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Dynamic Navigation Items */}
        {visibleNavItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{collapsed ? '' : 'Menu'}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleNavItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.route)}
                    >
                      <Link to={item.route}>
                        <DynamicIcon name={item.icon} className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Items */}
        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{collapsed ? '' : 'Administração'}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.route}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.route)}
                    >
                      <Link to={item.route}>
                        <DynamicIcon name={item.icon} className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Superadmin */}
        {superAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{collapsed ? '' : 'Sistema'}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superAdminItems.map((item) => (
                  <SidebarMenuItem key={item.route}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.route)}
                    >
                      <Link to={item.route}>
                        <Shield className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        {!collapsed && (
          <p className="text-xs text-muted-foreground">
            Multi-Tenant SaaS
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
