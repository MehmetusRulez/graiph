'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { ColumnPairing } from '@/types/dashboard';

interface FormData {
  usageContext: string;
  themeText: string;
  maxCharts: number;
}

interface ConfigurationFormProps {
  onSubmit: (config: {
    csvContent: string;
    usageContext: string;
    themeText: string;
    includeColumns: string[];
    pairings: ColumnPairing[];
    maxCharts: number;
    selectedChartTypes: string[];
  }) => void;
  onFileLoaded: (columns: string[]) => void;
  isLoading: boolean;
}

export function ConfigurationForm({ onSubmit, onFileLoaded, isLoading }: ConfigurationFormProps) {
  const { register, handleSubmit } = useForm<FormData>();
  const [csvContent, setCsvContent] = useState<string>('');
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [pairings, setPairings] = useState<ColumnPairing[]>([]);
  const [selectedChartTypes, setSelectedChartTypes] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available chart types
  const availableChartTypes = [
    { id: 'kpi', name: 'KPI Card', desc: 'Single metric display' },
    { id: 'line', name: 'Line Chart', desc: 'Trends over time' },
    { id: 'bar', name: 'Bar Chart', desc: 'Category comparisons' },
    { id: 'column', name: 'Column Chart', desc: 'Vertical comparisons' },
    { id: 'area', name: 'Area Chart', desc: 'Volume over time' },
    { id: 'stacked_area', name: 'Stacked Area', desc: 'Part-to-whole over time' },
    { id: 'pie', name: 'Pie Chart', desc: 'Part-to-whole' },
    { id: 'donut', name: 'Donut Chart', desc: 'Modern part-to-whole' },
    { id: 'scatter', name: 'Scatter Plot', desc: 'Correlation analysis' },
    { id: 'bubble', name: 'Bubble Chart', desc: '3D scatter plot' },
    { id: 'histogram', name: 'Histogram', desc: 'Distribution' },
    { id: 'boxplot', name: 'Box Plot', desc: 'Statistical distribution' },
    { id: 'violin', name: 'Violin Plot', desc: 'Density distribution' },
    { id: 'heatmap', name: 'Heatmap', desc: 'Matrix visualization' },
    { id: 'treemap', name: 'Treemap', desc: 'Hierarchical proportions' },
    { id: 'waterfall', name: 'Waterfall', desc: 'Cumulative effect' },
    { id: 'funnel', name: 'Funnel Chart', desc: 'Process stages' },
    { id: 'radar', name: 'Radar Chart', desc: 'Multi-metric comparison' },
    { id: 'gauge', name: 'Gauge Chart', desc: 'Progress indicator' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);

      // Parse headers - handle quoted fields and remove quotes
      const lines = content.split('\n');
      const headerLine = lines[0];
      const headers = headerLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      setColumns(headers);
      setSelectedColumns(headers); // Select all by default
      onFileLoaded(headers);
    };
    reader.readAsText(file);
  };

  const toggleColumn = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const toggleChartType = (chartType: string) => {
    setSelectedChartTypes(prev =>
      prev.includes(chartType)
        ? prev.filter(ct => ct !== chartType)
        : [...prev, chartType]
    );
  };

  const addPairing = () => {
    if (columns.length >= 2) {
      setPairings([...pairings, { x: columns[0], y: columns[1], series: null }]);
    }
  };

  const removePairing = (index: number) => {
    setPairings(pairings.filter((_, i) => i !== index));
  };

  const updatePairing = (index: number, field: keyof ColumnPairing, value: string) => {
    const updated = [...pairings];
    updated[index] = { ...updated[index], [field]: value || null };
    setPairings(updated);
  };

  const onFormSubmit = (data: FormData) => {
    if (!csvContent) {
      alert('Please upload a CSV file first');
      return;
    }

    onSubmit({
      csvContent,
      usageContext: data.usageContext,
      themeText: data.themeText,
      includeColumns: selectedColumns,
      pairings,
      maxCharts: data.maxCharts || 0,
      selectedChartTypes,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* File Upload */}
      <div className="glass rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">1. Upload Dataset</h2>
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="text-4xl mb-2">📊</div>
            <p className="text-lg font-medium">
              {csvContent ? 'File uploaded successfully!' : 'Click to upload CSV file'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {csvContent ? `${columns.length} columns detected` : 'CSV files only'}
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Options */}
      {csvContent && (
        <>
          {/* Usage Context */}
          <div className="glass rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">2. Configure Dashboard</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Usage Context (Optional)
                </label>
                <input
                  type="text"
                  {...register('usageContext')}
                  placeholder="e.g., Sales analysis, Marketing dashboard, Financial reporting"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Describe where this dashboard will be used
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Theme Description (Optional)
                </label>
                <input
                  type="text"
                  {...register('themeText')}
                  placeholder="e.g., Modern and professional, Colorful and vibrant, Minimalist"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Describe the desired look and feel
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Charts (Optional)
                </label>
                <input
                  type="number"
                  {...register('maxCharts')}
                  min="1"
                  max="12"
                  placeholder="6-12"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Leave empty to let AI decide
                </p>
              </div>
            </div>
          </div>

          {/* Column Selection */}
          <div className="glass rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">3. Select Columns (Optional)</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Click on each column name to select/deselect it. Selected columns will have a blue border.
            </p>

            <div className="rounded-lg p-2 max-h-96 overflow-y-auto" style={{
              background: 'transparent'
            }}>
              <div className="space-y-2">
                {columns.map((column, idx) => {
                  const isChecked = selectedColumns.includes(column);
                  return (
                    <div
                      key={`column-row-${idx}`}
                      onClick={() => toggleColumn(column)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200"
                      style={{
                        background: 'transparent',
                        border: isChecked
                          ? '1.5px solid rgba(59, 130, 246, 0.5)'
                          : '1px solid rgba(148, 163, 184, 0.15)',
                        backdropFilter: 'none'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        background: isChecked
                          ? '#3b82f6'
                          : 'rgba(148, 163, 184, 0.08)',
                        border: isChecked ? 'none' : '2px solid rgba(148, 163, 184, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s ease'
                      }}>
                        {isChecked && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: isChecked ? '600' : '500',
                        color: isChecked ? 'rgba(59, 130, 246, 0.95)' : 'inherit',
                        transition: 'all 0.2s ease'
                      }}>
                        {column}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setSelectedColumns([...columns])}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  ✓ Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedColumns([])}
                  className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  ✗ Deselect All
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Selected: {selectedColumns.length} of {columns.length} columns
              </p>
            </div>
          </div>

          {/* Chart Type Selection */}
          <div className="glass rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">4. Select Chart Types (Optional)</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Choose specific chart types you want. Leave empty to let AI automatically select the best types.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableChartTypes.map((chartType) => {
                const isSelected = selectedChartTypes.includes(chartType.id);
                return (
                  <div
                    key={chartType.id}
                    onClick={() => toggleChartType(chartType.id)}
                    className="cursor-pointer transition-all duration-200 p-3 rounded-lg"
                    style={{
                      background: 'transparent',
                      border: isSelected
                        ? '1.5px solid rgba(59, 130, 246, 0.5)'
                        : '1px solid rgba(148, 163, 184, 0.15)',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        background: isSelected ? '#3b82f6' : 'rgba(148, 163, 184, 0.08)',
                        border: isSelected ? 'none' : '2px solid rgba(148, 163, 184, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}>
                        {isSelected && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-semibold"
                          style={{
                            color: isSelected ? 'rgba(59, 130, 246, 0.95)' : 'inherit',
                          }}
                        >
                          {chartType.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {chartType.desc}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setSelectedChartTypes(availableChartTypes.map(ct => ct.id))}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  ✓ Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChartTypes([])}
                  className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  ✗ Deselect All
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {selectedChartTypes.length === 0
                  ? 'AI will automatically select the best chart types'
                  : `Selected: ${selectedChartTypes.length} of ${availableChartTypes.length} chart types`
                }
              </p>
            </div>
          </div>

          {/* Column Pairings */}
          <div className="glass rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">5. Column Pairings (Optional)</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Define specific column combinations for charts. AI will decide if left empty.
            </p>
            <div className="space-y-3">
              {pairings.map((pairing, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">X-Axis</label>
                    <select
                      value={pairing.x}
                      onChange={(e) => updatePairing(index, 'x', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                  <span className="hidden sm:block py-2 text-gray-500 self-end mb-2">vs</span>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Y-Axis</label>
                    <select
                      value={pairing.y}
                      onChange={(e) => updatePairing(index, 'y', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePairing(index)}
                    className="sm:self-end px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addPairing}
                disabled={columns.length < 2}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add Pairing
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Generating Dashboard...' : 'Generate Dashboard'}
          </button>
        </>
      )}
    </form>
  );
}
