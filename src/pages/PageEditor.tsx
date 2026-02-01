import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { usePages } from '@/hooks/usePages';
import { useDataSources } from '@/hooks/useDataSources';
import { AppLayout } from '@/components/AppLayout';
import { BlocksPalette } from '@/components/builder/BlocksPalette';
import { EditorCanvas } from '@/components/builder/EditorCanvas';
import { BlockProperties } from '@/components/builder/BlockProperties';
import { Button } from '@/components/ui/button';
import { Block, BlockType, createDefaultBlock, PageSchema } from '@/types/builder';
import { Save, Upload, ArrowLeft, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function PageEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  const { getPageById, saveDraft, publishPage } = usePages();
  const { dataSources, testDataSource, getDataSourceById } = useDataSources();

  const [pageTitle, setPageTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [dataSourceId, setDataSourceId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<unknown>(null);
  const [dataSourceFields, setDataSourceFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const loadPage = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    const page = await getPageById(id);
    if (page) {
      setPageTitle(page.title);
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
        // Extract field names from first item
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
        <div className="text-muted-foreground">Carregando editor...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col -m-6">
        {/* Toolbar */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/views')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-semibold">Editando: {pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            {dataSourceId && (
              <Button variant="outline" size="sm" onClick={handleTestDataSource}>
                <Play className="h-4 w-4 mr-2" />
                Testar Dados
              </Button>
            )}
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Rascunho'}
            </Button>
            <Button onClick={handlePublish} disabled={publishing}>
              <Upload className="h-4 w-4 mr-2" />
              {publishing ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </div>

        {/* Editor panels */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel - Blocks palette */}
          <div className="w-48 border-r overflow-auto">
            <BlocksPalette onAddBlock={handleAddBlock} />
          </div>

          {/* Center - Canvas */}
          <div className="flex-1 flex flex-col overflow-hidden bg-muted/30">
            <EditorCanvas
              blocks={blocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              onMoveBlock={handleMoveBlock}
              onDeleteBlock={handleDeleteBlock}
              data={previewData}
            />
          </div>

          {/* Right panel - Properties */}
          <div className="w-72 border-l overflow-auto">
            <BlockProperties
              block={selectedBlock}
              onUpdate={handleUpdateBlock}
              dataSourceFields={dataSourceFields}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
