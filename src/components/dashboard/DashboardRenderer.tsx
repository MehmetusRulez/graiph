// src/types/dashboard.ts

// Kolon tipi
export type ColumnType =
  | "numeric"
  | "categorical"
  | "datetime"
  | "text"
  | "unknown";

// Tek bir kolonun profili
export interface ColumnProfile {
  name: string;
  type: ColumnType;
  sampleValues: string[];
  missingRate: number;
  uniqueCount?: number;
}

// Dataset profili
export interface DataProfile {
  columns: ColumnProfile[];
  rowCount: number;
}

// Tema bilgisi (kullanıcının yazdığı açıklama vs.)
export interface ThemeConfig {
  text: string | null;
  imageId?: string | null;
}

// Kullanıcı tanımlı kolon eşleştirmesi
export interface ColumnPairing {
  x: string;
  y: string;
  series?: string | null;
}

// Kullanıcı kolon tercihleri
export interface ColumnPreferences {
  includeColumns?: string[] | null;
  excludeColumns?: string[] | null;
  pairings?: ColumnPairing[] | null;
}

// Kullanıcı grafik tercihleri
export interface ChartPreferences {
  maxCharts?: number | null;
  layoutHint?: string | null;
  mustInclude?: string[] | null;
}

// LLM'e gönderdiğin ana istek yapısı
export interface GenerateDashboardRequest {
  dataProfile: DataProfile;
  usageContext: string | null;
  theme: ThemeConfig;
  columnPreferences: ColumnPreferences;
  chartPreferences: ChartPreferences;
}

// Grafik tipi
export type ChartType =
  | "line"
  | "area"
  | "bar"
  | "column"
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
  | "combo";

// Grafik mapping bilgisi (hangi kolon nereye)
export interface ChartMapping {
  x?: string | null;
  y?: string | null;
  series?: string | null;
  aggregation?: "sum" | "avg" | "count" | "min" | "max" | null;
  groupBy?: string | null;
}

// Ek kısıtlar (ör: pairing'den mi gelmiş)
export interface ChartConstraints {
  fromPairing?: boolean | null;
}

// Tek bir grafik tanımı
export interface DashboardChart {
  id: string;
  title: string;
  description?: string | null;
  type: ChartType;
  mapping: ChartMapping;
  constraints?: ChartConstraints;
}

// Layout bilgisi
export interface DashboardLayout {
  rows: number;
  columns: number;
}

// Tüm dashboard şeması (LLM'den beklediğin çıktı)
export interface DashboardSchema {
  layout: DashboardLayout;
  charts: DashboardChart[];
}
