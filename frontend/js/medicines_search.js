let currentMedicineId = null;
let filterData = null;

function initializeSearch() {
    loadFilterOptions();
    initializeManageTab();
    initializeModals();
    
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
        filterData = await response.json();
        
        const mfrSelect = document.getElementById('filter-manufacturer');
        filterData.manufacturers.forEach(mfr => {
            const option = document.createElement('option');
            option.value = mfr.name;
            option.textContent = mfr.name;
            mfrSelect.appendChild(option);
        });
        
        const catSelect = document.getElementById('filter-category');
        filterData.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            catSelect.appendChild(option);
        });
        
        populateManageDropdowns();
        populateEditDropdowns();
    } catch (error) {
        console.error('Failed to load filter options:', error);
    }
}

function populateManageDropdowns() {
    if (!filterData) return;
    
    const newCatSelect = document.getElementById('new-category');
    filterData.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.category_id;
        option.textContent = cat.name;
        newCatSelect.appendChild(option);
    });
    
    const newMfrSelect = document.getElementById('new-manufacturer');
    filterData.manufacturers.forEach(mfr => {
        const option = document.createElement('option');
        option.value = mfr.manufacturer_id;
        option.textContent = mfr.name;
        newMfrSelect.appendChild(option);
    });
}

function populateEditDropdowns() {
    if (!filterData) return;
    
    const editCatSelect = document.getElementById('edit-category');
    editCatSelect.innerHTML = '<option value="">Select Category</option>';
    filterData.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.category_id;
        option.textContent = cat.name;
        editCatSelect.appendChild(option);
    });
    
    const editMfrSelect = document.getElementById('edit-manufacturer');
    editMfrSelect.innerHTML = '<option value="">Select Manufacturer</option>';
    filterData.manufacturers.forEach(mfr => {
        const option = document.createElement('option');
        option.value = mfr.manufacturer_id;
        option.textContent = mfr.name;
        editMfrSelect.appendChild(option);
    });
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
    currentMedicineId = medicineId;
    
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
                
                <div class="detail-actions">
                    <button onclick="MDVS.switchToTab('search')" class="btn btn-secondary">
                        ← Back to Search
                    </button>
                    <button onclick="openEditModal(${med.medicine_id})" class="btn btn-primary">
                        ✏️ Edit
                    </button>
                    <button onclick="openDeleteModal(${med.medicine_id})" class="btn btn-danger">
                        🗑️ Delete
                    </button>
                </div>
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

function initializeManageTab() {
    document.getElementById('add-medicine-btn').addEventListener('click', addMedicine);
    document.getElementById('clear-form-btn').addEventListener('click', clearAddForm);
}

async function addMedicine() {
    const name = document.getElementById('new-name').value.trim();
    const strength = document.getElementById('new-strength').value.trim();
    const categoryId = document.getElementById('new-category').value;
    const manufacturerId = document.getElementById('new-manufacturer').value;
    const dosageForm = document.getElementById('new-dosage-form').value.trim();
    const classification = document.getElementById('new-classification').value;
    const indication = document.getElementById('new-indication').value.trim();
    
    const statusDiv = document.getElementById('add-status');
    
    if (!name || !strength) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'form-status error';
        statusDiv.innerHTML = '❌ Please fill in required fields (Name and Strength)';
        return;
    }
    
    statusDiv.style.display = 'block';
    statusDiv.className = 'form-status loading';
    statusDiv.innerHTML = '⏳ Adding medicine...';
    
    try {
        const response = await fetch('/api/medicines/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                strength: strength,
                category_id: categoryId ? parseInt(categoryId) : null,
                manufacturer_id: manufacturerId ? parseInt(manufacturerId) : null,
                dosage_form: dosageForm || null,
                classification: classification,
                indication: indication || null
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            statusDiv.className = 'form-status success';
            statusDiv.innerHTML = `✅ Medicine "${name}" added successfully!`;
            clearAddForm();
            
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        } else {
            throw new Error(data.detail || 'Failed to add medicine');
        }
    } catch (error) {
        statusDiv.className = 'form-status error';
        statusDiv.innerHTML = `❌ Error: ${error.message}`;
    }
}

function clearAddForm() {
    document.getElementById('new-name').value = '';
    document.getElementById('new-strength').value = '';
    document.getElementById('new-category').value = '';
    document.getElementById('new-manufacturer').value = '';
    document.getElementById('new-dosage-form').value = '';
    document.getElementById('new-classification').value = 'Prescription';
    document.getElementById('new-indication').value = '';
}

function initializeModals() {
    document.getElementById('cancel-delete-btn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
    document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);
    document.getElementById('save-edit-btn').addEventListener('click', saveEdit);
    
    document.getElementById('confirm-modal').addEventListener('click', (e) => {
        if (e.target.id === 'confirm-modal') closeDeleteModal();
    });
    document.getElementById('edit-modal').addEventListener('click', (e) => {
        if (e.target.id === 'edit-modal') closeEditModal();
    });
}

function openDeleteModal(medicineId) {
    currentMedicineId = medicineId;
    document.getElementById('confirm-modal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('confirm-modal').style.display = 'none';
}

async function confirmDelete() {
    if (!currentMedicineId) return;
    
    try {
        const response = await fetch(`/api/medicines/${currentMedicineId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            closeDeleteModal();
            MDVS.switchToTab('search');
            searchMedicines();
            alert('Medicine deleted successfully!');
        } else {
            const data = await response.json();
            throw new Error(data.detail || 'Failed to delete');
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function openEditModal(medicineId) {
    currentMedicineId = medicineId;
    
    try {
        const response = await fetch(`/api/medicines/${medicineId}`);
        const med = await response.json();
        
        document.getElementById('edit-name').value = med.name || '';
        document.getElementById('edit-strength').value = med.strength || '';
        document.getElementById('edit-dosage-form').value = med.dosage_form || '';
        document.getElementById('edit-indication').value = med.indication || '';
        document.getElementById('edit-classification').value = med.classification || 'Prescription';
        
        if (med.category_id) {
            document.getElementById('edit-category').value = med.category_id;
        }
        if (med.manufacturer_id) {
            document.getElementById('edit-manufacturer').value = med.manufacturer_id;
        }
        
        document.getElementById('edit-modal').style.display = 'flex';
    } catch (error) {
        alert('Failed to load medicine details for editing');
    }
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

async function saveEdit() {
    if (!currentMedicineId) return;
    
    const name = document.getElementById('edit-name').value.trim();
    const strength = document.getElementById('edit-strength').value.trim();
    
    if (!name || !strength) {
        alert('Name and Strength are required');
        return;
    }
    
    const updateData = {
        name: name,
        strength: strength,
        dosage_form: document.getElementById('edit-dosage-form').value.trim() || null,
        indication: document.getElementById('edit-indication').value.trim() || null,
        classification: document.getElementById('edit-classification').value
    };
    
    const categoryId = document.getElementById('edit-category').value;
    const manufacturerId = document.getElementById('edit-manufacturer').value;
    
    if (categoryId) updateData.category_id = parseInt(categoryId);
    if (manufacturerId) updateData.manufacturer_id = parseInt(manufacturerId);
    
    try {
        const response = await fetch(`/api/medicines/${currentMedicineId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            closeEditModal();
            loadDetails(currentMedicineId);
            alert('Medicine updated successfully!');
        } else {
            const data = await response.json();
            throw new Error(data.detail || 'Failed to update');
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}
