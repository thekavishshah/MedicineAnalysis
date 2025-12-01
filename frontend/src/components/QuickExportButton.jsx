import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import ExportPanel from './ExportPanel';

const QuickExportButton = ({ filteredData = [], appliedFilters = {}, chartRefs = [], buttonText = "Export Data", buttonClassName = "" }) => {
  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowExportModal(true)}
        className={buttonClassName || `
          flex items-center gap-2 px-4 py-2 
          bg-blue-600 hover:bg-blue-700 
          text-white font-medium rounded-lg 
          transition-all duration-200 
          shadow-md hover:shadow-lg 
          active:scale-95
        `}
      >
        <Download className="w-4 h-4" />
        {buttonText}
      </button>

      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Export Your Data</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              <ExportPanel
                filteredData={filteredData}
                appliedFilters={appliedFilters}
                chartRefs={chartRefs}
              />
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickExportButton;