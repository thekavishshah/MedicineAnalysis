import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson, Settings, CheckCircle, AlertCircle } from 'lucide-react';

const ExportPanel = ({ filteredData, appliedFilters, chartRefs = [], apiBaseUrl = 'http://localhost:8000' }) => {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [exportOptions, setExportOptions] = useState({
    includeDetails: true,
    includeStatistics: true,
    includeCharts: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  const formats = [
    {
      id: 'csv',
      name: 'CSV',
      icon: FileText,
      description: 'Comma-separated values',
      color: 'bg-green-500',
      supports: { details: true, statistics: false, charts: false }
    },
    {
      id: 'json',
      name: 'JSON',
      icon: FileJson,
      description: 'JavaScript Object Notation',
      color: 'bg-yellow-500',
      supports: { details: true, statistics: true, charts: false }
    },
    {
      id: 'excel',
      name: 'Excel',
      icon: FileSpreadsheet,
      description: 'Microsoft Excel format',
      color: 'bg-blue-500',
      supports: { details: true, statistics: true, charts: true }
    },
    {
      id: 'pdf',
      name: 'PDF',
      icon: FileText,
      description: 'Portable Document Format',
      color: 'bg-red-500',
      supports: { details: true, statistics: true, charts: true }
    }
  ];

  const selectedFormatInfo = formats.find(f => f.id === selectedFormat);

  const captureChartImages = async () => {
    const chartImages = [];
    
    for (const chartRef of chartRefs) {
      if (chartRef && chartRef.current) {
        try {
          const svgElement = chartRef.current.querySelector('svg');
          if (svgElement) {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            canvas.width = svgElement.width.baseVal.value || 800;
            canvas.height = svgElement.height.baseVal.value || 600;
            
            await new Promise((resolve, reject) => {
              img.onload = () => {
                ctx.drawImage(img, 0, 0);
                const imageData = canvas.toDataURL('image/png');
                chartImages.push(imageData);
                resolve();
              };
              img.onerror = reject;
              img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
            });
          }
          
          const canvasElement = chartRef.current.querySelector('canvas');
          if (canvasElement) {
            chartImages.push(canvasElement.toDataURL('image/png'));
          }
        } catch (error) {
          console.warn('Failed to capture chart:', error);
        }
      }
    }
    
    return chartImages;
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      let endpoint = `${apiBaseUrl}/api/export/${selectedFormat}`;
      let requestBody = {
        filters: appliedFilters,
        include_details: exportOptions.includeDetails
      };

      if (selectedFormat === 'json' || selectedFormat === 'excel' || selectedFormat === 'pdf') {
        requestBody.include_statistics = exportOptions.includeStatistics;
      }

      if ((selectedFormat === 'excel' || selectedFormat === 'pdf') && exportOptions.includeCharts) {
        requestBody.include_charts = true;
        
        if (selectedFormat === 'pdf') {
          const chartImages = await captureChartImages();
          requestBody.chart_images = chartImages;
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `medicine_export_${Date.now()}.${selectedFormat}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportStatus({
        type: 'success',
        message: `Successfully exported ${filteredData.length} records to ${selectedFormat.toUpperCase()}`
      });
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({
        type: 'error',
        message: `Failed to export: ${error.message}`
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportStatus(null), 5000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Download className="w-6 h-6" />
          Export Data
        </h2>
        <div className="text-sm text-gray-600">
          {filteredData.length} records ready to export
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Select Export Format
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {formats.map((format) => {
            const Icon = format.icon;
            const isSelected = selectedFormat === format.id;
            
            return (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-200
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`p-3 rounded-full ${format.color} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 text-gray-700`} />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">{format.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{format.description}</div>
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedFormatInfo && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-gray-600" />
            <label className="text-sm font-semibold text-gray-700">
              Export Options
            </label>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={exportOptions.includeDetails}
                onChange={(e) => setExportOptions({
                  ...exportOptions,
                  includeDetails: e.target.checked
                })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-700">Include Detailed Information</div>
                <div className="text-xs text-gray-500">
                  Add descriptions, uses, side effects, and ingredients
                </div>
              </div>
            </label>

            {selectedFormatInfo.supports.statistics && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportOptions.includeStatistics}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    includeStatistics: e.target.checked
                  })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">Include Statistics</div>
                  <div className="text-xs text-gray-500">
                    Add summary statistics and distribution data
                  </div>
                </div>
              </label>
            )}

            {selectedFormatInfo.supports.charts && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportOptions.includeCharts}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    includeCharts: e.target.checked
                  })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={chartRefs.length === 0}
                />
                <div>
                  <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    Include Visualizations
                    {chartRefs.length === 0 && (
                      <span className="text-xs text-orange-500">(No charts available)</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Add chart images to the export file
                  </div>
                </div>
              </label>
            )}
          </div>
        </div>
      )}

      {Object.keys(appliedFilters).length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-semibold text-blue-900 mb-2">Active Filters:</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(appliedFilters).map(([key, value]) => (
              <span
                key={key}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
              >
                {key}: {Array.isArray(value) ? value.join(', ') : value}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={isExporting || filteredData.length === 0}
        className={`
          w-full py-3 px-6 rounded-lg font-semibold text-white
          flex items-center justify-center gap-2 transition-all duration-200
          ${isExporting || filteredData.length === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-md hover:shadow-lg'
          }
        `}
      >
        {isExporting ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Export as {selectedFormatInfo?.name}
          </>
        )}
      </button>

      {exportStatus && (
        <div className={`
          mt-4 p-4 rounded-lg flex items-start gap-3
          ${exportStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
          }
        `}>
          {exportStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <div className={`font-semibold text-sm ${
              exportStatus.type === 'success' ? 'text-green-900' : 'text-red-900'
            }`}>
              {exportStatus.type === 'success' ? 'Export Successful' : 'Export Failed'}
            </div>
            <div className={`text-sm ${
              exportStatus.type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {exportStatus.message}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600">
          <strong>Tip:</strong> {selectedFormatInfo?.name} format is best for{' '}
          {selectedFormat === 'csv' && 'importing into spreadsheet applications and data analysis tools.'}
          {selectedFormat === 'json' && 'API integration and programmatic data processing.'}
          {selectedFormat === 'excel' && 'detailed analysis with charts and multiple data sheets.'}
          {selectedFormat === 'pdf' && 'creating shareable reports with visualizations and statistics.'}
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;