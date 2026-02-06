import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { usePages } from '@/hooks/usePages';
import { useDataSources } from '@/hooks/useDataSources';
import { useRoles } from '@/hooks/useRoles';
import { AppLayout } from '@/components/AppLayout';
import { useOrgPath } from '@/hooks/useOrgPath';
import { BlockRenderer } from '@/components/builder/BlockRenderer';
import { ElementorPageRenderer } from '@/components/elementor/ElementorPageRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Page, Block, FilterParam } from '@/types/builder';
import { Section } from '@/types/elementor';
import { Edit } from 'lucide-react';
import { NexusBadge } from '@/components/nexus';

export default function ViewPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  const { getPageBySlug, getPageById } = usePages();
  const { getDataSourceById, testDataSource } = useDataSources();
  const { isTenantAdmin } = useRoles();
  const { withOrg } = useOrgPath();

  const [page, setPage] = useState<Page | null>(null);
  const [parentSlug, setParentSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<unknown>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(false);

  const loadPage = useCallback(async () => {
    if (!slug || !currentTenant) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const foundPage = await getPageBySlug(slug);

    if (foundPage) {
      setPage(foundPage);
      setNotFound(false);
      if (foundPage.parent_page_id) {
        const parent = await getPageById(foundPage.parent_page_id);
        setParentSlug(parent?.slug || null);
      } else {
        setParentSlug(null);
      }

      // Initialize filter values
      if (foundPage.filter_params) {
        const initial: Record<string, string> = {};
        foundPage.filter_params.forEach((p) => {
          initial[p.key] = '';
        });
        setFilterValues(initial);
      }

      // Load data source if exists
      if (foundPage.data_source_id) {
        await loadData(foundPage.data_source_id, {});
      }
    } else {
      setNotFound(true);
    }
    setLoading(false);
  }, [slug, currentTenant, getPageById, getPageBySlug]);

  const loadData = async (dsId: string, params: Record<string, string>) => {
    const ds = await getDataSourceById(dsId);
    if (!ds) return;

    setLoadingData(true);
    const result = await testDataSource(ds, params);
    if (!result.error) {
      setData(result.data);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const handleFilter = async () => {
    if (!page?.data_source_id) return;
    await loadData(page.data_source_id, filterValues);
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
        <div className="text-muted-foreground">Carregando...</div>
      </AppLayout>
    );
  }

  if (notFound || !page) {
    return (
      <AppLayout>
        <div className="max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Página não encontrada</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                A página "{slug}" não existe ou você não tem permissão para acessá-la.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Support both old (blocks) and new (sections) schema formats
  const sections = (page.schema_json as any)?.sections as Section[] | undefined;
  const sortedBlocks = [...(page.schema_json.blocks || [])].sort((a, b) => a.order - b.order);
  const hasElementorContent = sections && sections.length > 0;
  const hasBlockContent = sortedBlocks.length > 0;
  const hasContent = hasElementorContent || hasBlockContent;

  return (
    <AppLayout>
      <div className="w-full px-6 space-y-6">
        {(isTenantAdmin || parentSlug) && (
          <div className="flex justify-end gap-2">
            {parentSlug && (
              <Button
                variant="outline"
                onClick={() => navigate(withOrg(`/views/${parentSlug}`))}
              >
                Voltar
              </Button>
            )}
            {isTenantAdmin && (
              <Button
                variant="outline"
                onClick={() => navigate(withOrg(`/views/${page.id}/edit`))}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        )}

        {/* Filters */}
        {page.has_filters && page.filter_params && page.filter_params.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                {page.filter_params.map((param: FilterParam) => (
                  <div key={param.key} className="space-y-2">
                    <Label>{param.label}</Label>
                    <Input
                      type={param.type === 'date' ? 'date' : 'text'}
                      value={filterValues[param.key] || ''}
                      onChange={(e) =>
                        setFilterValues({ ...filterValues, [param.key]: e.target.value })
                      }
                      className="w-48"
                    />
                  </div>
                ))}
                <Button onClick={handleFilter} disabled={loadingData}>
                  {loadingData ? 'Carregando...' : 'Aplicar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {!hasContent ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-muted-foreground text-center">
                Esta página ainda não tem conteúdo.
              </p>
            </CardContent>
          </Card>
        ) : hasElementorContent ? (
          <ElementorPageRenderer 
            sections={sections} 
            previewData={data}
            pageId={page.id}
            pageSlug={page.slug}
            pageTitle={page.title}
          />
        ) : (
          <div className="space-y-4">
            {sortedBlocks.map((block: Block) => (
              <BlockRenderer key={block.id} block={block} data={data} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
