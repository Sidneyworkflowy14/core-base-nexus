import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Menu, ChevronDown, User, LogOut, Circle } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavItems } from '@/hooks/useNavItems';
import { useBranding } from '@/hooks/useBranding';
import { usePages } from '@/hooks/usePages';
import { DynamicIcon } from './DynamicIcon';
import { NexusBadge } from '@/components/nexus';
import { useOrgPath } from '@/hooks/useOrgPath';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
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
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const { currentTenant, userTenants } = useTenant();
  const { user, signOut } = useAuth();
  const { isTenantAdmin, isSuperAdmin } = useRoles();
  const { visibleNavItems } = useNavItems();
  const { logoUrl } = useBranding();
  const { pages } = usePages();
  const { orgSlug, withOrg } = useOrgPath();
  const [availability, setAvailability] = useState<'online' | 'away' | 'offline'>('online');
  const [autoOffline, setAutoOffline] = useState(true);

  // Get published pages for sidebar (exclude subviews)
  const publishedPages = pages.filter((p) => p.status === 'published' && !p.parent_page_id);

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

  const toOrgRoute = (route: string) => {
    if (!orgSlug) return route;
    if (route.startsWith('http')) return route;
    if (route.startsWith(`/${orgSlug}/`) || route === `/${orgSlug}`) return route;
    if (route.startsWith('/')) return `/${orgSlug}${route}`;
    return `/${orgSlug}/${route}`;
  };

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

      <SidebarContent className={cn("scrollbar-thin py-4", collapsed ? "px-1" : "px-3")}>
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
                    <Link to={toOrgRoute(item.route)}>
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
                      isActive={isActive(withOrg(`/views/${page.slug}`))}
                      className={cn(
                        "nexus-menu-item",
                        isActive(withOrg(`/views/${page.slug}`)) && "nexus-menu-item-active"
                      )}
                    >
                      <Link to={withOrg(`/views/${page.slug}`)}>
                        <DynamicIcon name={page.icon || 'file'} className="h-5 w-5" />
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
                      isActive={isActive(toOrgRoute(item.route))}
                      className={cn(
                        "nexus-menu-item",
                        isActive(toOrgRoute(item.route)) && "nexus-menu-item-active"
                      )}
                    >
                      <Link to={toOrgRoute(item.route)}>
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
                      isActive={isActive(toOrgRoute(item.route))}
                      className={cn(
                        "nexus-menu-item",
                        isActive(toOrgRoute(item.route)) && "nexus-menu-item-active"
                      )}
                    >
                      <Link to={toOrgRoute(item.route)}>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="nexus-workspace-pill text-white w-full">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="text-sm font-bold">
                    {(user?.email?.charAt(0) || 'U').toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">
                    {user?.user_metadata?.full_name ||
                      user?.user_metadata?.name ||
                      user?.email?.split('@')[0] ||
                      'Usuário'}
                  </p>
                  <p className="text-xs opacity-80 truncate">
                    {currentTenant?.name || 'Sem organização'}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 opacity-80" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Disponibilidade</DropdownMenuLabel>
              <div className="px-2 py-2 space-y-2">
                {[
                  { key: 'online', label: 'Online', color: 'text-emerald-500' },
                  { key: 'away', label: 'Ausente', color: 'text-yellow-500' },
                  { key: 'offline', label: 'Offline', color: 'text-muted-foreground' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="w-full flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted"
                    onClick={() => setAvailability(item.key as typeof availability)}
                  >
                    <span className="flex items-center gap-2">
                      <Circle className={`h-2.5 w-2.5 ${item.color}`} />
                      {item.label}
                    </span>
                    {availability === item.key && <span className="text-xs">Selecionado</span>}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs text-muted-foreground">Marcar offline automaticamente</span>
                <Switch checked={autoOffline} onCheckedChange={setAutoOffline} />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(withOrg('/profile'))}>
                <User className="h-4 w-4 mr-2" />
                Editar perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Encerrar sessão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
