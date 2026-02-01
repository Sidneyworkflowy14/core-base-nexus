import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTenant } from '@/contexts/TenantContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { NexusIconButton } from '@/components/nexus';
import { NexusAvatar } from '@/components/nexus';
import { NexusSearchInput } from '@/components/nexus';
import { LogOut, Bell, Settings, Moon, Sun } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { signOut, user } = useAuth();
  const { currentTenant } = useTenant();
  const { theme, toggleTheme } = useTheme();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Nexus Header */}
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-10">
            {/* Left side - Search */}
            <div className="flex items-center gap-4">
              <NexusSearchInput
                placeholder="Buscar..."
                className="w-80 hidden lg:flex"
              />
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              {/* Theme toggle */}
              <NexusIconButton
                variant="ghost"
                size="md"
                onClick={toggleTheme}
                title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </NexusIconButton>

              {/* Notifications */}
              <NexusIconButton variant="ghost" size="md" showDot>
                <Bell className="h-5 w-5" />
              </NexusIconButton>

              {/* Settings */}
              <NexusIconButton variant="ghost" size="md">
                <Settings className="h-5 w-5" />
              </NexusIconButton>

              {/* User info */}
              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-border">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">
                    {user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentTenant?.name || 'Sem organização'}
                  </p>
                </div>
                <NexusAvatar
                  gradient
                  fallback={user?.email?.charAt(0).toUpperCase()}
                  size="md"
                />
              </div>

              {/* Logout */}
              <NexusIconButton
                variant="ghost"
                size="md"
                onClick={signOut}
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </NexusIconButton>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
