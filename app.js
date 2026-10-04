let vehiclesData = [];
let pedsData = [];
let currentType = 'vehicles';

let allKeys = [];
let visibleKeys = [];
let currentFilteredData = [];

document.addEventListener('DOMContentLoaded', () => {
    // Fetch both JSON datasets in parallel
    Promise.all([
        fetch('vehicles.json').then(res => res.json()).catch(() => []),
        fetch('peds.json').then(res => res.json()).catch(() => [])
    ])
    .then(([vehicles, peds]) => {
        vehiclesData = vehicles;
        pedsData = peds;
        initApp();
    })
    .catch(error => console.error('Error loading datasets:', error));
});

function initApp() {
    const datatypeSelect = document.getElementById('datatype-select');
    datatypeSelect.addEventListener('change', (e) => {
        currentType = e.target.value;
        document.getElementById('global-search').value = '';
        
        // Toggle filter containers visibility
        document.getElementById('vehicle-filters').style.display = currentType === 'vehicles' ? 'flex' : 'none';
        document.getElementById('ped-filters').style.display = currentType === 'peds' ? 'flex' : 'none';
        
        setupDatasetContext();
    });

    setupDatasetContext();
    setupEventListeners();
}

function setupDatasetContext() {
    const currentDataset = currentType === 'vehicles' ? vehiclesData : pedsData;
    const imageKey = currentType === 'vehicles' ? 'id' : 'preview';

    // Collect all unique keys across the active dataset
    const keySet = new Set();
    currentDataset.forEach(item => {
        Object.keys(item).forEach(key => keySet.add(key));
    });

    // Ensure the image key ('id' or 'preview') is strictly first
    const rawKeys = Array.from(keySet);
    allKeys = [imageKey, ...rawKeys.filter(k => k !== imageKey)];
    visibleKeys = [...allKeys];

    renderColumnCheckboxes();
    populateDropdowns();
    applyFilters();
}

function renderColumnCheckboxes() {
    const container = document.getElementById('column-toggles');
    container.innerHTML = '';
    
    const imageKey = currentType === 'vehicles' ? 'id' : 'preview';

    allKeys.forEach(key => {
        if (key === imageKey) return; // Image key column is mandatory

        const label = document.createElement('label');
        label.className = 'checkbox-group';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = key;
        checkbox.checked = true;
        
        checkbox.addEventListener('change', () => {
            updateVisibleKeys();
            renderTableHeaders();
            renderTableBody();
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(key));
        container.appendChild(label);
    });
}

function updateVisibleKeys() {
    const checkboxes = document.querySelectorAll('#column-toggles input[type="checkbox"]');
    const imageKey = currentType === 'vehicles' ? 'id' : 'preview';
    visibleKeys = [imageKey];
    
    checkboxes.forEach(cb => {
        if (cb.checked) visibleKeys.push(cb.value);
    });
}

function populateDropdowns() {
    if (currentType === 'vehicles') {
        const categories = new Set();
        const modelIds = new Set();
        const vehicleNames = new Set();
        const modelNames = new Set();

        vehiclesData.forEach(v => {
            if (v.category !== undefined && v.category !== null) categories.add(v.category);
            if (v.model_id !== undefined && v.model_id !== null) modelIds.add(v.model_id);
            if (v.vehicle_name !== undefined && v.vehicle_name !== null) vehicleNames.add(v.vehicle_name);
            if (v.model_name !== undefined && v.model_name !== null) modelNames.add(v.model_name);
        });

        populateSelect(document.getElementById('category-filter'), categories, 'All Categories');
        populateSelect(document.getElementById('model-id-filter'), modelIds, 'All Model IDs');
        populateSelect(document.getElementById('vehicle-name-filter'), vehicleNames, 'All Vehicle Names');
        populateSelect(document.getElementById('model-name-filter'), modelNames, 'All Model Names');
    } else {
        const genders = new Set();
        const locations = new Set();
        const skinIds = new Set();
        const skinNames = new Set();

        pedsData.forEach(p => {
            if (p.gender !== undefined && p.gender !== null) genders.add(p.gender);
            if (p.singleplayer_location !== undefined && p.singleplayer_location !== null) locations.add(p.singleplayer_location);
            if (p.skin_id !== undefined && p.skin_id !== null) skinIds.add(p.skin_id);
            if (p.skin_name_type !== undefined && p.skin_name_type !== null) skinNames.add(p.skin_name_type);
        });

        populateSelect(document.getElementById('gender-filter'), genders, 'All Genders');
        populateSelect(document.getElementById('location-filter'), locations, 'All Locations');
        populateSelect(document.getElementById('skin-id-filter'), skinIds, 'All Skin IDs');
        populateSelect(document.getElementById('skin-name-filter'), skinNames, 'All Skin Names');
    }
}

function populateSelect(selectElement, dataSet, defaultText) {
    selectElement.innerHTML = `<option value="">${defaultText}</option>`;
    
    Array.from(dataSet).sort().forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        selectElement.appendChild(option);
    });
}

function setupEventListeners() {
    // Global Search & filters input/change listener
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', applyFilters);
        input.addEventListener('change', applyFilters);
    });
}

function applyFilters() {
    const globalSearch = document.getElementById('global-search').value.toLowerCase();
    const currentDataset = currentType === 'vehicles' ? vehiclesData : pedsData;

    currentFilteredData = currentDataset.filter(item => {
        if (globalSearch) {
            const match = Object.values(item).some(val => 
                String(val).toLowerCase().includes(globalSearch)
            );
            if (!match) return false;
        }

        if (currentType === 'vehicles') {
            const category = document.getElementById('category-filter').value;
            const modelId = document.getElementById('model-id-filter').value;
            const vehicleName = document.getElementById('vehicle-name-filter').value;
            const modelName = document.getElementById('model-name-filter').value;

            if (category && String(item.category) !== category) return false;
            if (modelId && String(item.model_id) !== modelId) return false;
            if (vehicleName && String(item.vehicle_name) !== vehicleName) return false;
            if (modelName && String(item.model_name) !== modelName) return false;
        } else {
            const gender = document.getElementById('gender-filter').value;
            const location = document.getElementById('location-filter').value;
            const skinId = document.getElementById('skin-id-filter').value;
            const skinName = document.getElementById('skin-name-filter').value;

            if (gender && String(item.gender) !== gender) return false;
            if (location && String(item.singleplayer_location) !== location) return false;
            if (skinId && String(item.skin_id) !== skinId) return false;
            if (skinName && String(item.skin_name_type) !== skinName) return false;
        }

        return true;
    });

    renderTableHeaders();
    renderTableBody();
}

function renderTableHeaders() {
    const tr = document.getElementById('table-head-row');
    tr.innerHTML = '';

    const imageKey = currentType === 'vehicles' ? 'id' : 'preview';

    visibleKeys.forEach(key => {
        const th = document.createElement('th');
        th.textContent = (key === imageKey) ? 'Image' : key;
        tr.appendChild(th);
    });
}

function renderTableBody() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    // DocumentFragment batches operations for maximum rendering performance
    const fragment = document.createDocumentFragment();
    const imageKey = currentType === 'vehicles' ? 'id' : 'preview';

    currentFilteredData.forEach(item => {
        const tr = document.createElement('tr');

        visibleKeys.forEach(key => {
            const td = document.createElement('td');
            const value = item[key];

            if (key === imageKey) {
                if (value) {
                    const img = document.createElement('img');
                    img.src = value;
                    img.alt = 'Entity preview';
                    img.className = 'vehicle-image';
                    td.appendChild(img);
                } else {
                    td.textContent = 'No Image';
                }
            } else {
                td.textContent = (value !== undefined && value !== null) ? value : '';
            }

            tr.appendChild(td);
        });

        fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
}
