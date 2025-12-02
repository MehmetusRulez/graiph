'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { DashboardChart } from '@/types/dashboard';

interface ChartRendererProps {
  chart: DashboardChart;
  data: Record<string, any>[];
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export function ChartRenderer({ chart, data }: ChartRendererProps) {
  const processedData = useMemo(() => {
    return processDataForChart(chart, data);
  }, [chart, data]);

  const chartComponent = useMemo(() => {
    switch (chart.type) {
      case 'line':
        return renderLineChart(chart, processedData);
      case 'bar':
      case 'column':
        return renderBarChart(chart, processedData);
      case 'stacked_bar':
      case 'stacked_column':
        return renderStackedBarChart(chart, processedData);
      case 'percent_stacked_bar':
      case 'percent_stacked_column':
        return renderPercentStackedBarChart(chart, processedData);
      case 'area':
        return renderAreaChart(chart, processedData);
      case 'pie':
        return renderPieChart(chart, processedData);
      case 'donut':
        return renderDonutChart(chart, processedData);
      case 'scatter':
        return renderScatterChart(chart, processedData);
      case 'kpi':
      case 'card':
        return renderKPI(chart, processedData);
      case 'table':
      case 'matrix':
        return renderTable(chart, processedData);
      case 'combo':
        return renderComboChart(chart, processedData);
      case 'treemap':
        return renderTreemapChart(chart, processedData);
      case 'funnel':
        return renderFunnelChart(chart, processedData);
      case 'waterfall':
        return renderWaterfallChart(chart, processedData);
      case 'histogram':
        return renderHistogram(chart, processedData);
      case 'heatmap':
        return renderHeatmap(chart, processedData);
      case 'boxplot':
        return renderBoxPlot(chart, processedData);
      case 'bubble':
        return renderBubbleChart(chart, processedData);
      case 'gauge':
        return renderGauge(chart, processedData);
      default:
        return <div className="p-4 text-gray-500">Chart type "{chart.type}" is not yet implemented</div>;
    }
  }, [chart, processedData]);

  return (
    <div className="glass rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="glass border-b border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-bold mb-1">
          {chart.title}
        </h3>
        {chart.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400">{chart.description}</p>
        )}
      </div>

      {/* Chart Content */}
      <div className="p-6">
        <div className="w-full h-64 flex items-center justify-center">
          {chartComponent}
        </div>
      </div>
    </div>
  );
}

function processDataForChart(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;

  if (!mapping.x && !mapping.y) {
    return data;
  }

  // Handle aggregation if needed
  if (mapping.aggregation && mapping.groupBy) {
    return aggregateData(data, mapping.groupBy, mapping.y!, mapping.aggregation);
  }

  return data;
}

function aggregateData(
  data: Record<string, any>[],
  groupBy: string,
  valueColumn: string,
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max'
) {
  const groups = new Map<string, number[]>();

  data.forEach(row => {
    const key = String(row[groupBy]);
    const value = Number(row[valueColumn]) || 0;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(value);
  });

  const result: Record<string, any>[] = [];
  groups.forEach((values, key) => {
    let aggregatedValue: number;

    switch (aggregation) {
      case 'sum':
        aggregatedValue = values.reduce((a, b) => a + b, 0);
        break;
      case 'avg':
        aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'count':
        aggregatedValue = values.length;
        break;
      case 'min':
        aggregatedValue = Math.min(...values);
        break;
      case 'max':
        aggregatedValue = Math.max(...values);
        break;
      default:
        aggregatedValue = values.reduce((a, b) => a + b, 0);
    }

    result.push({
      [groupBy]: key,
      [valueColumn]: aggregatedValue,
    });
  });

  return result;
}

function renderLineChart(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;
  if (!mapping.x || !mapping.y) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey={mapping.x} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey={mapping.y}
          stroke={COLORS[0]}
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function renderBarChart(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;
  if (!mapping.x || !mapping.y) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey={mapping.x} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey={mapping.y} fill={COLORS[0]} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderAreaChart(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;
  if (!mapping.x || !mapping.y) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey={mapping.x} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area
          type="monotone"
          dataKey={mapping.y}
          stroke={COLORS[0]}
          fill={COLORS[0]}
          fillOpacity={0.6}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function renderPieChart(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;
  if (!mapping.x || !mapping.y) return null;

  const pieData = data.map(item => ({
    name: String(item[mapping.x]),
    value: Number(item[mapping.y]) || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function renderScatterChart(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;
  if (!mapping.x || !mapping.y) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey={mapping.x} type="number" />
        <YAxis dataKey={mapping.y} type="number" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />
        <Scatter name="Data" data={data} fill={COLORS[0]} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function renderKPI(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;
  if (!mapping.y) return null;

  // Calculate KPI value
  let value = 0;
  const values = data.map(row => Number(row[mapping.y]) || 0);

  if (mapping.aggregation === 'avg') {
    value = values.reduce((a, b) => a + b, 0) / values.length;
  } else if (mapping.aggregation === 'count') {
    value = values.length;
  } else if (mapping.aggregation === 'min') {
    value = Math.min(...values);
  } else if (mapping.aggregation === 'max') {
    value = Math.max(...values);
  } else {
    // Default to sum
    value = values.reduce((a, b) => a + b, 0);
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {mapping.aggregation || 'Total'} {mapping.y}
        </div>
      </div>
    </div>
  );
}

function renderTable(chart: DashboardChart, data: Record<string, any>[]) {
  if (data.length === 0) return null;

  const columns = Object.keys(data[0]);
  const displayData = data.slice(0, 10); // Show first 10 rows

  return (
    <div className="overflow-auto h-full">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-300 dark:border-gray-700">
            {columns.map(col => (
              <th key={col} className="px-4 py-2 text-left font-semibold">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayData.map((row, idx) => (
            <tr key={idx} className="border-b border-gray-200 dark:border-gray-800">
              {columns.map(col => (
                <td key={col} className="px-4 py-2">
                  {String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 10 && (
        <div className="text-xs text-gray-500 mt-2 text-center">
          Showing 10 of {data.length} rows
        </div>
      )}
    </div>
  );
}

function renderStackedBarChart(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;
  if (!mapping.x || !mapping.y) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey={mapping.x} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey={mapping.y} stackId="a" fill={COLORS[0]} radius={[8, 8, 0, 0]} />
        {mapping.series && <Bar dataKey={mapping.series} stackId="a" fill={COLORS[1]} radius={[8, 8, 0, 0]} />}
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderPercentStackedBarChart(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;
  if (!mapping.x || !mapping.y) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey={mapping.x} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey={mapping.y} stackId="a" fill={COLORS[0]} radius={[8, 8, 0, 0]} />
        {mapping.series && <Bar dataKey={mapping.series} stackId="a" fill={COLORS[1]} radius={[8, 8, 0, 0]} />}
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderDonutChart(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;
  if (!mapping.x || !mapping.y) return null;

  const pieData = data.map(item => ({
    name: String(item[mapping.x]),
    value: Number(item[mapping.y]) || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          label
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function renderComboChart(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;
  if (!mapping.x || !mapping.y) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey={mapping.x} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey={mapping.y} fill={COLORS[0]} radius={[8, 8, 0, 0]} />
        {mapping.series && (
          <Line
            type="monotone"
            dataKey={mapping.series}
            stroke={COLORS[1]}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderTreemapChart(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;
  if (!mapping.x || !mapping.y) return null;

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-500">
        <p className="text-sm">Treemap visualization</p>
        <p className="text-xs mt-2">Uses {mapping.x} and {mapping.y}</p>
      </div>
    </div>
  );
}

function renderFunnelChart(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;
  if (!mapping.x || !mapping.y) return null;

  const sortedData = [...data].sort((a, b) => (Number(b[mapping.y!]) || 0) - (Number(a[mapping.y!]) || 0));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={sortedData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" />
        <YAxis dataKey={mapping.x} type="category" width={100} />
        <Tooltip />
        <Legend />
        <Bar dataKey={mapping.y} fill={COLORS[0]} radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderWaterfallChart(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;
  if (!mapping.x || !mapping.y) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey={mapping.x} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey={mapping.y} fill={COLORS[0]} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderHistogram(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;
  if (!mapping.y) return null;

  const values = data.map(row => Number(row[mapping.y!]) || 0);
  const binCount = 10;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binSize = (max - min) / binCount;

  const bins = Array.from({ length: binCount }, (_, i) => ({
    range: `${(min + i * binSize).toFixed(0)}-${(min + (i + 1) * binSize).toFixed(0)}`,
    count: 0,
  }));

  values.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
    bins[binIndex].count++;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={bins}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="range" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill={COLORS[0]} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderHeatmap(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;
  if (!mapping.x || !mapping.y) return null;

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-500">
        <p className="text-sm">Heatmap visualization</p>
        <p className="text-xs mt-2">Uses {mapping.x} and {mapping.y}</p>
      </div>
    </div>
  );
}

function renderBoxPlot(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;
  if (!mapping.y) return null;

  // Calculate quartiles for box plot
  const values = data.map(row => Number(row[mapping.y!]) || 0).sort((a, b) => a - b);
  const q1Index = Math.floor(values.length * 0.25);
  const q2Index = Math.floor(values.length * 0.5);
  const q3Index = Math.floor(values.length * 0.75);

  const stats = {
    min: Math.min(...values),
    q1: values[q1Index],
    median: values[q2Index],
    q3: values[q3Index],
    max: Math.max(...values),
    mean: values.reduce((a, b) => a + b, 0) / values.length,
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="mb-4 text-3xl font-bold text-blue-600">{stats.median.toFixed(2)}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Median {mapping.y}</div>
        <div className="mt-4 text-xs space-y-1">
          <div>Min: {stats.min.toFixed(2)}</div>
          <div>Q1: {stats.q1.toFixed(2)}</div>
          <div>Q3: {stats.q3.toFixed(2)}</div>
          <div>Max: {stats.max.toFixed(2)}</div>
          <div>Mean: {stats.mean.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

function renderBubbleChart(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;
  if (!mapping.x || !mapping.y) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey={mapping.x} type="number" name={mapping.x} />
        <YAxis dataKey={mapping.y} type="number" name={mapping.y} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />
        <Scatter name={chart.title} data={data} fill={COLORS[0]} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function renderGauge(chart: DashboardChart, data: Record<string, any>[]) {
  const { mapping } = chart;
  if (!mapping.y) return null;

  const value = data.reduce((sum, row) => sum + (Number(row[mapping.y!]) || 0), 0);
  const target = value * 1.2; // Assume 120% as target
  const percentage = Math.min((value / target) * 100, 100);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={COLORS[0]}
              strokeWidth="8"
              strokeDasharray={`${percentage * 2.51} 251`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">{percentage.toFixed(0)}%</span>
          </div>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {value.toLocaleString()} / {target.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
