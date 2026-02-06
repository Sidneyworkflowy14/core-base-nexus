import { ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { NexusIconButton } from '@/components/nexus';
import { NexusSearchInput } from '@/components/nexus';
import { Bell, Settings, Moon, Sun } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
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

              {/* User info moved to sidebar */}
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
