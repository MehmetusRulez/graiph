'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import { ConfigurationForm } from '@/components/ConfigurationForm';
import { DashboardRenderer } from '@/components/DashboardRenderer';
import { parseCSV } from '@/lib/dataProfile';
import type { DashboardSchema } from '@/types/dashboard';

interface GeneratedChart {
  id: string;
  title: string;
  image: string;  // base64 encoded PNG
  type: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardSchema, setDashboardSchema] = useState<DashboardSchema | null>(null);
  const [generatedCharts, setGeneratedCharts] = useState<GeneratedChart[]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  const handleFileLoaded = (columns: string[]) => {
    setAvailableColumns(columns);
    setDashboardSchema(null);
    setGeneratedCharts([]);
    setError(null);
  };

  const handleSubmit = async (config: {
    csvContent: string;
    usageContext: string;
    themeText: string;
    includeColumns: string[];
    pairings: any[];
    maxCharts: number;
    selectedChartTypes: string[];
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the API to generate dashboard (AI plan + Python graphs)
      const response = await fetch('/api/generate-dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate dashboard');
      }

      const result = await response.json();
      setDashboardSchema(result.schema);
      setGeneratedCharts(result.charts || []);  // Charts with base64 images from Python
    } catch (err) {
      console.error('Error generating dashboard:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (generatedCharts.length === 0) return;

    try {
      const zip = new JSZip();

      // Add each chart to the ZIP file
      generatedCharts.forEach((chart) => {
        const base64Data = chart.image;
        const fileName = `${chart.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
        zip.file(fileName, base64Data, { base64: true });
      });

      // Generate the ZIP file
      const content = await zip.generateAsync({ type: 'blob' });

      // Download the ZIP file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'dashboard_charts.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error downloading dashboard:', error);
      alert('Failed to download dashboard. Please try again.');
    }
  };

  const handleReset = () => {
    setDashboardSchema(null);
    setGeneratedCharts([]);
    setError(null);
    setAvailableColumns([]);
  };

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Graiph
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            AI-Powered Automatic Dashboard Generator
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Upload your CSV data and let AI create beautiful visualizations
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 glass rounded-xl p-6 shadow-lg border-l-4 border-red-500">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800 dark:text-red-400">
                  Error
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!dashboardSchema ? (
          <ConfigurationForm
            onSubmit={handleSubmit}
            onFileLoaded={handleFileLoaded}
            isLoading={isLoading}
          />
        ) : (
          <>
            {/* Dashboard Header */}
            <div className="glass rounded-xl p-8 shadow-lg border-2 border-blue-500/20 mb-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 bg-clip-text text-transparent mb-3">
                📊 Your AI Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {generatedCharts.length} visualizations generated by Python backend
              </p>
            </div>

            {/* Generated Charts Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${dashboardSchema.layout.columns}, 1fr)`,
              gap: '1.5rem',
            }}>
              {generatedCharts.map((chart) => (
                <div key={chart.id} className="glass rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                  {/* Chart Header with Download Button - FIXED HEIGHT */}
                  <div className="glass border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-start" style={{ minHeight: '80px', maxHeight: '80px' }}>
                    <div className="flex-1 pr-3 overflow-hidden">
                      <h3 className="text-base font-bold line-clamp-2 leading-tight">{chart.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{chart.type} chart</p>
                    </div>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `data:image/png;base64,${chart.image}`;
                        link.download = `${chart.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all flex-shrink-0"
                      title="Download Chart"
                    >
                      ⬇️
                    </button>
                  </div>
                  {/* Chart Image - FIXED HEIGHT */}
                  <div className="flex-1 p-4 bg-[#1a1a2e] flex items-center justify-center" style={{ height: '400px' }}>
                    <img
                      src={`data:image/png;base64,${chart.image}`}
                      alt={chart.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={handleDownloadAll}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                📦 Download All Charts
              </button>
              <button
                onClick={handleReset}
                className="px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                🔄 Create Another Dashboard
              </button>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-600">
          <p>Built with Next.js, TypeScript, Tailwind CSS, and Recharts</p>
          <p className="mt-2">Powered by OpenAI GPT-4</p>
        </footer>
      </div>
    </main>
  );
}
