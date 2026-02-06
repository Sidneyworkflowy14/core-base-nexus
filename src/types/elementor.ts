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
  fullHeight?: boolean;
  flow?: 'stack' | 'row';
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
  | 'iframe'
  | 'subsection'
  | 'filters_header'
  | 'filters_result_list'
  | 'table'
  | 'kpi'
  | 'chart'
  | 'input_text'
  | 'input_select'
  | 'input_boolean';

// Common style properties for all widgets (Elementor-style)
export interface WidgetStyleSettings {
  // Alignment
  alignSelf?: 'auto' | 'start' | 'center' | 'end' | 'stretch';
  textAlign?: 'left' | 'center' | 'right';
  justifyContent?: 'start' | 'center' | 'end';
  
  // Sizing
  width?: 'auto' | 'full' | 'custom';
  customWidth?: number;
  widthUnit?: 'px' | '%' | 'vw';
  height?: 'auto' | 'custom';
  customHeight?: number;
  heightUnit?: 'px' | '%' | 'vh';
  minHeight?: number;
  maxWidth?: number;
  
  // Margin
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginUnit?: 'px' | '%';
  marginLinked?: boolean;
  
  // Padding
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingUnit?: 'px' | '%';
  paddingLinked?: boolean;
  
  // Border
  borderWidth?: number;
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
  borderColor?: string;
  borderRadius?: number;
  
  // Background
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: 'cover' | 'contain' | 'auto';
  backgroundPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  
  // Effects
  opacity?: number;
  boxShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  
  // Responsive visibility
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
}

export interface WidgetSettings {
  // Common style settings
  widgetStyle?: WidgetStyleSettings;
  
  // Heading
  text?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  align?: 'left' | 'center' | 'right';
  headingIcon?: string;
  headingIconPosition?: 'left' | 'right';
  
  // Text/HTML
  content?: string;
  html?: string;
  htmlJs?: string;
  css?: string;
  enableScripts?: boolean;

  // Iframe
  iframeUrl?: string;
  iframeHtml?: string;
  iframeHeight?: number;
  iframeUseUiKit?: boolean;
  iframeSendContext?: boolean;
  
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
  dividerStyle?: 'solid' | 'dashed' | 'dotted';
  width?: 'full' | 'half' | 'third';
  
  // Icon
  icon?: string;
  iconSize?: number;
  iconColor?: string;
  
  // Video
  videoUrl?: string;
  autoplay?: boolean;
  controls?: boolean;

  // Inputs
  inputLabel?: string;
  placeholder?: string;
  options?: string[];
  buttonLabel?: string;
  trueLabel?: string;
  falseLabel?: string;
  buttonRequiresFilters?: boolean;
  buttonAction?: 'none' | 'navigate';
  buttonTargetPageId?: string;
  
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
  filterLabel?: string;
  useFilterResult?: boolean;
  kpiFilterOptionIndex?: number;
  kpiFilterDisplayMode?: 'label' | 'value';

  // Filters Header
  filtersEndpoint?: string;
  filterFields?: {
    key: string;
    label: string;
    type: 'text' | 'number' | 'list' | 'boolean';
    numberFormat?: 'number' | 'currency' | 'percent';
    options?: { label: string; value: string }[] | string[];
    optionsEndpoint?: string;
    dependsOn?: string;
    dependsParam?: string;
    lockOnAutoFill?: boolean;
  }[];
  filtersTitleIcon?: string;
  filtersTitleIconPosition?: 'left' | 'right';
  filtersLayout?: 'grid' | 'inline';
  filtersColumns?: 1 | 2 | 3 | 4;
  filtersPeriodPlacement?: 'right' | 'below';
  filtersButtonPlacement?: 'right' | 'below';
  filtersShowPeriod?: boolean;
  filtersShowApply?: boolean;
  filtersAutoApply?: boolean;
  filtersAutoApplyRequireAll?: boolean;
  filtersOptionsFallback?: 'field' | 'block' | 'none';
  filtersSendContext?: boolean;
  filtersPaymentPopup?: boolean;
  filtersPaymentTotalKey?: string;
  filtersAutoOptions?: boolean;
  filtersPaymentSubmitEndpoint?: string;
  filtersPaymentTicketEndpoint?: string;
  filtersEndpointPrefill?: boolean;
  filtersEndpointPrefillMap?: Record<string, string>;
  filtersUseCard?: boolean;

  // Filters Result List
  filtersResultTitle?: string;
  filtersResultKey?: string;
  filtersResultTargetKey?: string;
  filtersResultEmptyMessage?: string;
  filtersResultDisplayMode?: 'label' | 'value';
  filtersResultValueMode?: 'label' | 'value';

  // Subsection (nested layout)
  subsectionColumns?: Column[];
  subsectionGap?: 'none' | 'sm' | 'md' | 'lg';
  subsectionPadding?: 'none' | 'sm' | 'md' | 'lg';
  subsectionUseCard?: boolean;
  
  // Chart
  chartType?: 'bar' | 'line' | 'pie';
  labelField?: string;
  valueField?: string;
  chartData?: { label: string; value: number }[];
  
  // Data URL binding (for KPI, Chart, Table)
  dataUrl?: string;
  dataUrlFields?: string[];  // Fields available from the URL response
  dataUrlMetrics?: string[];  // Metrics available when using label/value format
  selectedValueField?: string;  // Which field to use for value
  selectedLabelField?: string;  // Which field to use for label (charts)
  selectedMetric?: string;  // Which metric (label value) to use for label/value format
  refreshInterval?: number;  // Auto-refresh interval in seconds (0 = manual)
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
      { type: 'filters_header' as WidgetType, label: 'Cabeçalho Filtros', icon: 'sliders' },
      { type: 'filters_result_list' as WidgetType, label: 'Opções do Cabeçalho', icon: 'list' },
      { type: 'input_text' as WidgetType, label: 'Texto', icon: 'edit' },
      { type: 'input_select' as WidgetType, label: 'Select', icon: 'list' },
      { type: 'input_boolean' as WidgetType, label: 'Booleano', icon: 'check' },
    ],
  },
  {
    name: 'Avançado',
    widgets: [
      { type: 'html' as WidgetType, label: 'HTML', icon: 'code' },
      { type: 'iframe' as WidgetType, label: 'Iframe (UI Kit)', icon: 'code' },
      { type: 'icon' as WidgetType, label: 'Ícone', icon: 'star' },
      { type: 'video' as WidgetType, label: 'Vídeo', icon: 'play' },
      { type: 'subsection' as WidgetType, label: 'Sub-seção', icon: 'layout' },
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
      fullHeight: false,
      flow: 'stack',
    },
    children: [],
  };
}

export function createWidget(widgetType: WidgetType): Widget {
  const defaults: Record<WidgetType, WidgetSettings> = {
    heading: { text: 'Título', level: 2, align: 'left', headingIcon: '', headingIconPosition: 'left' },
    text: { content: 'Digite seu texto aqui...' },
    image: { src: '', alt: '', size: 'auto' },
    button: { label: 'Clique aqui', link: '#', variant: 'primary', buttonRequiresFilters: false, buttonAction: 'none' },
    spacer: { height: 40 },
    divider: { dividerStyle: 'solid', width: 'full' },
    icon: { icon: 'star', iconSize: 48 },
    video: { videoUrl: '', autoplay: false, controls: true },
    html: { 
      html: '<div class="nexus-card"><div class="flex items-center justify-between"><div class="text-lg font-semibold">Título</div><span class="nexus-badge-blue">Beta</span></div><p class="text-muted-foreground mt-2">Descrição usando o UI Kit.</p><button class="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground">Ação</button></div>',
      htmlJs: '',
    },
    iframe: {
      iframeUrl: '',
      iframeHtml: '',
      iframeHeight: 320,
      iframeUseUiKit: true,
      iframeSendContext: false,
    },
    subsection: {
      subsectionColumns: [createColumn(6), createColumn(6)],
      subsectionGap: 'md',
      subsectionPadding: 'sm',
      subsectionUseCard: false,
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
      kpiFilterOptionIndex: 0,
      kpiFilterDisplayMode: 'label',
    },
    filters_header: {
      filtersEndpoint: '',
      filterFields: [
        { key: 'campo1', label: 'Campo 1', type: 'text' },
        { key: 'campo2', label: 'Campo 2', type: 'text' },
      ],
      filtersLayout: 'grid',
      filtersColumns: 2,
      filtersPeriodPlacement: 'right',
      filtersButtonPlacement: 'right',
      filtersShowPeriod: true,
      filtersShowApply: true,
      filtersOptionsFallback: 'field',
      filtersAutoApplyRequireAll: false,
      filtersSendContext: false,
      filtersPaymentPopup: false,
      filtersPaymentTotalKey: '',
      filtersAutoOptions: true,
      filtersPaymentSubmitEndpoint: '',
      filtersPaymentTicketEndpoint: '',
      filtersEndpointPrefill: false,
      filtersEndpointPrefillMap: {},
      filtersTitleIcon: '',
      filtersTitleIconPosition: 'left',
      filtersUseCard: true,
    },
    filters_result_list: {
      filtersResultTitle: 'Opções de parcelamento',
      filtersResultKey: 'installments',
      filtersResultTargetKey: 'parcelamento',
      filtersResultEmptyMessage: 'Nenhuma opção disponível.',
      filtersResultDisplayMode: 'label',
      filtersResultValueMode: 'value',
    },
    chart: {
      title: 'Gráfico',
      chartType: 'bar',
      chartData: [
        { label: 'Item 1', value: 10 },
        { label: 'Item 2', value: 20 },
      ],
    },
    input_text: {
      inputLabel: 'Digite um valor',
      placeholder: 'Ex: 123',
      buttonLabel: 'Enviar',
    },
    input_select: {
      inputLabel: 'Selecione uma opção',
      options: ['Opção A', 'Opção B'],
      buttonLabel: 'Enviar',
    },
    input_boolean: {
      inputLabel: 'Ativar?',
      trueLabel: 'Sim',
      falseLabel: 'Não',
      buttonLabel: 'Enviar',
    },
  };

  return {
    id: crypto.randomUUID(),
    type: 'widget',
    widgetType,
    settings: defaults[widgetType] || {},
  };
}
