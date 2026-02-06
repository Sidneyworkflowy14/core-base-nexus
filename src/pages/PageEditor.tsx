import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { usePages } from '@/hooks/usePages';
import { useDataSources } from '@/hooks/useDataSources';
import { ElementorEditor } from '@/components/elementor';
import { Section, ElementorSchema } from '@/types/elementor';
import { toast } from 'sonner';
import { useOrgPath } from '@/hooks/useOrgPath';

export default function PageEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  const { getPageById, updatePage, publishPage } = usePages();
  const { testDataSource, getDataSourceById } = useDataSources();
  const { withOrg } = useOrgPath();

  const [pageTitle, setPageTitle] = useState('');
  const [pageStatus, setPageStatus] = useState<'draft' | 'published'>('draft');
  const [sections, setSections] = useState<Section[]>([]);
  const [dataSourceId, setDataSourceId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<unknown>(null);
  const [dataSourceFields, setDataSourceFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs to prevent multiple calls
  const loadedRef = useRef(false);
  const loadingRef = useRef(false);

  // Load page data only once
  useEffect(() => {
    if (!id || !currentTenant || loadedRef.current || loadingRef.current) return;

    const loadPage = async () => {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      try {
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
          loadedRef.current = true;
        } else {
          setError('Página não encontrada');
        }
      } catch (err) {
        console.error('Error loading page:', err);
        // Ignore AbortError as it's expected during cleanup
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError('Erro ao carregar página');
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    loadPage();
  }, [id, currentTenant]); // Remove getPageById from dependencies

  // Load data source fields when data source changes
  useEffect(() => {
    if (!dataSourceId || !loadedRef.current) {
      setPreviewData(null);
      setDataSourceFields([]);
      return;
    }

    let cancelled = false;

    const loadDataSourcePreview = async () => {
      try {
        const ds = await getDataSourceById(dataSourceId);
        if (!ds || cancelled) return;

        const result = await testDataSource(ds);
        if (cancelled) return;
        
        if (result.data) {
          setPreviewData(result.data);
          const firstItem = Array.isArray(result.data) ? result.data[0] : result.data;
          if (firstItem && typeof firstItem === 'object') {
            setDataSourceFields(Object.keys(firstItem));
          }
        }
      } catch (err) {
        console.error('Error loading data source:', err);
      }
    };

    loadDataSourcePreview();
    
    return () => {
      cancelled = true;
    };
  }, [dataSourceId]); // Remove function dependencies

  const handleSave = async (newSections: Section[]) => {
    if (!id) return;
    
    try {
      const schema: ElementorSchema = { sections: newSections };
      await updatePage(id, { schema_json: schema as any });
      setSections(newSections);
      toast.success('Rascunho salvo!');
    } catch (err) {
      console.error('Error saving:', err);
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
    } catch (err) {
      console.error('Error publishing:', err);
      toast.error('Erro ao publicar');
    }
  };

  const handleTestData = async () => {
    if (!dataSourceId) return;
    
    try {
      const ds = await getDataSourceById(dataSourceId);
      if (!ds) return;

      const result = await testDataSource(ds);
      if (result.error) {
        toast.error(`Erro: ${result.error}`);
      } else {
        setPreviewData(result.data);
        toast.success('Dados carregados!');
      }
    } catch (err) {
      console.error('Error testing data:', err);
      toast.error('Erro ao carregar dados');
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

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <button 
          onClick={() => navigate(withOrg('/views'))}
          className="text-primary hover:underline"
        >
          Voltar para Views
        </button>
      </div>
    );
  }

  // Get page slug for context
  const pageSlug = id ? undefined : undefined; // We don't have slug in this context directly
  
  return (
    <ElementorEditor
      initialSections={sections}
      pageId={id}
      pageTitle={pageTitle}
      pageStatus={pageStatus}
      dataSourceFields={dataSourceFields}
      previewData={previewData}
      onSave={handleSave}
      onPublish={handlePublish}
      onBack={() => navigate(withOrg('/views'))}
      onTestData={handleTestData}
      hasDataSource={!!dataSourceId}
    />
  );
}
