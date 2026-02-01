import { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useRoles } from '@/hooks/useRoles';
import { useDashboard } from '@/hooks/useDashboard';
import { AppLayout } from '@/components/AppLayout';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { NexusButton, NexusBadge } from '@/components/nexus';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, LayoutGrid, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const { currentTenant } = useTenant();
  const { isTenantAdmin } = useRoles();
  const { 
    dashboard, 
    widgets, 
    loading, 
    addWidget, 
    updateWidget, 
    deleteWidget, 
    reorderWidgets,
    updateLayout 
  } = useDashboard();

  const [isEditing, setIsEditing] = useState(false);

  if (!currentTenant) {
    return (
      <AppLayout>
        <div className="text-muted-foreground">Selecione uma organização primeiro.</div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Carregando dashboard...
        </div>
      </AppLayout>
    );
  }

  const columns = dashboard?.layout_json?.columns || 2;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">Dashboard</h1>
              <NexusBadge variant="success" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {currentTenant.name}
              </NexusBadge>
            </div>
            <p className="text-muted-foreground mt-1">
              Bem-vindo de volta! Aqui está uma visão geral.
            </p>
          </div>

          {isTenantAdmin && (
            <div className="flex items-center gap-3">
              {isEditing && (
                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                  <span className="text-sm text-muted-foreground">Colunas:</span>
                  <Select 
                    value={String(columns)} 
                    onValueChange={(v) => updateLayout({ columns: parseInt(v) })}
                  >
                    <SelectTrigger className="w-16 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <NexusButton 
                variant={isEditing ? 'primary' : 'outline'} 
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <>
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Concluir
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Editar Dashboard
                  </>
                )}
              </NexusButton>
            </div>
          )}
        </div>

        {/* Dashboard Grid */}
        <DashboardGrid
          widgets={widgets}
          isEditing={isEditing}
          onAddWidget={addWidget}
          onUpdateWidget={updateWidget}
          onDeleteWidget={deleteWidget}
          onReorderWidgets={reorderWidgets}
          columns={columns}
        />
      </div>
    </AppLayout>
  );
}
