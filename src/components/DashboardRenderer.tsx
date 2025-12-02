'use client';

import { useMemo, useRef } from 'react';
import { ChartRenderer } from './charts/ChartRenderer';
import type { DashboardSchema } from '@/types/dashboard';

interface DashboardRendererProps {
  schema: DashboardSchema;
  data: Record<string, any>[];
}

export function DashboardRenderer({ schema, data }: DashboardRendererProps) {
  const dashboardRef = useRef<HTMLDivElement>(null);

  const gridStyle = useMemo(() => {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${schema.layout.columns}, 1fr)`,
      gap: '1.5rem',
    };
  }, [schema.layout.columns]);

  const downloadChartAsPNG = async (chartId: string) => {
    const chartElement = document.getElementById(`chart-${chartId}`);
    if (!chartElement) return;

    try {
      // Simple approach: Use browser's built-in functionality
      alert('To download individual charts, right-click on the chart and select "Save image as..."');
    } catch (error) {
      console.error('Error downloading chart:', error);
    }
  };

  const downloadAllChartsData = () => {
    const csvData = convertToCSV(data);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: Record<string, any>[]) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(header => JSON.stringify(row[header] ?? '')).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  };

  const downloadSchema = () => {
    const jsonStr = JSON.stringify(schema, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-schema.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!schema.charts || schema.charts.length === 0) {
    return (
      <div className="glass rounded-xl p-8 shadow-lg text-center">
        <p className="text-gray-600 dark:text-gray-400">No charts to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="glass rounded-xl p-8 shadow-lg border-2 border-blue-500/20">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 bg-clip-text text-transparent mb-3">
              📊 Your AI Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {schema.charts.length} visualizations | {data.length} data points
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadAllChartsData}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium shadow-lg text-sm"
              title="Download all data as CSV"
            >
              📥 Download Data
            </button>
            <button
              onClick={downloadSchema}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-lg text-sm"
              title="Download dashboard configuration"
            >
              📄 Download Config
            </button>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div ref={dashboardRef} style={gridStyle}>
        {schema.charts.map((chart, index) => {
          // Get columns used in this chart
          const usedColumns = [
            chart.mapping.x,
            chart.mapping.y,
            chart.mapping.series,
            chart.mapping.groupBy
          ].filter(Boolean);

          return (
            <div
              key={chart.id}
              id={`chart-${chart.id}`}
              className="relative group"
            >
              {/* Chart with column info badge */}
              <div className="relative">
                <ChartRenderer chart={chart} data={data} />
                {/* Column badges */}
                {usedColumns.length > 0 && (
                  <div className="absolute top-2 right-2 flex gap-1 flex-wrap max-w-[200px]">
                    {usedColumns.map((col, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-1 rounded-full bg-blue-500/90 text-white font-medium shadow-sm"
                        title={`Column: ${col}`}
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                )}
                {/* Save button */}
                <button
                  onClick={() => downloadChartAsPNG(chart.id)}
                  className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs font-medium shadow-lg"
                  title="Download this chart"
                >
                  💾 Save
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="glass rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-2">💡 How to save charts</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <li>• <strong>Individual charts:</strong> Hover over a chart and click the "Save" button, or right-click and select "Save image as..."</li>
          <li>• <strong>All data:</strong> Click "Download Data" to get a CSV file with all your data</li>
          <li>• <strong>Dashboard config:</strong> Click "Download Config" to save the dashboard structure as JSON</li>
          <li>• <strong>Full screenshot:</strong> Use your browser's screenshot tool (usually Cmd/Ctrl + Shift + S)</li>
        </ul>
      </div>
    </div>
  );
}
