// Block types for the page builder

export type BlockType = 'heading' | 'text' | 'table' | 'kpi' | 'chart' | 'html';

export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  props: {
    text: string;
    level: 1 | 2 | 3 | 4;
  };
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  props: {
    content: string;
  };
}

export interface TableBlock extends BaseBlock {
  type: 'table';
  props: {
    title?: string;
    columns: {
      key: string;
      label: string;
      width?: string;
    }[];
    dataBinding?: {
      enabled: boolean;
      field?: string; // field from data source to use as array
    };
    staticData?: Record<string, unknown>[];
  };
}

export interface KpiBlock extends BaseBlock {
  type: 'kpi';
  props: {
    title: string;
    value?: string;
    dataBinding?: {
      enabled: boolean;
      field?: string;
      aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
    };
    format?: 'number' | 'currency' | 'percent';
    prefix?: string;
    suffix?: string;
  };
}

export interface ChartBlock extends BaseBlock {
  type: 'chart';
  props: {
    title?: string;
    chartType: 'bar' | 'line' | 'pie';
    dataBinding?: {
      enabled: boolean;
      labelField?: string;
      valueField?: string;
    };
    staticData?: { label: string; value: number }[];
  };
}

export interface HtmlBlock extends BaseBlock {
  type: 'html';
  props: {
    html: string;
    css?: string;
    enableScripts?: boolean;
  };
}

export type Block = HeadingBlock | TextBlock | TableBlock | KpiBlock | ChartBlock | HtmlBlock;

export interface PageSchema {
  blocks: Block[];
}

export interface Page {
  id: string;
  tenant_id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  schema_json: PageSchema;
  version: number;
  data_source_id: string | null;
  has_filters: boolean;
  filter_params: FilterParam[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PageVersion {
  id: string;
  tenant_id: string;
  page_id: string;
  version: number;
  schema_json: PageSchema;
  created_at: string;
  created_by: string | null;
}

export interface FilterParam {
  key: string;
  label: string;
  type: 'text' | 'date' | 'select';
  options?: string[];
}

export type DataSourceType = 'supabase_table' | 'n8n_http';

export interface SupabaseTableConfig {
  table_name: string;
  columns?: string[];
  filters?: { column: string; operator: string; value: string }[];
}

export interface N8nHttpConfig {
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
}

export interface DataSource {
  id: string;
  tenant_id: string;
  name: string;
  type: DataSourceType;
  config: SupabaseTableConfig | N8nHttpConfig;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Block definitions for the editor
export const BLOCK_DEFINITIONS: { type: BlockType; label: string; icon: string; description?: string }[] = [
  { type: 'heading', label: 'Título', icon: 'heading', description: 'Cabeçalho H1-H4' },
  { type: 'text', label: 'Texto', icon: 'text', description: 'Parágrafo de texto' },
  { type: 'table', label: 'Tabela', icon: 'table', description: 'Tabela de dados' },
  { type: 'kpi', label: 'KPI', icon: 'gauge', description: 'Indicador numérico' },
  { type: 'chart', label: 'Gráfico', icon: 'chart-bar', description: 'Gráfico de barras/linha/pizza' },
  { type: 'html', label: 'HTML/CSS', icon: 'code', description: 'Código customizado' },
];

// Create default block
export function createDefaultBlock(type: BlockType, order: number): Block {
  const id = crypto.randomUUID();
  
  switch (type) {
    case 'heading':
      return {
        id,
        type: 'heading',
        order,
        props: { text: 'Novo Título', level: 2 },
      };
    case 'text':
      return {
        id,
        type: 'text',
        order,
        props: { content: 'Digite o texto aqui...' },
      };
    case 'table':
      return {
        id,
        type: 'table',
        order,
        props: {
          title: 'Tabela',
          columns: [
            { key: 'col1', label: 'Coluna 1' },
            { key: 'col2', label: 'Coluna 2' },
          ],
          dataBinding: { enabled: false },
          staticData: [],
        },
      };
    case 'kpi':
      return {
        id,
        type: 'kpi',
        order,
        props: {
          title: 'KPI',
          value: '0',
          dataBinding: { enabled: false },
          format: 'number',
        },
      };
    case 'chart':
      return {
        id,
        type: 'chart',
        order,
        props: {
          title: 'Gráfico',
          chartType: 'bar',
          dataBinding: { enabled: false },
          staticData: [
            { label: 'Item 1', value: 10 },
            { label: 'Item 2', value: 20 },
          ],
        },
      };
    case 'html':
      return {
        id,
        type: 'html',
        order,
        props: {
          html: `<div class="custom-block">
  <h3>Bloco Customizado</h3>
  <p>Edite o HTML, CSS e scripts conforme necessário.</p>
</div>`,
          css: `.custom-block {
  padding: 1rem;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.custom-block h3 {
  margin: 0 0 0.5rem 0;
}
.custom-block p {
  margin: 0;
  opacity: 0.9;
}`,
          enableScripts: false,
        },
      };
  }
}
