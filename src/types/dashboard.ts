// src/types/dashboard.ts
export type ColumnType = 'numeric' | 'categorical' | 'datetime' | 'text' | 'unknown';

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  sampleValues: string[];
  missingRate: number;
  uniqueCount?: number;
}

export interface DataProfile {
  columns: ColumnProfile[];
  rowCount: number;
}

export interface ThemeConfig {
  text: string | null;
  imageId?: string | null;
}

export interface ColumnPairing {
  x: string;
  y: string;
  series?: string | null;
}

export interface ColumnPreferences {
  includeColumns?: string[] | null;
  excludeColumns?: string[] | null;
  pairings?: ColumnPairing[] | null;
}

export interface ChartPreferences {
  maxCharts?: number | null;
  layoutHint?: string | null;
  mustInclude?: string[] | null;
  selectedChartTypes?: string[] | null;
}

export interface GenerateDashboardRequest {
  dataProfile: DataProfile;
  usageContext: string | null;
  theme: ThemeConfig;
  columnPreferences: ColumnPreferences;
  chartPreferences: ChartPreferences;
}

// src/types/dashboard.ts

export type ChartType =
  | "line"
  | "area"
  | "bar"
  | "column"        // bar'ın dikey versiyonu (Power BI column chart)
  | "stacked_bar"
  | "stacked_column"
  | "percent_stacked_bar"
  | "percent_stacked_column"
  | "pie"
  | "donut"
  | "treemap"
  | "waterfall"
  | "scatter"
  | "bubble"
  | "funnel"
  | "gauge"
  | "kpi"
  | "card"
  | "table"
  | "matrix"
  | "heatmap"
  | "histogram"
  | "boxplot"
  | "combo"
  | "box"        // line + column combo chart
  ;


export interface ChartMapping {
  x?: string | null;
  y?: string | null;
  series?: string | null;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | null;
  groupBy?: string | null;
}

export interface ChartConstraints {
  fromPairing?: boolean;
}

export interface DashboardChart {
  id: string;
  title: string;
  description?: string | null;
  type: ChartType;
  mapping: ChartMapping;
  constraints?: ChartConstraints;
}

export interface DashboardLayout {
  rows: number;
  columns: number;
}

export interface DashboardSchema {
  layout: DashboardLayout;
  charts: DashboardChart[];
}
