// Elementor-style page builder types

export type ColumnWidth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface ElementorElement {
  id: string;
  type: 'section' | 'column' | 'widget';
  settings: Record<string, unknown>;
  children?: ElementorElement[];
}

export interface SectionSettings {
  layout: 'boxed' | 'full';
  gap: 'none' | 'sm' | 'md' | 'lg';
  padding: 'none' | 'sm' | 'md' | 'lg';
  background?: {
    type: 'none' | 'color' | 'gradient';
    color?: string;
    gradient?: string;
  };
}

export interface ColumnSettings {
  width: ColumnWidth;
  verticalAlign: 'start' | 'center' | 'end';
  padding: 'none' | 'sm' | 'md' | 'lg';
}

export type WidgetType = 
  | 'heading'
  | 'text'
  | 'image'
  | 'button'
  | 'spacer'
  | 'divider'
  | 'icon'
  | 'video'
  | 'html'
  | 'table'
  | 'kpi'
  | 'chart';

export interface WidgetSettings {
  // Heading
  text?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  align?: 'left' | 'center' | 'right';
  
  // Text/HTML
  content?: string;
  html?: string;
  css?: string;
  enableScripts?: boolean;
  
  // Image
  src?: string;
  alt?: string;
  size?: 'auto' | 'full' | 'custom';
  
  // Button
  label?: string;
  link?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  
  // Spacer
  height?: number;
  
  // Divider
  style?: 'solid' | 'dashed' | 'dotted';
  width?: 'full' | 'half' | 'third';
  
  // Icon
  icon?: string;
  iconSize?: number;
  iconColor?: string;
  
  // Video
  videoUrl?: string;
  autoplay?: boolean;
  controls?: boolean;
  
  // Table
  title?: string;
  columns?: { key: string; label: string; width?: string }[];
  dataBinding?: { enabled: boolean; field?: string };
  staticData?: Record<string, unknown>[];
  
  // KPI
  value?: string;
  format?: 'number' | 'currency' | 'percent';
  prefix?: string;
  suffix?: string;
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  field?: string;
  
  // Chart
  chartType?: 'bar' | 'line' | 'pie';
  labelField?: string;
  valueField?: string;
  chartData?: { label: string; value: number }[];
}

export interface Section {
  id: string;
  type: 'section';
  settings: SectionSettings;
  children: Column[];
}

export interface Column {
  id: string;
  type: 'column';
  settings: ColumnSettings;
  children: Widget[];
}

export interface Widget {
  id: string;
  type: 'widget';
  widgetType: WidgetType;
  settings: WidgetSettings;
}

export interface ElementorSchema {
  sections: Section[];
}

// Widget definitions for the palette
export const WIDGET_CATEGORIES = [
  {
    name: 'Básico',
    widgets: [
      { type: 'heading' as WidgetType, label: 'Título', icon: 'heading' },
      { type: 'text' as WidgetType, label: 'Texto', icon: 'align-left' },
      { type: 'image' as WidgetType, label: 'Imagem', icon: 'image' },
      { type: 'button' as WidgetType, label: 'Botão', icon: 'square' },
      { type: 'spacer' as WidgetType, label: 'Espaçador', icon: 'move-vertical' },
      { type: 'divider' as WidgetType, label: 'Divisor', icon: 'minus' },
    ],
  },
  {
    name: 'Dados',
    widgets: [
      { type: 'table' as WidgetType, label: 'Tabela', icon: 'table' },
      { type: 'kpi' as WidgetType, label: 'KPI', icon: 'gauge' },
      { type: 'chart' as WidgetType, label: 'Gráfico', icon: 'chart-bar' },
    ],
  },
  {
    name: 'Avançado',
    widgets: [
      { type: 'html' as WidgetType, label: 'HTML', icon: 'code' },
      { type: 'icon' as WidgetType, label: 'Ícone', icon: 'star' },
      { type: 'video' as WidgetType, label: 'Vídeo', icon: 'play' },
    ],
  },
];

// Column presets
export const COLUMN_PRESETS = [
  { label: '1 Coluna', columns: [12] },
  { label: '2 Colunas', columns: [6, 6] },
  { label: '3 Colunas', columns: [4, 4, 4] },
  { label: '4 Colunas', columns: [3, 3, 3, 3] },
  { label: '2/3 + 1/3', columns: [8, 4] },
  { label: '1/3 + 2/3', columns: [4, 8] },
  { label: '1/4 + 1/2 + 1/4', columns: [3, 6, 3] },
];

// Create default elements
export function createSection(columnWidths: ColumnWidth[] = [12]): Section {
  return {
    id: crypto.randomUUID(),
    type: 'section',
    settings: {
      layout: 'boxed',
      gap: 'md',
      padding: 'md',
    },
    children: columnWidths.map((width) => createColumn(width)),
  };
}

export function createColumn(width: ColumnWidth = 12): Column {
  return {
    id: crypto.randomUUID(),
    type: 'column',
    settings: {
      width,
      verticalAlign: 'start',
      padding: 'sm',
    },
    children: [],
  };
}

export function createWidget(widgetType: WidgetType): Widget {
  const defaults: Record<WidgetType, WidgetSettings> = {
    heading: { text: 'Título', level: 2, align: 'left' },
    text: { content: 'Digite seu texto aqui...' },
    image: { src: '', alt: '', size: 'auto' },
    button: { label: 'Clique aqui', link: '#', variant: 'primary' },
    spacer: { height: 40 },
    divider: { style: 'solid', width: 'full' },
    icon: { icon: 'star', iconSize: 48 },
    video: { videoUrl: '', autoplay: false, controls: true },
    html: { 
      html: '<div class="custom">Conteúdo customizado</div>',
      css: '.custom { padding: 1rem; }',
      enableScripts: false,
    },
    table: { 
      title: 'Tabela',
      columns: [{ key: 'col1', label: 'Coluna 1' }],
      dataBinding: { enabled: false },
    },
    kpi: { 
      title: 'KPI',
      value: '0',
      format: 'number',
    },
    chart: {
      title: 'Gráfico',
      chartType: 'bar',
      chartData: [
        { label: 'Item 1', value: 10 },
        { label: 'Item 2', value: 20 },
      ],
    },
  };

  return {
    id: crypto.randomUUID(),
    type: 'widget',
    widgetType,
    settings: defaults[widgetType] || {},
  };
}
