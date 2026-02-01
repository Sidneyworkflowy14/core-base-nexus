import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useViews } from '@/hooks/useViews';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { View } from '@/types/nav';

export default function ViewPage() {
  const { slug } = useParams<{ slug: string }>();
  const { currentTenant } = useTenant();
  const { getViewBySlug } = useViews();
  const [view, setView] = useState<View | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadView = async () => {
      if (!slug || !currentTenant) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const foundView = await getViewBySlug(slug);
      
      if (foundView) {
        setView(foundView);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };

    loadView();
  }, [slug, currentTenant]);

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

  if (notFound || !view) {
    return (
      <AppLayout>
        <div className="max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>View não encontrada</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                A view "{slug}" não existe ou você não tem permissão para acessá-la.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{view.title}</h1>
          <p className="text-muted-foreground font-mono text-sm">/views/{view.slug}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Conteúdo da View</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(view.content).length === 0 ? (
              <div className="text-muted-foreground">
                <p>Esta view ainda não tem conteúdo.</p>
                <p className="mt-2 text-sm">
                  O page builder será implementado em uma próxima etapa.
                </p>
              </div>
            ) : (
              <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
                {JSON.stringify(view.content, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono">{view.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span>{view.is_published ? 'Publicada' : 'Rascunho'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Criada em:</span>
              <span>{new Date(view.created_at).toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Atualizada em:</span>
              <span>{new Date(view.updated_at).toLocaleString('pt-BR')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
