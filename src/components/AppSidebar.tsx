import { Link, useLocation } from 'react-router-dom';
import { Shield, Menu, ChevronDown, FileText } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { useTenant } from '@/contexts/TenantContext';
import { useNavItems } from '@/hooks/useNavItems';
import { useBranding } from '@/hooks/useBranding';
import { usePages } from '@/hooks/usePages';
import { DynamicIcon } from './DynamicIcon';
import { NexusBadge } from '@/components/nexus';
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
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const { currentTenant, userTenants } = useTenant();
  const { isTenantAdmin, isSuperAdmin } = useRoles();
  const { visibleNavItems } = useNavItems();
  const { logoUrl } = useBranding();
  const { pages } = usePages();

  // Get published pages for sidebar
  const publishedPages = pages.filter((p) => p.status === 'published');

  const isActive = (path: string) => location.pathname === path;
  const collapsed = state === 'collapsed';

  // Native menu items
  const nativeItems = [
    { title: 'Dashboard', route: '/dashboard', icon: 'home' },
  ];

  // Admin items
  const adminItems = isTenantAdmin
    ? [
        { title: 'Usuários', route: '/users', icon: 'users' },
        { title: 'Views', route: '/views', icon: 'layout' },
        { title: 'Data Sources', route: '/data-sources', icon: 'database' },
        { title: 'Configurações', route: '/settings', icon: 'settings' },
        { title: 'Brand', route: '/settings/brand', icon: 'palette' },
      ]
    : [];

  // Superadmin items
  const superAdminItems = isSuperAdmin
    ? [{ title: 'Super Admin', route: '/superadmin', icon: 'shield' }]
    : [];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      {/* Header with Logo */}
      <SidebarHeader className="p-2 border-b border-sidebar-border">
        <div className={cn(
          "flex items-center",
          collapsed ? "flex-col gap-2" : "gap-3"
        )}>
          {/* Toggle button - always visible and accessible */}
          <button
            onClick={toggleSidebar}
            className={cn(
              "p-2 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground flex-shrink-0",
              collapsed ? "order-first" : "order-last"
            )}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <div className={cn(
            "rounded-lg gradient-primary flex items-center justify-center flex-shrink-0",
            collapsed ? "h-8 w-8" : "h-10 w-10"
          )}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className={cn(collapsed ? "h-6 w-6" : "h-8 w-8", "object-contain")} />
            ) : (
              <span className={cn("text-white font-bold", collapsed ? "text-sm" : "text-lg")}>N</span>
            )}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {currentTenant?.name ?? 'Selecione org'}
              </p>
              <Link
                to="/select-tenant"
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                {userTenants.length > 1 ? 'Trocar org' : 'Organizações'} <ChevronDown className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin px-3 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="nexus-section-label mb-2">
              Principal
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {nativeItems.map((item) => (
                <SidebarMenuItem key={item.route}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.route)}
                    className={cn(
                      "nexus-menu-item",
                      isActive(item.route) && "nexus-menu-item-active"
                    )}
                  >
                    <Link to={item.route}>
                      <DynamicIcon name={item.icon} className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Published Views */}
        {publishedPages.length > 0 && (
          <SidebarGroup className="mt-6">
            {!collapsed && (
              <SidebarGroupLabel className="nexus-section-label mb-2">
                Views
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {publishedPages.map((page) => (
                  <SidebarMenuItem key={page.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(`/views/${page.slug}`)}
                      className={cn(
                        "nexus-menu-item",
                        isActive(`/views/${page.slug}`) && "nexus-menu-item-active"
                      )}
                    >
                      <Link to={`/views/${page.slug}`}>
                        <FileText className="h-5 w-5" />
                        {!collapsed && <span>{page.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Dynamic Navigation Items */}
        {visibleNavItems.length > 0 && (
          <SidebarGroup className="mt-6">
            {!collapsed && (
              <SidebarGroupLabel className="nexus-section-label mb-2">
                Menu
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {visibleNavItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.route)}
                      className={cn(
                        "nexus-menu-item",
                        isActive(item.route) && "nexus-menu-item-active"
                      )}
                    >
                      <Link to={item.route}>
                        <DynamicIcon name={item.icon} className="h-5 w-5" />
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
          <SidebarGroup className="mt-6">
            {!collapsed && (
              <SidebarGroupLabel className="nexus-section-label mb-2">
                Administração
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.route}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.route)}
                      className={cn(
                        "nexus-menu-item",
                        isActive(item.route) && "nexus-menu-item-active"
                      )}
                    >
                      <Link to={item.route}>
                        <DynamicIcon name={item.icon} className="h-5 w-5" />
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
          <SidebarGroup className="mt-6">
            {!collapsed && (
              <SidebarGroupLabel className="nexus-section-label mb-2">
                Sistema
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {superAdminItems.map((item) => (
                  <SidebarMenuItem key={item.route}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.route)}
                      className={cn(
                        "nexus-menu-item flex items-center justify-between",
                        isActive(item.route) && "nexus-menu-item-active"
                      )}
                    >
                      <Link to={item.route}>
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5" />
                          {!collapsed && <span>{item.title}</span>}
                        </div>
                        {!collapsed && (
                          <NexusBadge variant="beta" size="sm">
                            ADMIN
                          </NexusBadge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer with workspace pill */}
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="nexus-workspace-pill text-white">
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-sm font-bold">
                {currentTenant?.name?.charAt(0).toUpperCase() || 'N'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {currentTenant?.name || 'Nexus'}
              </p>
              <p className="text-xs opacity-80">Multi-Tenant SaaS</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
