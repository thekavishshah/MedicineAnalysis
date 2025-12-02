function initExport() {
    const exportContainer = document.getElementById('export-container');
    if (!exportContainer) return;

    exportContainer.innerHTML = `
        <div class="export-panel">
            <div class="export-header">
                <span style="font-size: 1.5rem;">📥</span>
                <h3>Export Data</h3>
            </div>
            
            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 1rem;">
                Select Format
            </label>
            
            <div class="format-grid">
                <button class="format-btn selected" data-format="csv">
                    <div class="format-icon">📄</div>
                    <div class="format-name">CSV</div>
                    <div class="format-desc">Spreadsheet data</div>
                </button>
                
                <button class="format-btn" data-format="json">
                    <div class="format-icon">📋</div>
                    <div class="format-name">JSON</div>
                    <div class="format-desc">Structured data</div>
                </button>
                
                <button class="format-btn" data-format="excel">
                    <div class="format-icon">📊</div>
                    <div class="format-name">Excel</div>
                    <div class="format-desc">Multiple sheets</div>
                </button>
                
                <button class="format-btn" data-format="pdf">
                    <div class="format-icon">📑</div>
                    <div class="format-name">PDF</div>
                    <div class="format-desc">Report format</div>
                </button>
            </div>

            <div class="export-options">
                <div class="export-options-title">
                    <span>⚙️</span>
                    <span>Export Options</span>
                </div>
                
                <label class="option-item">
                    <input type="checkbox" id="include-details" checked>
                    <div>
                        <div class="option-label">Include Detailed Information</div>
                        <div class="option-desc">Indications, dosage forms, and strengths</div>
                    </div>
                </label>

                <label class="option-item">
                    <input type="checkbox" id="include-statistics" checked>
                    <div>
                        <div class="option-label">Include Statistics</div>
                        <div class="option-desc">Summary statistics and distribution data</div>
                    </div>
                </label>
            </div>

            <button id="export-btn" class="export-btn-main">
                📥 Export Data
            </button>

            <div id="export-status" style="display: none;"></div>

            <div class="export-tip">
                <strong>Tip:</strong> Select a format above to export your medicine data. CSV is best for spreadsheets, PDF for reports.
            </div>
        </div>
    `;

    let selectedFormat = 'csv';

    const formatBtns = document.querySelectorAll('.format-btn');
    formatBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            formatBtns.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedFormat = this.dataset.format;
        });
    });

    const exportBtn = document.getElementById('export-btn');
    exportBtn.addEventListener('click', async function() {
        const includeDetails = document.getElementById('include-details').checked;
        const includeStatistics = document.getElementById('include-statistics').checked;

        const statusDiv = document.getElementById('export-status');
        statusDiv.style.display = 'block';
        statusDiv.className = 'export-status loading';
        statusDiv.innerHTML = '<span>⏳</span><span>Exporting...</span>';

        try {
            const response = await fetch(`/api/export/${selectedFormat}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filters: {},
                    include_details: includeDetails,
                    include_statistics: includeStatistics
                })
            });

            if (!response.ok) {
                throw new Error(`Export failed: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            const extensions = { csv: 'csv', json: 'json', excel: 'xlsx', pdf: 'pdf' };
            a.download = `medicine_export_${Date.now()}.${extensions[selectedFormat]}`;
            
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            statusDiv.className = 'export-status success';
            statusDiv.innerHTML = '<span>✅</span><span>Export successful! Check your downloads.</span>';
            
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);

        } catch (error) {
            console.error('Export error:', error);
            statusDiv.className = 'export-status error';
            statusDiv.innerHTML = `<span>❌</span><span>Export failed: ${error.message}</span>`;
        }
    });
}