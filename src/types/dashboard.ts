export type WidgetType = 'kpi' | 'table' | 'chart' | 'list';

export interface Widget {
  id: string;
  tenant_id: string;
  dashboard_id: string;
  title: string;
  type: WidgetType;
  config_json: WidgetConfig;
  page_id: string | null;
  data_source_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WidgetConfig {
  // KPI config
  valueField?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first';
  prefix?: string;
  suffix?: string;
  
  // Table config
  columns?: string[];
  pageSize?: number;
  
  // Chart config
  chartType?: 'bar' | 'line' | 'pie' | 'area';
  xField?: string;
  yField?: string;
  
  // List config
  labelField?: string;
  valueField2?: string;
  limit?: number;
  
  // Filter params for data source
  filterParams?: Record<string, string>;
}

export interface Dashboard {
  id: string;
  tenant_id: string;
  layout_json: DashboardLayout;
  created_at: string;
  updated_at: string;
}

export interface DashboardLayout {
  columns: number;
  widgets: string[]; // Widget IDs in order
}

export interface AuditLogEntry {
  id: string;
  tenant_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
}
