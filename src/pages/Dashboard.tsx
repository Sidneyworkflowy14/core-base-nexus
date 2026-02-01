import { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useRoles } from '@/hooks/useRoles';
import { useDashboard } from '@/hooks/useDashboard';
import { AppLayout } from '@/components/AppLayout';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, LayoutGrid } from 'lucide-react';

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
        <div className="text-muted-foreground">Carregando dashboard...</div>
      </AppLayout>
    );
  }

  const columns = dashboard?.layout_json?.columns || 2;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-muted-foreground">{currentTenant.name}</p>
          </div>

          {isTenantAdmin && (
            <div className="flex items-center gap-2">
              {isEditing && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Colunas:</span>
                  <Select 
                    value={String(columns)} 
                    onValueChange={(v) => updateLayout({ columns: parseInt(v) })}
                  >
                    <SelectTrigger className="w-20">
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
              <Button 
                variant={isEditing ? 'default' : 'outline'} 
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
              </Button>
            </div>
          )}
        </div>

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
