import { NexusButton, NexusBadge } from '@/components/nexus';
import { ArrowLeft, Save, Upload, Play, Eye } from 'lucide-react';

interface ElementorToolbarProps {
  pageTitle: string;
  pageStatus: 'draft' | 'published';
  saving: boolean;
  publishing: boolean;
  hasDataSource?: boolean;
  onBack: () => void;
  onSave: () => void;
  onPublish: () => void;
  onTestData?: () => void;
}

export function ElementorToolbar({
  pageTitle,
  pageStatus,
  saving,
  publishing,
  hasDataSource,
  onBack,
  onSave,
  onPublish,
  onTestData,
}: ElementorToolbarProps) {
  return (
    <div className="h-14 border-b border-border bg-card px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <NexusButton variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </NexusButton>
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-lg">{pageTitle}</h1>
          <NexusBadge variant={pageStatus === 'published' ? 'success' : 'warning'}>
            {pageStatus === 'published' ? 'Publicada' : 'Rascunho'}
          </NexusBadge>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {hasDataSource && onTestData && (
          <NexusButton variant="outline" size="sm" onClick={onTestData}>
            <Play className="h-4 w-4 mr-2" />
            Testar Dados
          </NexusButton>
        )}
        <NexusButton variant="outline" onClick={onSave} loading={saving}>
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </NexusButton>
        <NexusButton onClick={onPublish} loading={publishing}>
          <Upload className="h-4 w-4 mr-2" />
          Publicar
        </NexusButton>
      </div>
    </div>
  );
}
