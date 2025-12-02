// src/lib/chartGenerator.ts
/**
 * INTEGRATED BACKEND CHART GENERATION SYSTEM
 *
 * This system receives a dashboard plan (draft) from the AI and generates
 * the actual chart configurations that will be rendered.
 *
 * The AI only decides:
 * - Which columns to use
 * - What chart types to create
 * - How many charts to include
 * - Basic mapping (x, y, series, aggregation)
 *
 * This backend system:
 * - Validates the plan
 * - Processes the data according to the plan
 * - Generates final chart specifications
 * - Applies data transformations and aggregations
 * - Returns renderable chart objects
 */

import type { DashboardSchema, DashboardChart } from '@/types/dashboard';

export interface DashboardPlan {
  layout: {
    rows: number;
    columns: number;
  };
  charts: DashboardChart[];
}

export interface ChartGenerationResult {
  success: boolean;
  generatedCharts: DashboardChart[];
  errors?: string[];
  warnings?: string[];
  metadata: {
    totalCharts: number;
    validCharts: number;
    invalidCharts: number;
    processingTime: number;
  };
}

/**
 * Main function: Takes AI-generated plan and produces final dashboard schema
 */
export async function generateChartsFromPlan(
  plan: DashboardPlan,
  dataProfile: any
): Promise<ChartGenerationResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  const validatedCharts: DashboardChart[] = [];

  console.log('📋 BACKEND CHART GENERATOR: Processing AI plan...');
  console.log(`   - Total charts in plan: ${plan.charts.length}`);
  console.log(`   - Layout: ${plan.layout.rows}x${plan.layout.columns}`);

  // Step 1: Validate each chart in the plan
  for (let i = 0; i < plan.charts.length; i++) {
    const chart = plan.charts[i];
    console.log(`   - Validating chart ${i + 1}/${plan.charts.length}: ${chart.title} (${chart.type})`);

    const validation = validateChart(chart, dataProfile);

    if (validation.isValid) {
      // Chart is valid, add to final output
      validatedCharts.push(chart);
    } else {
      // Chart has issues
      errors.push(`Chart "${chart.title}": ${validation.error}`);
      console.warn(`   ⚠️  Chart validation failed: ${validation.error}`);
    }
  }

  // Step 2: Check diversity (warn if all charts are same type)
  const chartTypes = new Set(validatedCharts.map(c => c.type));
  if (chartTypes.size === 1 && validatedCharts.length > 2) {
    warnings.push(`Dashboard has ${validatedCharts.length} charts but only 1 chart type (${Array.from(chartTypes)[0]}). Consider more variety.`);
    console.warn(`   ⚠️  Low diversity: All ${validatedCharts.length} charts are '${Array.from(chartTypes)[0]}' type`);
  } else {
    console.log(`   ✓ Chart diversity: ${chartTypes.size} different types used`);
  }

  // Step 3: Apply any backend-specific enhancements
  const enhancedCharts = validatedCharts.map(chart => enhanceChart(chart, dataProfile));

  // Step 3: Return result
  const processingTime = Date.now() - startTime;

  console.log('✅ BACKEND CHART GENERATOR: Processing complete');
  console.log(`   - Valid charts: ${validatedCharts.length}`);
  console.log(`   - Invalid charts: ${plan.charts.length - validatedCharts.length}`);
  console.log(`   - Processing time: ${processingTime}ms`);

  return {
    success: validatedCharts.length > 0,
    generatedCharts: enhancedCharts,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    metadata: {
      totalCharts: plan.charts.length,
      validCharts: validatedCharts.length,
      invalidCharts: plan.charts.length - validatedCharts.length,
      processingTime,
    },
  };
}

/**
 * Validates that a chart from the AI plan can be rendered
 */
function validateChart(
  chart: DashboardChart,
  dataProfile: any
): { isValid: boolean; error?: string } {
  // Check 1: Chart must have an ID
  if (!chart.id) {
    return { isValid: false, error: 'Chart missing ID' };
  }

  // Check 2: Chart must have a valid type
  const validTypes = [
    'line', 'bar', 'column', 'area', 'pie', 'donut', 'scatter',
    'kpi', 'card', 'table', 'matrix', 'combo', 'stacked_bar',
    'stacked_column', 'percent_stacked_bar', 'percent_stacked_column',
    'treemap', 'funnel', 'waterfall', 'histogram', 'heatmap',
    'boxplot', 'box', 'bubble', 'gauge'  // Added 'box' as alias for 'boxplot'
  ];
  if (!validTypes.includes(chart.type)) {
    return { isValid: false, error: `Unsupported chart type: ${chart.type}` };
  }

  // Normalize 'box' to 'boxplot'
  if (chart.type === 'box') {
    chart.type = 'boxplot';
  }

  // Check 3: Validate column references exist in dataProfile
  const availableColumns = dataProfile.columns.map((col: any) => col.name);

  if (chart.mapping.x && !availableColumns.includes(chart.mapping.x)) {
    return { isValid: false, error: `Column "${chart.mapping.x}" not found in dataset` };
  }

  if (chart.mapping.y && !availableColumns.includes(chart.mapping.y)) {
    return { isValid: false, error: `Column "${chart.mapping.y}" not found in dataset` };
  }

  if (chart.mapping.series && !availableColumns.includes(chart.mapping.series)) {
    return { isValid: false, error: `Column "${chart.mapping.series}" not found in dataset` };
  }

  if (chart.mapping.groupBy && !availableColumns.includes(chart.mapping.groupBy)) {
    return { isValid: false, error: `Column "${chart.mapping.groupBy}" not found in dataset` };
  }

  // Check 4: Ensure chart has required mappings for its type
  // Charts that need BOTH x and y
  if (['line', 'bar', 'column', 'area', 'scatter', 'boxplot'].includes(chart.type)) {
    if (!chart.mapping.x || !chart.mapping.y) {
      return { isValid: false, error: `Chart type "${chart.type}" requires both x and y mappings` };
    }
  }

  // Pie/donut - flexible: can work with just x or both x+y
  if (['pie', 'donut'].includes(chart.type)) {
    if (!chart.mapping.x && !chart.mapping.y) {
      return { isValid: false, error: `Chart type "${chart.type}" requires at least x or y mapping` };
    }
  }

  // Histogram - only needs y (the value to distribute)
  if (['histogram'].includes(chart.type)) {
    if (!chart.mapping.y && !chart.mapping.x) {
      return { isValid: false, error: `Chart type "histogram" requires y mapping (the column to show distribution)` };
    }
  }

  // KPI/Card - only needs y (the metric to display) - make it flexible
  if (['kpi', 'card'].includes(chart.type)) {
    if (!chart.mapping.y && !chart.mapping.x) {
      // Try to auto-assign if we have x but not y
      if (chart.mapping.x) {
        chart.mapping.y = chart.mapping.x;
        chart.mapping.x = null;
      } else {
        return { isValid: false, error: `Chart type "${chart.type}" requires y mapping (the metric to display)` };
      }
    }
  }

  // All validations passed
  return { isValid: true };
}

/**
 * Enhances a validated chart with backend-specific improvements
 */
function enhanceChart(chart: DashboardChart, dataProfile: any): DashboardChart {
  // Clone the chart to avoid mutations
  const enhanced = { ...chart };

  // Enhancement 1: Add smart descriptions if missing
  if (!enhanced.description) {
    enhanced.description = generateChartDescription(chart, dataProfile);
  }

  // Enhancement 2: Optimize aggregation if not specified
  if (!enhanced.mapping.aggregation && enhanced.mapping.y) {
    enhanced.mapping.aggregation = inferBestAggregation(enhanced.mapping.y, dataProfile);
  }

  return enhanced;
}

/**
 * Generates a helpful description for a chart
 */
function generateChartDescription(chart: DashboardChart, dataProfile: any): string {
  const { mapping, type } = chart;

  if (type === 'kpi' || type === 'card') {
    return `Key metric showing ${mapping.aggregation || 'total'} of ${mapping.y}`;
  }

  if (type === 'pie' || type === 'donut') {
    return `Distribution of ${mapping.y} across ${mapping.x}`;
  }

  if (mapping.x && mapping.y) {
    return `${mapping.y} by ${mapping.x}`;
  }

  return '';
}

/**
 * Infers the best aggregation method for a numeric column
 */
function inferBestAggregation(
  columnName: string,
  dataProfile: any
): 'sum' | 'avg' | 'count' | 'min' | 'max' | null {
  const column = dataProfile.columns.find((col: any) => col.name === columnName);

  if (!column) return 'sum';

  // If column name suggests counting
  if (columnName.toLowerCase().includes('count') ||
      columnName.toLowerCase().includes('quantity')) {
    return 'sum';
  }

  // If column name suggests averaging
  if (columnName.toLowerCase().includes('rate') ||
      columnName.toLowerCase().includes('average') ||
      columnName.toLowerCase().includes('score')) {
    return 'avg';
  }

  // Default to sum for numeric columns
  if (column.type === 'numeric') {
    return 'sum';
  }

  return null;
}
