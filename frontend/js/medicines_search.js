function initializeSearch() {
    loadFilterOptions();
    
    document.getElementById('search-btn').addEventListener('click', searchMedicines);
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchMedicines();
    });
    document.getElementById('clear-filters-btn').addEventListener('click', clearFilters);
    document.getElementById('filter-manufacturer').addEventListener('change', searchMedicines);
    document.getElementById('filter-category').addEventListener('change', searchMedicines);
}

async function loadFilterOptions() {
    try {
        const response = await fetch('/api/medicines/filters');
        const data = await response.json();
        
        const mfrSelect = document.getElementById('filter-manufacturer');
        data.manufacturers.forEach(mfr => {
            const option = document.createElement('option');
            option.value = mfr;
            option.textContent = mfr;
            mfrSelect.appendChild(option);
        });
        
        const catSelect = document.getElementById('filter-category');
        data.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            catSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load filter options:', error);
    }
}

async function searchMedicines() {
    const query = document.getElementById('search-input').value.trim();
    const manufacturer = document.getElementById('filter-manufacturer').value;
    const category = document.getElementById('filter-category').value;
    const resultsDiv = document.getElementById('results-list');
    const countSpan = document.getElementById('results-count');
    
    resultsDiv.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (manufacturer) params.append('manufacturer', manufacturer);
        if (category) params.append('category', category);
        
        const response = await fetch(`/api/medicines?${params.toString()}`);
        const data = await response.json();
        
        resultsDiv.innerHTML = '';
        countSpan.textContent = `(${data.results.length} found)`;
        
        if (data.results.length === 0) {
            resultsDiv.innerHTML = '<div class="empty-state"><span class="empty-icon">🔍</span><p>No medicines found matching your criteria</p></div>';
            return;
        }
        
        data.results.forEach(med => {
            const item = document.createElement('div');
            item.classList.add('result-item');
            
            const classificationBadge = med.classification === 'Prescription' 
                ? '<span class="badge badge-prescription">Rx</span>'
                : '<span class="badge badge-otc">OTC</span>';
            
            item.innerHTML = `
                <div class="result-item-name">${med.name}</div>
                <div class="result-item-meta">${med.indication || 'No indication listed'}</div>
                <div class="result-item-badges">
                    ${med.category_name ? `<span class="badge badge-category">${med.category_name}</span>` : ''}
                    ${med.manufacturer_name ? `<span class="badge badge-manufacturer">${med.manufacturer_name}</span>` : ''}
                    ${med.classification ? classificationBadge : ''}
                </div>
            `;
            
            item.addEventListener('click', () => loadDetails(med.medicine_id));
            resultsDiv.appendChild(item);
        });
        
    } catch (error) {
        console.error('Search error:', error);
        resultsDiv.innerHTML = '<div class="empty-state"><span class="empty-icon">⚠️</span><p>Error searching medicines</p></div>';
    }
}

async function loadDetails(medicineId) {
    const detailsContainer = document.getElementById('details-container');
    
    MDVS.switchToTab('details');
    
    detailsContainer.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const response = await fetch(`/api/medicines/${medicineId}`);
        const med = await response.json();
        
        const classificationBadge = med.classification === 'Prescription' 
            ? '<span class="badge badge-prescription">Prescription</span>'
            : '<span class="badge badge-otc">Over-the-Counter</span>';
        
        let ingredientsList = 'No ingredients listed';
        if (med.ingredients && med.ingredients.length > 0) {
            ingredientsList = med.ingredients.map(ing => 
                `<li>${ing.name}${ing.strength ? ` (${ing.strength})` : ''}</li>`
            ).join('');
        }
        
        detailsContainer.innerHTML = `
            <div class="medicine-detail">
                <div class="medicine-detail-header">
                    <h2 class="medicine-detail-name">${med.name}</h2>
                    <div class="result-item-badges">
                        ${med.category_name ? `<span class="badge badge-category">${med.category_name}</span>` : ''}
                        ${med.manufacturer_name ? `<span class="badge badge-manufacturer">${med.manufacturer_name}</span>` : ''}
                        ${med.classification ? classificationBadge : ''}
                    </div>
                </div>
                
                <div class="medicine-detail-grid">
                    <div class="detail-section">
                        <h4>Indication</h4>
                        <p>${med.indication || 'Not specified'}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Dosage Form</h4>
                        <p>${med.dosage_form || 'Not specified'}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Strength</h4>
                        <p>${med.strength || 'Not specified'}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Manufacturer</h4>
                        <p>${med.manufacturer_name || 'Not specified'}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Category</h4>
                        <p>${med.category_name || 'Not specified'}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Classification</h4>
                        <p>${med.classification || 'Not specified'}</p>
                    </div>
                    
                    <div class="detail-section" style="grid-column: 1 / -1;">
                        <h4>Ingredients</h4>
                        <ul>${ingredientsList}</ul>
                    </div>
                </div>
                
                <button onclick="MDVS.switchToTab('search')" class="btn btn-secondary" style="margin-top:1.5rem;">
                    ← Back to Search
                </button>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading medicine details:', error);
        detailsContainer.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">⚠️</span>
                <p>Failed to load medicine details</p>
                <button onclick="MDVS.switchToTab('search')" class="btn btn-secondary" style="margin-top:1rem;">
                    ← Back to Search
                </button>
            </div>
        `;
    }
}

function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-manufacturer').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('results-list').innerHTML = '';
    document.getElementById('results-count').textContent = '';
}