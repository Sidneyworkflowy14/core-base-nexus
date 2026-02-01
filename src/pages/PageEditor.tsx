import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { usePages } from '@/hooks/usePages';
import { useDataSources } from '@/hooks/useDataSources';
import { ElementorEditor } from '@/components/elementor';
import { Section, ElementorSchema } from '@/types/elementor';
import { toast } from 'sonner';

export default function PageEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  const { getPageById, updatePage, publishPage } = usePages();
  const { testDataSource, getDataSourceById } = useDataSources();

  const [pageTitle, setPageTitle] = useState('');
  const [pageStatus, setPageStatus] = useState<'draft' | 'published'>('draft');
  const [sections, setSections] = useState<Section[]>([]);
  const [dataSourceId, setDataSourceId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<unknown>(null);
  const [dataSourceFields, setDataSourceFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPage = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    const page = await getPageById(id);
    if (page) {
      setPageTitle(page.title);
      setPageStatus(page.status as 'draft' | 'published');
      setDataSourceId(page.data_source_id);
      
      // Try to load Elementor schema, fallback to empty
      const schema = page.schema_json as any;
      if (schema?.sections) {
        setSections(schema.sections);
      } else {
        setSections([]);
      }
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

  const handleSave = async (newSections: Section[]) => {
    if (!id) return;
    
    try {
      const schema: ElementorSchema = { sections: newSections };
      await updatePage(id, { schema_json: schema as any });
      setSections(newSections);
      toast.success('Rascunho salvo!');
    } catch (error) {
      toast.error('Erro ao salvar rascunho');
    }
  };

  const handlePublish = async (newSections: Section[]) => {
    if (!id) return;
    
    try {
      const schema: ElementorSchema = { sections: newSections };
      await publishPage(id, schema as any);
      setSections(newSections);
      setPageStatus('published');
      toast.success('Página publicada!');
    } catch (error) {
      toast.error('Erro ao publicar');
    }
  };

  const handleTestData = async () => {
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
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        Selecione uma organização primeiro.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        Carregando editor...
      </div>
    );
  }

  return (
    <ElementorEditor
      initialSections={sections}
      pageTitle={pageTitle}
      pageStatus={pageStatus}
      dataSourceFields={dataSourceFields}
      previewData={previewData}
      onSave={handleSave}
      onPublish={handlePublish}
      onBack={() => navigate('/views')}
      onTestData={handleTestData}
      hasDataSource={!!dataSourceId}
    />
  );
}
