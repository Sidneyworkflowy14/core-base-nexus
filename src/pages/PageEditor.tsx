import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { usePages } from '@/hooks/usePages';
import { useDataSources } from '@/hooks/useDataSources';
import { AppLayout } from '@/components/AppLayout';
import { BlocksPalette } from '@/components/builder/BlocksPalette';
import { EditorCanvas } from '@/components/builder/EditorCanvas';
import { BlockProperties } from '@/components/builder/BlockProperties';
import { NexusButton, NexusCard, NexusCardHeader, NexusCardTitle, NexusBadge, NexusTabs, NexusTabsList, NexusTabsTrigger, NexusTabsContent } from '@/components/nexus';
import { Block, BlockType, createDefaultBlock, PageSchema } from '@/types/builder';
import { Save, Upload, ArrowLeft, Play, Layers, Settings2, Database, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function PageEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  const { getPageById, saveDraft, publishPage } = usePages();
  const { dataSources, testDataSource, getDataSourceById } = useDataSources();

  const [pageTitle, setPageTitle] = useState('');
  const [pageStatus, setPageStatus] = useState('draft');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [dataSourceId, setDataSourceId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<unknown>(null);
  const [dataSourceFields, setDataSourceFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('properties');

  const loadPage = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    const page = await getPageById(id);
    if (page) {
      setPageTitle(page.title);
      setPageStatus(page.status);
      setBlocks(page.schema_json.blocks || []);
      setDataSourceId(page.data_source_id);
    }
    setLoading(false);
  }, [id, getPageById]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  // Load data source fields when data source changes
  useEffect(() => {
    const loadDataSourcePreview = async () => {
      if (!dataSourceId) {
        setPreviewData(null);
        setDataSourceFields([]);
        return;
      }

      const ds = await getDataSourceById(dataSourceId);
      if (!ds) return;

      const result = await testDataSource(ds);
      if (result.data) {
        setPreviewData(result.data);
        const firstItem = Array.isArray(result.data) ? result.data[0] : result.data;
        if (firstItem && typeof firstItem === 'object') {
          setDataSourceFields(Object.keys(firstItem));
        }
      }
    };

    loadDataSourcePreview();
  }, [dataSourceId, getDataSourceById, testDataSource]);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  const handleAddBlock = (type: BlockType) => {
    const maxOrder = blocks.reduce((max, b) => Math.max(max, b.order), -1);
    const newBlock = createDefaultBlock(type, maxOrder + 1);
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setRightPanelTab('properties');
  };

  const handleUpdateBlock = (updatedBlock: Block) => {
    setBlocks(blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)));
  };

  const handleMoveBlock = (id: string, direction: 'up' | 'down') => {
    const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
    const index = sortedBlocks.findIndex((b) => b.id === id);
    if (index === -1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sortedBlocks.length) return;

    const currentOrder = sortedBlocks[index].order;
    const swapOrder = sortedBlocks[swapIndex].order;

    setBlocks(
      blocks.map((b) => {
        if (b.id === sortedBlocks[index].id) return { ...b, order: swapOrder };
        if (b.id === sortedBlocks[swapIndex].id) return { ...b, order: currentOrder };
        return b;
      })
    );
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  };

  const handleSaveDraft = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const schema: PageSchema = { blocks };
      await saveDraft(id, schema);
      toast.success('Rascunho salvo!');
    } catch (error) {
      toast.error('Erro ao salvar rascunho');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    setPublishing(true);
    try {
      const schema: PageSchema = { blocks };
      await publishPage(id, schema);
      setPageStatus('published');
      toast.success('Página publicada!');
    } catch (error) {
      toast.error('Erro ao publicar');
    } finally {
      setPublishing(false);
    }
  };

  const handleTestDataSource = async () => {
    if (!dataSourceId) return;
    const ds = await getDataSourceById(dataSourceId);
    if (!ds) return;

    const result = await testDataSource(ds);
    if (result.error) {
      toast.error(`Erro: ${result.error}`);
    } else {
      setPreviewData(result.data);
      toast.success('Dados carregados!');
    }
  };

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
          Carregando editor...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col -m-6">
        {/* Elementor-style Toolbar */}
        <div className="h-14 border-b border-border bg-card px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <NexusButton variant="ghost" size="icon" onClick={() => navigate('/views')}>
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
            {dataSourceId && (
              <NexusButton variant="outline" size="sm" onClick={handleTestDataSource}>
                <Play className="h-4 w-4 mr-2" />
                Testar Dados
              </NexusButton>
            )}
            <NexusButton variant="outline" onClick={handleSaveDraft} loading={saving}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </NexusButton>
            <NexusButton onClick={handlePublish} loading={publishing}>
              <Upload className="h-4 w-4 mr-2" />
              Publicar
            </NexusButton>
          </div>
        </div>

        {/* Main Editor Area - 3 Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Elements Palette */}
          <div className="w-64 border-r border-border bg-card overflow-y-auto scrollbar-thin">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Elementos
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Arraste ou clique para adicionar
              </p>
            </div>
            <BlocksPalette onAddBlock={handleAddBlock} />
          </div>

          {/* Center - Canvas */}
          <div className="flex-1 flex flex-col overflow-hidden bg-muted/30">
            {/* Canvas Header */}
            <div className="h-10 bg-background border-b border-border flex items-center justify-center gap-4 px-4">
              <NexusBadge variant="muted">
                {blocks.length} elemento{blocks.length !== 1 ? 's' : ''}
              </NexusBadge>
              {dataSourceId && (
                <NexusBadge variant="outline" className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Data Source conectado
                </NexusBadge>
              )}
            </div>
            
            {/* Canvas Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-4xl mx-auto">
                <EditorCanvas
                  blocks={blocks}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={setSelectedBlockId}
                  onMoveBlock={handleMoveBlock}
                  onDeleteBlock={handleDeleteBlock}
                  data={previewData}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - Properties & Data Binding */}
          <div className="w-80 border-l border-border bg-card overflow-hidden flex flex-col">
            <NexusTabs value={rightPanelTab} onValueChange={setRightPanelTab} className="flex-1 flex flex-col">
              <div className="border-b border-border px-2">
                <NexusTabsList className="w-full">
                  <NexusTabsTrigger value="properties" className="flex-1">
                    <Settings2 className="h-4 w-4 mr-1" />
                    Propriedades
                  </NexusTabsTrigger>
                  <NexusTabsTrigger value="data" className="flex-1">
                    <Database className="h-4 w-4 mr-1" />
                    Dados
                  </NexusTabsTrigger>
                </NexusTabsList>
              </div>

              <NexusTabsContent value="properties" className="flex-1 overflow-y-auto scrollbar-thin mt-0">
                <BlockProperties
                  block={selectedBlock}
                  onUpdate={handleUpdateBlock}
                  dataSourceFields={dataSourceFields}
                />
              </NexusTabsContent>

              <NexusTabsContent value="data" className="flex-1 overflow-y-auto scrollbar-thin mt-0 p-4">
                <NexusCard>
                  <NexusCardHeader>
                    <NexusCardTitle className="text-sm">Campos Disponíveis</NexusCardTitle>
                  </NexusCardHeader>
                  <div className="p-4 pt-0">
                    {dataSourceFields.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhum data source conectado ou sem campos disponíveis.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {dataSourceFields.map((field) => (
                          <div
                            key={field}
                            className="px-3 py-2 bg-muted rounded-md text-sm font-mono cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => {
                              navigator.clipboard.writeText(`{{${field}}}`);
                              toast.success(`{{${field}}} copiado!`);
                            }}
                          >
                            {`{{${field}}}`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </NexusCard>

                {previewData && (
                  <NexusCard className="mt-4">
                    <NexusCardHeader>
                      <NexusCardTitle className="text-sm flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Preview dos Dados
                      </NexusCardTitle>
                    </NexusCardHeader>
                    <div className="p-4 pt-0">
                      <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64">
                        {JSON.stringify(previewData, null, 2).slice(0, 1000)}
                        {JSON.stringify(previewData, null, 2).length > 1000 && '...'}
                      </pre>
                    </div>
                  </NexusCard>
                )}
              </NexusTabsContent>
            </NexusTabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
