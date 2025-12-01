function initExport() {
    const exportContainer = document.getElementById('export-container');
    
    if (!exportContainer) return;

    const exportHTML = `
        <div style="max-width: 900px; margin: 0 auto;">
            <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 2rem;">
                
                <div style="margin-bottom: 2rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                        <span style="font-size: 1.5rem;">📥</span>
                        <h3 style="font-size: 1.5rem; font-weight: 600; color: #1f2937; margin: 0;">Export Data</h3>
                    </div>
                    
                    <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 1rem;">
                        Select Format
                    </label>
                    
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
                        <button class="export-format-btn" data-format="csv" style="padding: 1.5rem; border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s;">
                            <div style="text-align: center;">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">📄</div>
                                <div style="font-weight: 600; color: #1f2937; margin-bottom: 0.25rem;">CSV</div>
                                <div style="font-size: 0.75rem; color: #6b7280;">Spreadsheet data</div>
                            </div>
                        </button>
                        
                        <button class="export-format-btn" data-format="json" style="padding: 1.5rem; border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s;">
                            <div style="text-align: center;">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">📋</div>
                                <div style="font-weight: 600; color: #1f2937; margin-bottom: 0.25rem;">JSON</div>
                                <div style="font-size: 0.75rem; color: #6b7280;">Structured data</div>
                            </div>
                        </button>
                        
                        <button class="export-format-btn" data-format="excel" style="padding: 1.5rem; border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s;">
                            <div style="text-align: center;">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">📊</div>
                                <div style="font-weight: 600; color: #1f2937; margin-bottom: 0.25rem;">Excel</div>
                                <div style="font-size: 0.75rem; color: #6b7280;">Multiple sheets</div>
                            </div>
                        </button>
                        
                        <button class="export-format-btn" data-format="pdf" style="padding: 1.5rem; border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s;">
                            <div style="text-align: center;">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">📑</div>
                                <div style="font-weight: 600; color: #1f2937; margin-bottom: 0.25rem;">PDF</div>
                                <div style="font-size: 0.75rem; color: #6b7280;">Report format</div>
                            </div>
                        </button>
                    </div>
                </div>

                <div style="background: #f9fafb; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
                    <div style="font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <span>⚙️</span>
                        <span>Export Options</span>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <label style="display: flex; align-items: start; gap: 0.75rem; cursor: pointer;">
                            <input type="checkbox" id="include-details" checked style="margin-top: 0.25rem; width: 1rem; height: 1rem;">
                            <div>
                                <div style="font-size: 0.875rem; font-weight: 500; color: #374151;">Include Detailed Information</div>
                                <div style="font-size: 0.75rem; color: #6b7280;">Descriptions, uses, side effects, and ingredients</div>
                            </div>
                        </label>

                        <label style="display: flex; align-items: start; gap: 0.75rem; cursor: pointer;">
                            <input type="checkbox" id="include-statistics" checked style="margin-top: 0.25rem; width: 1rem; height: 1rem;">
                            <div>
                                <div style="font-size: 0.875rem; font-weight: 500; color: #374151;">Include Statistics</div>
                                <div style="font-size: 0.75rem; color: #6b7280;">Summary statistics and distribution data</div>
                            </div>
                        </label>

                        <label style="display: flex; align-items: start; gap: 0.75rem; cursor: pointer;">
                            <input type="checkbox" id="include-charts" checked style="margin-top: 0.25rem; width: 1rem; height: 1rem;">
                            <div>
                                <div style="font-size: 0.875rem; font-weight: 500; color: #374151;">Include Visualizations</div>
                                <div style="font-size: 0.75rem; color: #6b7280;">Chart images in the export file</div>
                            </div>
                        </label>
                    </div>
                </div>

                <button id="export-btn" style="width: 100%; padding: 0.875rem 1.5rem; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    📥 Export Data
                </button>

                <div id="export-status" style="display: none; margin-top: 1rem;"></div>

                <div style="margin-top: 1rem; padding: 0.75rem; background: #f9fafb; border-radius: 6px;">
                    <div style="font-size: 0.75rem; color: #6b7280;">
                        <strong style="color: #374151;">Tip:</strong> Select a format above to export your filtered medicine data
                    </div>
                </div>
            </div>
        </div>
    `;

    exportContainer.innerHTML = exportHTML;

    let selectedFormat = 'csv';

    const formatBtns = document.querySelectorAll('.export-format-btn');
    formatBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            formatBtns.forEach(b => {
                b.style.borderColor = '#e5e7eb';
                b.style.background = 'white';
                b.style.boxShadow = 'none';
            });
            this.style.borderColor = '#2563eb';
            this.style.background = '#eff6ff';
            this.style.boxShadow = '0 4px 6px rgba(37, 99, 235, 0.1)';
            selectedFormat = this.dataset.format;
        });
    });

    const firstBtn = document.querySelector('.export-format-btn[data-format="csv"]');
    firstBtn.style.borderColor = '#2563eb';
    firstBtn.style.background = '#eff6ff';
    firstBtn.style.boxShadow = '0 4px 6px rgba(37, 99, 235, 0.1)';

    const exportBtn = document.getElementById('export-btn');
    exportBtn.addEventListener('mouseenter', function() {
        this.style.background = '#1d4ed8';
        this.style.transform = 'translateY(-1px)';
        this.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
    });
    exportBtn.addEventListener('mouseleave', function() {
        this.style.background = '#2563eb';
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    });

    exportBtn.addEventListener('click', async function() {
        const includeDetails = document.getElementById('include-details').checked;
        const includeStatistics = document.getElementById('include-statistics').checked;
        const includeCharts = document.getElementById('include-charts').checked;

        const statusDiv = document.getElementById('export-status');
        statusDiv.style.display = 'block';
        statusDiv.style.padding = '1rem';
        statusDiv.style.borderRadius = '8px';
        statusDiv.style.background = '#dbeafe';
        statusDiv.style.border = '1px solid #93c5fd';
        statusDiv.innerHTML = '<div style="font-size: 0.875rem; color: #1e40af; display: flex; align-items: center; gap: 0.5rem;"><span>⏳</span><span>Exporting...</span></div>';

        try {
            const response = await fetch(`http://localhost:8000/api/export/${selectedFormat}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filters: {},
                    include_details: includeDetails,
                    include_statistics: includeStatistics,
                    include_charts: includeCharts
                })
            });

            if (!response.ok) {
                throw new Error(`Export failed: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `medicine_export_${Date.now()}.${selectedFormat === 'excel' ? 'xlsx' : selectedFormat}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            statusDiv.style.background = '#d1fae5';
            statusDiv.style.border = '1px solid #6ee7b7';
            statusDiv.innerHTML = '<div style="font-size: 0.875rem; color: #065f46; display: flex; align-items: center; gap: 0.5rem;"><span>✅</span><span>Export successful! Check your downloads.</span></div>';
            
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);

        } catch (error) {
            console.error('Export error:', error);
            statusDiv.style.background = '#fee2e2';
            statusDiv.style.border = '1px solid #fca5a5';
            statusDiv.innerHTML = `<div style="font-size: 0.875rem; color: #991b1b; display: flex; align-items: center; gap: 0.5rem;"><span>❌</span><span>Export failed: ${error.message}</span></div>`;
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExport);
} else {
    initExport();
}