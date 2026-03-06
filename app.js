// DATI
let appData = {
    products: [
        { id: 1, name: "iPhone 14 Pro", category: "Elettronica", subcategory: "Smartphone", quantity: 15, unit: "pezzi", price: 1199, supplier: "Apple Store", status: "in-stock" },
        { id: 2, name: "MacBook Air M2", category: "Elettronica", subcategory: "Computer", quantity: 8, unit: "pezzi", price: 1499, supplier: "Apple Store", status: "in-stock" },
        { id: 3, name: "Farina 00", category: "Alimentari", subcategory: "Farine", quantity: 3, unit: "kg", price: 1.5, supplier: "Fornitore Alimentari", status: "low-stock" },
        { id: 4, name: "Spaghetti", category: "Alimentari", subcategory: "Pasta", quantity: 0, unit: "kg", price: 1.2, supplier: "Fornitore Alimentari", status: "out-of-stock" }
    ],
    categories: [
        { id: 1, name: "Elettronica", productCount: 2, subcategories: ["Smartphone", "Computer", "Tablet"] },
        { id: 2, name: "Alimentari", productCount: 2, subcategories: ["Farine", "Pasta", "Conserve"] }
    ],
    suppliers: [
        { id: 1, name: "Apple Store", phone: "+39 02 1234567", email: "orders@apple.com", productCount: 2 },
        { id: 2, name: "Fornitore Alimentari", phone: "+39 055 123456", email: "info@alimentari.it", productCount: 2 }
    ],
    settings: { language: 'it', currency: 'EUR', decimalPlaces: 2, lowStockLimit: 5, stockNotifications: 'all', googleScriptUrl: '' },
    monthlySnapshots: [],
    monthlyInventoryChanges: {}
};

// INITIALIZATION
window.onload = function () {
    // Load data from localStorage
    const savedData = localStorage.getItem('inventarioData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            // Merge with default appData to ensure new settings fields exist
            appData = {
                ...appData,
                ...parsedData,
                settings: { ...appData.settings, ...parsedData.settings }
            };
        } catch (e) {
            console.error('Error loading data:', e);
        }
    }

    // Set default view
    showTab('dashboard');

    // Add Global Event Listeners
    document.getElementById('searchInput').addEventListener('input', handleSearch);

    // Initial render
    updateAll();
};

// ... existing functions ...
// TAB NAVIGATION
function showTab(tabName) {
    // Update Active Tab Button
    document.querySelectorAll('.nav-tab').forEach(tab => {
        const isActive = tab.getAttribute('onclick').includes(tabName);
        tab.classList.toggle('active', isActive);
    });

    // Update Tab Content Visibility
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });

    // Load Tab-Specific Data
    const tabLoaders = {
        'dashboard': loadDashboardData,
        'products': loadProductsTab,
        'categories': loadCategoriesTab,
        'suppliers': loadSuppliersTab,
        'reports': loadReportsTab,
        'monthly-inventory': loadMonthlyInventoryTab,
        'settings': loadSettingsTab
    };

    if (tabLoaders[tabName]) tabLoaders[tabName]();

    // On mobile, scroll to top when changing tabs
    if (window.innerWidth <= 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function loadDashboardData() {
    updateStatistics();
    renderRecentProducts();
}

function loadProductsTab() {
    populateCategoryDropdown('productCategory');
    populateSupplierDropdown('productSupplier');
    renderAllProductsTable();
}

function loadCategoriesTab() {
    renderCategoriesTable();
}

function loadSuppliersTab() {
    renderSuppliersTable();
}

function loadReportsTab() {
    // Give time for display: block to take effect before rendering charts
    setTimeout(renderCharts, 50);
}

function loadMonthlyInventoryTab() {
    renderMonthlyInventoryTable();
    updateMonthlyStats();
}

function loadSettingsTab() {
    const settings = appData.settings;
    const fields = {
        'lowStockNotifications': settings.stockNotifications,
        'lowStockThreshold': settings.lowStockLimit,
        'language': settings.language,
        'currency': settings.currency,
        'decimalPlaces': settings.decimalPlaces,
        'supabaseUrl': settings.supabaseUrl || '',
        'supabaseKey': settings.supabaseKey || ''
    };

    for (const [id, value] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el) el.value = value;
    }

    // Carica stato auto-sync
    const autoSyncCheckbox = document.getElementById('autoSyncEnabled');
    if (autoSyncCheckbox) {
        autoSyncCheckbox.checked = settings.autoSync !== false;
    }
}

function populateCategoryDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    if (selectId === 'monthlyCategoryFilter') {
        select.innerHTML = '<option value="">Tutte le Categorie</option>';
    } else {
        select.innerHTML = '<option value="">Seleziona categoria</option>';
    }

    appData.categories.forEach(category => {
        select.innerHTML += `<option value="${category.id}">${category.name}</option>`;
    });
}

function populateSupplierDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">Seleziona fornitore</option>';
    appData.suppliers.forEach(supplier => {
        select.innerHTML += `<option value="${supplier.id}">${supplier.name}</option>`;
    });
}

// CORE RENDERING ENGINE
function updateStatistics() {
    const stats = {
        totalProducts: appData.products.length,
        totalValue: appData.products.reduce((sum, p) => sum + (p.quantity * p.price), 0),
        inStock: appData.products.filter(p => p.quantity > appData.settings.lowStockLimit).length,
        lowStock: appData.products.filter(p => p.quantity > 0 && p.quantity <= appData.settings.lowStockLimit).length,
        outOfStock: appData.products.filter(p => p.quantity === 0).length,
        categories: appData.categories.length
    };

    const currency = appData.settings.currency === 'EUR' ? '€' : appData.settings.currency === 'USD' ? '$' : '£';

    // Dashboard Main Stats
    const totalProdElem = document.getElementById('total-products');
    const totalValElem = document.getElementById('total-value');
    if (totalProdElem) totalProdElem.textContent = stats.totalProducts;
    if (totalValElem) totalValElem.textContent = `${currency} ${stats.totalValue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Settings Stats (if present)
    const settingsTotal = document.getElementById('settings-total-products');
    const settingsValue = document.getElementById('settings-total-value');
    if (settingsTotal) settingsTotal.textContent = stats.totalProducts;
    if (settingsValue) settingsValue.textContent = `${currency} ${stats.totalValue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Dashboard Stats
    document.getElementById('inStockCount').textContent = stats.inStock;
    document.getElementById('lowStockCount').textContent = stats.lowStock;
    document.getElementById('outOfStockCount').textContent = stats.outOfStock;
    document.getElementById('categoriesCount').textContent = stats.categories;
}

let currentDashboardFilter = null;

function filterDashboardByStatus(status) {
    if (currentDashboardFilter === status) {
        currentDashboardFilter = null; // Toggle off
    } else {
        currentDashboardFilter = status;
    }

    // Update card styling
    document.querySelectorAll('.dashboard-stat-filter').forEach(card => {
        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
        card.style.border = '1px solid var(--border)';
        card.style.transform = 'translateY(0)';
    });

    if (currentDashboardFilter) {
        const activeCard = document.getElementById(`filter-card-${status}`);
        if (activeCard) {
            activeCard.style.boxShadow = '0 8px 16px rgba(67, 97, 238, 0.15)';
            activeCard.style.border = '2px solid var(--primary)';
            activeCard.style.transform = 'translateY(-2px)';
        }
    }

    renderRecentProducts();
}

function renderRecentProducts() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    let productsList = [...appData.products].reverse();

    if (currentDashboardFilter === 'in-stock') {
        productsList = productsList.filter(p => p.quantity > appData.settings.lowStockLimit);
    } else if (currentDashboardFilter === 'low-stock') {
        productsList = productsList.filter(p => p.quantity > 0 && p.quantity <= appData.settings.lowStockLimit);
    } else if (currentDashboardFilter === 'out-of-stock') {
        productsList = productsList.filter(p => p.quantity === 0);
    }

    // Mostriamo gli ultimi 10 se non c'è il filtro, altrimenti li mostriamo tutti quelli del filtro
    const recent = currentDashboardFilter ? productsList : productsList.slice(0, 10);

    // Update the title
    const tableHeader = document.getElementById('dashboardTableTitle');
    if (tableHeader) {
        if (currentDashboardFilter === 'in-stock') {
            tableHeader.innerHTML = '<i class="fas fa-box" style="margin-right: 0.5rem; color: #4cc9f0;"></i>Prodotti In Stock';
        } else if (currentDashboardFilter === 'low-stock') {
            tableHeader.innerHTML = '<i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem; color: #f72585;"></i>Prodotti Sotto Soglia';
        } else if (currentDashboardFilter === 'out-of-stock') {
            tableHeader.innerHTML = '<i class="fas fa-clock" style="margin-right: 0.5rem; color: #e63946;"></i>Prodotti Esauriti';
        } else {
            tableHeader.innerHTML = '<i class="fas fa-history" style="margin-right: 0.5rem; color: var(--primary);"></i>Ultimi Prodotti Aggiunti';
        }
    }

    if (recent.length > 0) {
        tbody.innerHTML = recent.map(p => createProductRow(p)).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--gray); padding: 2rem;">Nessun prodotto trovato in questo stato</td></tr>';
    }
}

function renderAllProductsTable() {
    const tbody = document.getElementById('allProductsTableBody');
    if (!tbody) return;

    tbody.innerHTML = appData.products.map(p => {
        const currency = appData.settings.currency === 'EUR' ? '€' : '$';
        return `
                <tr class="fade-in">
                    <td class="product-cell">
                        <span class="product-name" style="font-weight: 600; color: var(--dark);">${p.name}</span>
                    </td>
                    <td><span class="badge ${getDepartmentBadgeClass(p.department || 'entrambi')}">${getDepartmentIcon(p.department || 'entrambi')}</span></td>
                    <td><span class="product-meta">${p.supplier || 'Nessun fornitore'}</span></td>
                    <td><span class="badge badge-category">${p.category}</span></td>
                    <td><span class="subcategory-text">${p.subcategory || '-'}</span></td>
                    <td class="quantity-cell">
                        <span class="quantity-value">${p.quantity}</span>
                        <span class="quantity-unit">${p.unit}</span>
                    </td>
                    <td class="price-cell">${currency} ${p.price.toFixed(2)}</td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn" onclick="openQuickQuantityModal(${p.id})" title="Aggiorna Quantità" style="background: rgba(76, 201, 240, 0.1); color: var(--accent);"><i class="fas fa-hashtag"></i></button>
                            <button class="action-btn edit" onclick="editProduct(${p.id})" title="Modifica"><i class="fas fa-edit"></i></button>
                            <button class="action-btn delete" onclick="deleteProduct(${p.id})" title="Elimina"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </td>
                </tr>`;
    }).join('');
}

function createProductRow(p) {
    const totalValue = p.quantity * p.price;
    const currency = appData.settings.currency === 'EUR' ? '€' : '$';

    let statusClass = 'badge-success';
    let statusText = 'In Stock';
    let statusIcon = 'fa-check-circle';

    if (p.quantity === 0) {
        statusClass = 'badge-danger';
        statusText = 'Esaurito';
        statusIcon = 'fa-times-circle';
    } else if (p.quantity <= appData.settings.lowStockLimit) {
        statusClass = 'badge-warning';
        statusText = 'Stock Basso';
        statusIcon = 'fa-exclamation-triangle';
    }

    return `
            <tr class="fade-in">
                <td class="product-cell">
                    <span class="product-name" style="font-weight: 600; color: var(--dark);">${p.name}</span>
                </td>
                <td><span class="badge ${getDepartmentBadgeClass(p.department || 'entrambi')}">${getDepartmentIcon(p.department || 'entrambi')}</span></td>
                <td><span class="product-meta">${p.supplier || 'Nessun fornitore'}</span></td>
                <td><span class="badge badge-category">${p.category}</span></td>
                <td class="quantity-cell">
                    <span class="quantity-value">${p.quantity}</span>
                    <span class="quantity-unit">${p.unit}</span>
                </td>
                <td class="price-cell">${currency} ${p.price.toFixed(2)}</td>
                <td class="price-cell"><strong>${currency} ${totalValue.toFixed(2)}</strong></td>
                <td><span class="badge ${statusClass}"><i class="fas ${statusIcon}"></i>${statusText}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit" onclick="editProduct(${p.id})" title="Modifica"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" onclick="deleteProduct(${p.id})" title="Elimina"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            </tr>`;
}

// FUNZIONI PRODOTTI
function showAddProductModal() {
    populateCategoryDropdown('modalProductCategory');
    populateSupplierDropdown('modalProductSupplier');

    // Reset fields
    document.getElementById('modalProductName').value = '';
    document.getElementById('modalProductCategory').value = '';
    document.getElementById('modalProductSubcategory').value = '';
    document.getElementById('modalProductDepartment').value = 'entrambi';
    document.getElementById('modalProductQuantity').value = '';
    document.getElementById('modalProductUnit').value = 'pezzi';
    document.getElementById('modalProductPrice').value = '';
    document.getElementById('modalProductSupplier').value = '';

    // Reset title
    document.querySelector('#addProductModal .modal-title').innerHTML = '<i class="fas fa-plus-circle" style="color: var(--primary);"></i>Nuovo Prodotto';

    // Reset button action
    const saveButton = document.querySelector('#addProductModal .btn-primary');
    if (saveButton) {
        saveButton.textContent = 'Salva Prodotto';
        saveButton.onclick = saveProduct;
    }

    document.getElementById('addProductModal').classList.add('show');
}

function closeAddProductModal() {
    document.getElementById('addProductModal').classList.remove('show');
}

function saveProduct() {
    const name = document.getElementById('modalProductName').value;
    const categoryId = document.getElementById('modalProductCategory').value;
    const subcategory = document.getElementById('modalProductSubcategory').value;
    const department = document.getElementById('modalProductDepartment').value;
    const quantity = parseFloat(document.getElementById('modalProductQuantity').value);
    const unit = document.getElementById('modalProductUnit').value;
    const price = parseFloat(document.getElementById('modalProductPrice').value);
    const supplierId = document.getElementById('modalProductSupplier').value;

    if (!name || !categoryId || isNaN(quantity) || isNaN(price)) {
        showNotification('Compila tutti i campi obbligatori', 'error');
        return;
    }

    const category = appData.categories.find(cat => cat.id == categoryId);
    const supplier = appData.suppliers.find(sup => sup.id == supplierId);

    const newProduct = {
        id: Date.now(),
        name: name,
        category: category.name,
        subcategory: subcategory,
        department: department || 'entrambi',
        quantity: quantity,
        unit: unit,
        price: price,
        supplier: supplier ? supplier.name : 'Default',
        status: quantity === 0 ? 'out-of-stock' : quantity <= appData.settings.lowStockLimit ? 'low-stock' : 'in-stock'
    };

    appData.products.push(newProduct);
    category.productCount++;
    if (supplier) supplier.productCount++;

    saveToCloud();
    closeAddProductModal();
    updateAll();
    showNotification('Prodotto aggiunto!');
}

function addProductFromForm() {
    const name = document.getElementById('productName').value;
    const categoryId = document.getElementById('productCategory').value;
    const subcategory = document.getElementById('productSubcategory').value;
    const department = document.getElementById('productDepartment').value;
    const quantity = parseFloat(document.getElementById('productQuantity').value);
    const unit = document.getElementById('productUnit').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const supplierId = document.getElementById('productSupplier').value;

    if (!name || !categoryId || isNaN(quantity) || isNaN(price)) {
        showNotification('Compila tutti i campi obbligatori', 'error');
        return;
    }

    const category = appData.categories.find(cat => cat.id == categoryId);
    const supplier = appData.suppliers.find(sup => sup.id == supplierId);

    const newProduct = {
        id: Date.now(),
        name: name,
        category: category.name,
        subcategory: subcategory,
        department: department || 'entrambi',
        quantity: quantity,
        unit: unit,
        price: price,
        supplier: supplier ? supplier.name : 'Default',
        status: quantity === 0 ? 'out-of-stock' : quantity <= appData.settings.lowStockLimit ? 'low-stock' : 'in-stock'
    };

    appData.products.push(newProduct);
    category.productCount++;
    if (supplier) supplier.productCount++;

    // Reset form
    document.getElementById('productName').value = '';
    document.getElementById('productCategory').value = '';
    document.getElementById('productDepartment').value = 'entrambi';
    document.getElementById('productSubcategory').value = '';
    document.getElementById('productQuantity').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productSupplier').value = '';

    updateAll();
    showNotification('Prodotto aggiunto!');
}

function editProduct(productId) {
    const product = appData.products.find(p => p.id === productId);
    if (!product) return;

    showAddProductModal();

    // Popola i campi con i dati del prodotto
    document.getElementById('modalProductName').value = product.name;
    document.getElementById('modalProductDepartment').value = product.department || 'entrambi';

    const category = appData.categories.find(c => c.name === product.category);
    if (category) {
        document.getElementById('modalProductCategory').value = category.id;
        updateSubcategories('modal');

        // Imposta la sottocategoria dopo un breve ritardo per permettere il caricamento
        setTimeout(() => {
            document.getElementById('modalProductSubcategory').value = product.subcategory;
        }, 100);
    }

    document.getElementById('modalProductQuantity').value = product.quantity;
    document.getElementById('modalProductUnit').value = product.unit;
    document.getElementById('modalProductPrice').value = product.price;

    const supplier = appData.suppliers.find(s => s.name === product.supplier);
    if (supplier) {
        document.getElementById('modalProductSupplier').value = supplier.id;
    }

    // Cambia il titolo del modal
    document.querySelector('#addProductModal .modal-title').innerHTML = '<i class="fas fa-edit"></i>Modifica Prodotto';

    // Cambia l'azione del pulsante Salva
    const saveButton = document.querySelector('#addProductModal .btn-primary');
    if (saveButton) {
        saveButton.textContent = 'Aggiorna Prodotto';
        saveButton.onclick = function () { updateProduct(productId); };
    }
}

function updateProduct(productId) {
    const name = document.getElementById('modalProductName').value;
    const categoryId = document.getElementById('modalProductCategory').value;
    const subcategory = document.getElementById('modalProductSubcategory').value;
    const department = document.getElementById('modalProductDepartment').value;
    const quantity = parseFloat(document.getElementById('modalProductQuantity').value);
    const unit = document.getElementById('modalProductUnit').value;
    const price = parseFloat(document.getElementById('modalProductPrice').value);
    const supplierId = document.getElementById('modalProductSupplier').value;

    if (!name || !categoryId || isNaN(quantity) || isNaN(price)) {
        showNotification('Compila tutti i campi obbligatori', 'error');
        return;
    }

    const productIndex = appData.products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;

    const oldCategory = appData.categories.find(c => c.name === appData.products[productIndex].category);
    if (oldCategory) oldCategory.productCount--;

    const oldSupplier = appData.suppliers.find(s => s.name === appData.products[productIndex].supplier);
    if (oldSupplier) oldSupplier.productCount--;

    const category = appData.categories.find(cat => cat.id == categoryId);
    const supplier = appData.suppliers.find(sup => sup.id == supplierId);

    appData.products[productIndex] = {
        id: productId,
        name: name,
        category: category.name,
        subcategory: subcategory,
        department: department || 'entrambi',
        quantity: quantity,
        unit: unit,
        price: price,
        supplier: supplier ? supplier.name : 'Default',
        status: quantity === 0 ? 'out-of-stock' : quantity <= appData.settings.lowStockLimit ? 'low-stock' : 'in-stock'
    };

    category.productCount++;
    if (supplier) supplier.productCount++;

    saveToCloud();
    closeAddProductModal();
    updateAll();
    showNotification('Prodotto aggiornato!');
}

// QUICK QUANTITY UPDATE
let currentQuickEditProductId = null;

function openQuickQuantityModal(productId) {
    const product = appData.products.find(p => p.id === productId);
    if (!product) return;

    currentQuickEditProductId = productId;

    document.getElementById('quickProductName').value = product.name;
    document.getElementById('quickCurrentQuantity').value = `${product.quantity} ${product.unit}`;
    document.getElementById('quickNewQuantity').value = product.quantity;

    document.getElementById('quickQuantityModal').classList.add('show');

    // Focus on input
    setTimeout(() => {
        const input = document.getElementById('quickNewQuantity');
        input.focus();
        input.select();
    }, 100);
}

function closeQuickQuantityModal() {
    document.getElementById('quickQuantityModal').classList.remove('show');
    currentQuickEditProductId = null;
}

function saveQuickQuantity() {
    if (!currentQuickEditProductId) return;

    const newQuantity = parseFloat(document.getElementById('quickNewQuantity').value);

    if (isNaN(newQuantity) || newQuantity < 0) {
        showNotification('Inserisci una quantità valida', 'error');
        return;
    }

    const productIndex = appData.products.findIndex(p => p.id === currentQuickEditProductId);
    if (productIndex === -1) return;

    const oldQuantity = appData.products[productIndex].quantity;
    appData.products[productIndex].quantity = newQuantity;

    // Update status
    appData.products[productIndex].status =
        newQuantity === 0 ? 'out-of-stock' :
            newQuantity <= appData.settings.lowStockLimit ? 'low-stock' : 'in-stock';

    closeQuickQuantityModal();
    updateAll();

    const productName = appData.products[productIndex].name;
    showNotification(`Quantità aggiornata: ${productName} (${oldQuantity} → ${newQuantity})`, 'success');
}

// PRODUCT TABLE FILTER
function filterProductsTable() {
    const searchTerm = document.getElementById('productSearchInput').value.toLowerCase();
    const tbody = document.getElementById('allProductsTableBody');
    if (!tbody) return;

    const filteredProducts = appData.products.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.subcategory.toLowerCase().includes(searchTerm) ||
        (product.supplier && product.supplier.toLowerCase().includes(searchTerm))
    );

    const currency = appData.settings.currency === 'EUR' ? '€' : '$';
    tbody.innerHTML = filteredProducts.map(p => {
        return `
                <tr class="fade-in">
                    <td class="product-cell">
                        <span class="product-name" style="font-weight: 600; color: var(--dark);">${p.name}</span>
                    </td>
                    <td><span class="product-meta">${p.supplier || 'Nessun fornitore'}</span></td>
                    <td><span class="badge badge-category">${p.category}</span></td>
                    <td><span class="subcategory-text">${p.subcategory || '-'}</span></td>
                    <td class="quantity-cell">
                        <span class="quantity-value">${p.quantity}</span>
                        <span class="quantity-unit">${p.unit}</span>
                    </td>
                    <td class="price-cell">${currency} ${p.price.toFixed(2)}</td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn" onclick="openQuickQuantityModal(${p.id})" title="Aggiorna Quantità" style="background: rgba(76, 201, 240, 0.1); color: var(--accent);"><i class="fas fa-hashtag"></i></button>
                            <button class="action-btn edit" onclick="editProduct(${p.id})" title="Modifica"><i class="fas fa-edit"></i></button>
                            <button class="action-btn delete" onclick="deleteProduct(${p.id})" title="Elimina"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </td>
                </tr>`;
    }).join('');
}

function deleteProduct(productId) {
    if (confirm('Eliminare questo prodotto?')) {
        const index = appData.products.findIndex(p => p.id === productId);
        if (index !== -1) {
            const product = appData.products[index];

            // Aggiorna il conteggio nella categoria
            const category = appData.categories.find(c => c.name === product.category);
            if (category) category.productCount--;

            // Aggiorna il conteggio nel fornitore
            const supplier = appData.suppliers.find(s => s.name === product.supplier);
            if (supplier) supplier.productCount--;

            appData.products.splice(index, 1);
            saveToCloud();
            updateAll();
            showNotification('Prodotto eliminato');
        }
    }
}

// CATEGORIES & SUPPLIERS RENDERING
function renderCategoriesTable() {
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;

    const currency = appData.settings.currency === 'EUR' ? '€' : '$';

    tbody.innerHTML = appData.categories.map(c => {
        const catProducts = appData.products.filter(p => p.category === c.name);
        const totalVal = catProducts.reduce((sum, p) => sum + (p.quantity * p.price), 0);

        return `
                <tr class="fade-in">
                    <td><strong>${c.name}</strong></td>
                    <td><span class="badge badge-unit">${catProducts.length} Prodotti</span></td>
                    <td><span class="badge badge-success">${currency} ${totalVal.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>
                    <td>
                        <div class="d-flex flex-wrap gap-5">
                            ${c.subcategories.map(sub => `<span class="badge badge-unit">${sub}</span>`).join('')}
                        </div>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn edit" onclick="editCategory(${c.id})" title="Modifica"><i class="fas fa-edit"></i></button>
                            <button class="action-btn delete" onclick="deleteCategory(${c.id})" title="Elimina"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </td>
                </tr>`;
    }).join('');
}

function renderSuppliersTable() {
    const tbody = document.getElementById('suppliersTableBody');
    if (!tbody) return;

    tbody.innerHTML = appData.suppliers.map(s => `
                <tr class="fade-in">
                    <td>
                        <div class="supplier-info">
                            <span class="supplier-name">${s.name}</span>
                            <span class="supplier-address"><i class="fas fa-map-marker-alt"></i> ${s.address || '-'}</span>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex flex-column">
                            <span><i class="fas fa-phone"></i> ${s.phone || '-'}</span>
                        </div>
                    </td>
                    <td><a href="mailto:${s.email}" class="supplier-email"><i class="fas fa-envelope"></i> ${s.email || '-'}</a></td>
                    <td><span class="badge badge-unit">${s.productCount} Articoli</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn edit" onclick="editSupplier(${s.id})" title="Modifica"><i class="fas fa-edit"></i></button>
                            <button class="action-btn delete" onclick="deleteSupplier(${s.id})" title="Elimina"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
}

// FUNZIONI CATEGORIE
function showAddCategoryModal() {
    // Reset modal state
    const modalTitle = document.querySelector('#addCategoryModal .modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-folder-plus" style="color: var(--primary);"></i>Nuova Categoria';
    }
    const saveBtn = document.querySelector('#addCategoryModal .btn-primary');
    if (saveBtn) {
        saveBtn.textContent = 'Salva Categoria';
        saveBtn.onclick = saveCategory;
    }
    document.getElementById('modalCategoryName').value = '';
    document.getElementById('modalSubcategoryName').value = '';

    document.getElementById('addCategoryModal').classList.add('show');
}

function closeAddCategoryModal() {
    document.getElementById('addCategoryModal').classList.remove('show');
}

function saveCategory() {
    const nameInput = document.getElementById('modalCategoryName');
    const subInput = document.getElementById('modalSubcategoryName');
    const name = nameInput.value.trim();
    const subcategory = subInput.value.trim();

    if (!name) {
        showNotification('Inserisci un nome per la categoria', 'error');
        return;
    }

    // Check if category exists (case-insensitive)
    const existingCategory = appData.categories.find(c => c.name.toLowerCase() === name.toLowerCase());

    if (existingCategory) {
        // Category exists
        if (subcategory) {
            // Check if subcategory exists
            const subExists = existingCategory.subcategories.some(s => s.toLowerCase() === subcategory.toLowerCase());
            if (!subExists) {
                existingCategory.subcategories.push(subcategory);
                showNotification('Sottocategoria aggiunta alla categoria esistente!');
                closeAddCategoryModal();
            } else {
                showNotification('Sottocategoria già presente!', 'warning');
            }
        } else {
            showNotification('Categoria già esistente!', 'warning');
        }
    } else {
        const newCategory = {
            id: Date.now(),
            name: name,
            productCount: 0,
            subcategories: subcategory ? [subcategory] : []
        };

        appData.categories.push(newCategory);
        closeAddCategoryModal();
        showNotification('Categoria aggiunta!');
    }

    updateAll();
}

function addCategoryFromForm() {
    const nameInput = document.getElementById('categoryName');
    const subInput = document.getElementById('subcategoryName');
    const name = nameInput.value.trim();
    const subcategory = subInput.value.trim();

    if (!name) {
        showNotification('Inserisci un nome per la categoria', 'error');
        return;
    }

    // Check if category exists (case-insensitive)
    const existingCategory = appData.categories.find(c => c.name.toLowerCase() === name.toLowerCase());

    if (existingCategory) {
        // Category exists
        if (subcategory) {
            // Check if subcategory exists
            const subExists = existingCategory.subcategories.some(s => s.toLowerCase() === subcategory.toLowerCase());
            if (!subExists) {
                existingCategory.subcategories.push(subcategory);
                showNotification('Sottocategoria aggiunta alla categoria esistente!');
            } else {
                showNotification('Sottocategoria già presente!', 'warning');
            }
        } else {
            showNotification('Categoria già esistente!', 'warning');
        }
    } else {
        const newCategory = {
            id: Date.now(),
            name: name,
            productCount: 0,
            subcategories: subcategory ? [subcategory] : []
        };

        appData.categories.push(newCategory);
        showNotification('Categoria aggiunta!');
    }

    // Reset form
    nameInput.value = '';
    subInput.value = '';

    updateAll();
}

function editCategory(categoryId) {
    const category = appData.categories.find(c => c.id === categoryId);
    if (!category) return;

    showAddCategoryModal();

    // Popola i campi con i dati della categoria
    document.getElementById('modalCategoryName').value = category.name;

    // Cambia il titolo del modal
    document.querySelector('#addCategoryModal .modal-title').innerHTML = '<i class="fas fa-edit" style="color: var(--primary);"></i>Modifica Categoria';

    // Cambia l'azione del pulsante Salva
    const saveButton = document.querySelector('#addCategoryModal .btn-primary');
    saveButton.textContent = 'Aggiorna Categoria';
    saveButton.onclick = function () { updateCategory(categoryId); };
}

function updateCategory(categoryId) {
    const name = document.getElementById('modalCategoryName').value;

    if (!name) {
        showNotification('Inserisci un nome per la categoria', 'error');
        return;
    }

    const categoryIndex = appData.categories.findIndex(c => c.id === categoryId);
    if (categoryIndex === -1) return;

    // Aggiorna i prodotti che usano questa categoria
    const oldName = appData.categories[categoryIndex].name;
    appData.products.forEach(product => {
        if (product.category === oldName) {
            product.category = name;
        }
    });

    appData.categories[categoryIndex].name = name;

    closeAddCategoryModal();
    updateAll();
    showNotification('Categoria aggiornata!');
}

function deleteCategory(categoryId) {
    if (confirm('Eliminare questa categoria? I prodotti associati verranno spostati in "Senza categoria".')) {
        const index = appData.categories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            // Sposta i prodotti in una categoria predefinita
            appData.products.forEach(product => {
                if (product.category === appData.categories[index].name) {
                    product.category = "Senza categoria";
                }
            });

            appData.categories.splice(index, 1);
            saveToCloud();
            updateAll();
            showNotification('Categoria eliminata');
        }
    }
}

// FUNZIONI FORNITORI
function showAddSupplierModal() {
    // Reset modal state
    const modalTitle = document.querySelector('#addSupplierModal .modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-id-card" style="color: var(--primary);"></i>Nuovo Fornitore';
    }
    const saveBtn = document.querySelector('#addSupplierModal .btn-primary');
    if (saveBtn) {
        saveBtn.textContent = 'Salva Fornitore';
        saveBtn.onclick = saveSupplier;
    }

    // Reset form
    document.getElementById('modalSupplierName').value = '';
    document.getElementById('modalSupplierPhone').value = '';
    document.getElementById('modalSupplierEmail').value = '';
    document.getElementById('modalSupplierAddress').value = '';

    document.getElementById('addSupplierModal').classList.add('show');
}

function closeAddSupplierModal() {
    document.getElementById('addSupplierModal').classList.remove('show');
}

function saveSupplier() {
    const name = document.getElementById('modalSupplierName').value;
    const phone = document.getElementById('modalSupplierPhone').value;
    const email = document.getElementById('modalSupplierEmail').value;
    const address = document.getElementById('modalSupplierAddress').value;

    if (!name) {
        showNotification('Inserisci un nome per il fornitore', 'error');
        return;
    }

    const newSupplier = {
        id: Date.now(),
        name: name,
        phone: phone,
        email: email,
        address: address,
        productCount: 0
    };

    appData.suppliers.push(newSupplier);
    closeAddSupplierModal();
    updateAll();
    showNotification('Fornitore aggiunto!');
}

function addSupplierFromForm() {
    const name = document.getElementById('supplierName').value;
    const phone = document.getElementById('supplierPhone').value;
    const email = document.getElementById('supplierEmail').value;
    const address = document.getElementById('supplierAddress').value;

    if (!name) {
        showNotification('Inserisci un nome per il fornitore', 'error');
        return;
    }

    const newSupplier = {
        id: Date.now(),
        name: name,
        phone: phone,
        email: email,
        address: address,
        productCount: 0
    };

    appData.suppliers.push(newSupplier);

    // Reset form
    document.getElementById('supplierName').value = '';
    document.getElementById('supplierPhone').value = '';
    document.getElementById('supplierEmail').value = '';
    document.getElementById('supplierAddress').value = '';

    updateAll();
    showNotification('Fornitore aggiunto!');
}

function editSupplier(supplierId) {
    const supplier = appData.suppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    showAddSupplierModal();

    // Popola i campi con i dati del fornitore
    document.getElementById('modalSupplierName').value = supplier.name;
    document.getElementById('modalSupplierPhone').value = supplier.phone;
    document.getElementById('modalSupplierEmail').value = supplier.email;
    document.getElementById('modalSupplierAddress').value = supplier.address;

    // Cambia il titolo del modal
    document.querySelector('#addSupplierModal .modal-title').innerHTML = '<i class="fas fa-edit" style="color: var(--primary);"></i>Modifica Fornitore';

    // Cambia l'azione del pulsante Salva
    const saveButton = document.querySelector('#addSupplierModal .btn-primary');
    if (saveButton) {
        saveButton.textContent = 'Aggiorna Fornitore';
        saveButton.onclick = function () { updateSupplier(supplierId); };
    }
}

function updateSupplier(supplierId) {
    const name = document.getElementById('modalSupplierName').value;
    const phone = document.getElementById('modalSupplierPhone').value;
    const email = document.getElementById('modalSupplierEmail').value;
    const address = document.getElementById('modalSupplierAddress').value;

    if (!name) {
        showNotification('Inserisci un nome per il fornitore', 'error');
        return;
    }

    const supplierIndex = appData.suppliers.findIndex(s => s.id === supplierId);
    if (supplierIndex === -1) return;

    // Aggiorna i prodotti che usano questo fornitore
    const oldName = appData.suppliers[supplierIndex].name;
    appData.products.forEach(product => {
        if (product.supplier === oldName) {
            product.supplier = name;
        }
    });

    appData.suppliers[supplierIndex] = {
        ...appData.suppliers[supplierIndex],
        name: name,
        phone: phone,
        email: email,
        address: address
    };

    closeAddSupplierModal();
    updateAll();
    showNotification('Fornitore aggiornato!');
}

function deleteSupplier(supplierId) {
    if (confirm('Eliminare questo fornitore? I prodotti associati verranno spostati in "Fornitore sconosciuto".')) {
        const index = appData.suppliers.findIndex(s => s.id === supplierId);
        if (index !== -1) {
            // Sposta i prodotti in un fornitore predefinito
            appData.products.forEach(product => {
                if (product.supplier === appData.suppliers[index].name) {
                    product.supplier = "Fornitore sconosciuto";
                }
            });

            appData.suppliers.splice(index, 1);
            saveToCloud();
            updateAll();
            showNotification('Fornitore eliminato');
        }
    }
}

// FUNZIONI SOTTOCATEGORIE
function updateSubcategories(type) {
    const categorySelect = type === 'modal' ?
        document.getElementById('modalProductCategory') :
        document.getElementById('productCategory');

    const subcategorySelect = type === 'modal' ?
        document.getElementById('modalProductSubcategory') :
        document.getElementById('productSubcategory');

    if (!categorySelect || !subcategorySelect) return;

    const categoryId = categorySelect.value;
    const category = appData.categories.find(c => c.id == categoryId);

    subcategorySelect.innerHTML = '<option value="">Seleziona sottocategoria</option>';

    if (category && category.subcategories) {
        category.subcategories.forEach(subcategory => {
            subcategorySelect.innerHTML += `<option value="${subcategory}">${subcategory}</option>`;
        });
    }
}

// FUNZIONI REPORT
function showCategoryReport() {
    if (!window.jspdf) {
        showNotification('Libreria PDF non caricata. Controlla la connessione internet.', 'error');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Report per Categoria", 14, 22);
    doc.setFontSize(11);
    doc.text("Generato il: " + new Date().toLocaleString(), 14, 30);

    const tableColumn = ["Categoria", "Prodotti", "Quantità Totale", "Valore Totale"];
    const tableRows = [];

    const currency = appData.settings.currency === 'EUR' ? '€' : '$';

    appData.categories.forEach(cat => {
        const catProducts = appData.products.filter(p => p.category === cat.name);
        const totalQty = catProducts.reduce((sum, p) => sum + p.quantity, 0);
        const totalVal = catProducts.reduce((sum, p) => sum + (p.quantity * p.price), 0);

        tableRows.push([
            cat.name,
            catProducts.length,
            totalQty.toFixed(2),
            currency + " " + totalVal.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        ]);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [114, 9, 183] }
    });

    doc.save("report_categorie.pdf");
    showNotification('Report Categorie scaricato!', 'success');
}

function showSupplierReport() {
    if (!window.jspdf) {
        showNotification('Libreria PDF non caricata. Controlla la connessione internet.', 'error');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Report per Fornitore", 14, 22);
    doc.setFontSize(11);
    doc.text("Generato il: " + new Date().toLocaleString(), 14, 30);

    const tableColumn = ["Fornitore", "Prodotti", "Contatti", "Valore Fornitura"];
    const tableRows = [];

    appData.suppliers.forEach(sup => {
        const supProducts = appData.products.filter(p => p.supplier === sup.name);
        const totalVal = supProducts.reduce((sum, p) => sum + (p.quantity * p.price), 0);

        // Formatta i contatti
        let contactInfo = sup.email;
        if (sup.phone) contactInfo += (contactInfo ? " / " : "") + sup.phone;

        tableRows.push([
            sup.name,
            supProducts.length,
            contactInfo || "-",
            "€ " + totalVal.toFixed(2)
        ]);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [58, 12, 163] }
    });

    doc.save("report_fornitori.pdf");
    showNotification('Report Fornitori scaricato!', 'success');
}

function showStockReport() {
    showNotification('Report stock generato', 'success');
}

function showValueReport() {
    showNotification('Report valore generato', 'success');
}

function generateStockReport() {

    // Fix for jspdf undefined
    if (!window.jspdf) {
        showNotification('Libreria PDF non caricata. Controlla la connessione internet.', 'error');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Report Stock Magazzino", 14, 22);
    doc.setFontSize(11);
    doc.text("Generato il: " + new Date().toLocaleString(), 14, 30);

    const tableColumn = ["Prodotto", "Categoria", "Qta", "Unita", "Stato"];
    const tableRows = [];

    appData.products.forEach(product => {
        const productData = [
            product.name,
            product.category,
            product.quantity,
            product.unit,
            product.status === 'out-of-stock' ? 'Esaurito' : (product.status === 'low-stock' ? 'Basso' : 'Ok')
        ];
        tableRows.push(productData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [67, 97, 238] }
    });

    doc.save("report_stock.pdf");
    showNotification('PDF scaricato!', 'success');
}

function generateValueReport() {
    // Fix for jspdf undefined
    if (!window.jspdf) {
        showNotification('Libreria PDF non caricata. Controlla la connessione internet.', 'error');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Report Valore Magazzino", 14, 22);
    doc.setFontSize(11);
    doc.text("Generato il: " + new Date().toLocaleString(), 14, 30);

    let totalValue = 0;
    const tableColumn = ["Prodotto", "Qta", "Prezzo", "Totale"];
    const tableRows = [];

    const currency = appData.settings.currency === 'EUR' ? '€' : '$';

    appData.products.forEach(product => {
        const rowTotal = product.quantity * product.price;
        totalValue += rowTotal;
        const productData = [
            product.name,
            product.quantity,
            currency + " " + product.price.toFixed(2),
            currency + " " + rowTotal.toFixed(2)
        ];
        tableRows.push(productData);
    });

    // Add total row
    tableRows.push(["", "", "TOTALE VALORE", currency + " " + totalValue.toFixed(2)]);

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [45, 55, 72] },
        didParseCell: function (data) {
            if (data.row.index === tableRows.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [240, 240, 240];
            }
        }
    });

    doc.text("Valore Totale Inventario: € " + totalValue.toFixed(2), 14, doc.lastAutoTable.finalY + 10);

    doc.save("report_valore.pdf");
    showNotification('PDF scaricato!', 'success');
}

// FUNZIONI IMPOSTAZIONI
function toggleAutoSync() {
    const checkbox = document.getElementById('autoSyncEnabled');
    appData.settings.autoSync = checkbox.checked;
    saveToCloud();

    if (checkbox.checked) {
        showNotification('Sincronizzazione automatica attivata', 'success');
        updateCloudStatus('online', 'Auto-sync ON');
    } else {
        showNotification('Sincronizzazione automatica disattivata', 'warning');
        updateCloudStatus('offline', 'Locale');
    }
}

function generateQRCode() {
    const url = document.getElementById('googleScriptUrl').value;
    if (!url) {
        showNotification('Inserisci prima l\'URL dello script', 'error');
        return;
    }

    const container = document.getElementById('qrCodeContainer');
    const qrImage = document.getElementById('qrCodeImage');

    // Usa un servizio API per generare il QR code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
    qrImage.innerHTML = `<img src="${qrUrl}" alt="QR Code" style="max-width: 250px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">`;
    container.style.display = 'block';

    showNotification('QR Code generato!', 'success');
}

function saveSettings() {
    try {
        const notifications = document.getElementById('lowStockNotifications');
        const threshold = document.getElementById('lowStockThreshold');
        const lang = document.getElementById('language');
        const curr = document.getElementById('currency');
        const decimals = document.getElementById('decimalPlaces');
        const url = document.getElementById('supabaseUrl');
        const key = document.getElementById('supabaseKey');

        if (notifications) appData.settings.stockNotifications = notifications.value;
        if (threshold) appData.settings.lowStockLimit = parseInt(threshold.value) || 5;
        if (lang) appData.settings.language = lang.value;
        if (curr) appData.settings.currency = curr.value;
        if (decimals) appData.settings.decimalPlaces = parseInt(decimals.value) || 2;

        let urlChanged = false;
        if (url && url.value.trim() !== (appData.settings.supabaseUrl || '')) {
            appData.settings.supabaseUrl = url.value.trim();
            urlChanged = true;
        }
        if (key) {
            appData.settings.supabaseKey = key.value.trim();
        }

        // Save locally
        localStorage.setItem('inventarioData', JSON.stringify(appData));

        if (urlChanged && appData.settings.supabaseUrl) {
            // DO NOT auto-sync if URL just changed! Let the user restore manually by clicking the button.
            // If they just linked the app, they probably want to pull data, not wipe the cloud!
            appData.settings.autoSync = false; // Disable temporarily to be safe
            const autoSyncCheckbox = document.getElementById('autoSyncEnabled');
            if (autoSyncCheckbox) autoSyncCheckbox.checked = false;

            showNotification('Nuove credenziali Supabase salvate. Clicca "Ripristina dal Cloud" per scaricare.', 'warning');
        } else {
            saveToCloud(); // Normal save (triggers auto-sync)
            showNotification('Impostazioni salvate!');
        }
    } catch (err) {
        console.error('Errore durante il salvataggio:', err);
        showNotification('Errore nel salvataggio impostazioni', 'error');
    }
}

function exportBackup() {
    const dataStr = JSON.stringify(appData);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = 'inventario_backup.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    showNotification('Backup esportato!');
}

function exportBackupXLSX() {
    try {
        const wb = XLSX.utils.book_new();

        // 1. Foglio Prodotti
        const productsData = appData.products.map(p => ({
            'ID': p.id,
            'Nome': p.name,
            'Categoria': p.category,
            'Sottocategoria': p.subcategory || '-',
            'Reparto': p.department || 'entrambi',
            'Quantità': p.quantity,
            'Unità': p.unit,
            'Prezzo': p.price,
            'Valore Totale': (p.quantity * p.price).toFixed(2),
            'Fornitore': p.supplier || 'Nessuno',
            'Stato': p.status
        }));
        const wsProducts = XLSX.utils.json_to_sheet(productsData);
        XLSX.utils.book_append_sheet(wb, wsProducts, "Prodotti");

        // 2. Foglio Categorie
        const categoriesData = appData.categories.map(c => ({
            'ID': c.id,
            'Nome': c.name,
            'Prodotti': c.productCount,
            'Sottocategorie': (c.subcategories || []).join(', ')
        }));
        const wsCategories = XLSX.utils.json_to_sheet(categoriesData);
        XLSX.utils.book_append_sheet(wb, wsCategories, "Categorie");

        // 3. Foglio Fornitori
        const suppliersData = appData.suppliers.map(s => ({
            'ID': s.id,
            'Nome': s.name,
            'Telefono': s.phone || '-',
            'Email': s.email || '-',
            'Indirizzo': s.address || '-',
            'Prodotti': s.productCount
        }));
        const wsSuppliers = XLSX.utils.json_to_sheet(suppliersData);
        XLSX.utils.book_append_sheet(wb, wsSuppliers, "Fornitori");

        // 4. Foglio Impostazioni
        const settingsData = [{
            'Lingua': appData.settings.language,
            'Valuta': appData.settings.currency,
            'Soglia Stock Basso': appData.settings.lowStockLimit,
            'Decimali': appData.settings.decimalPlaces,
            'URL Supabase': appData.settings.supabaseUrl || '-'
        }];
        const wsSettings = XLSX.utils.json_to_sheet(settingsData);
        XLSX.utils.book_append_sheet(wb, wsSettings, "Impostazioni");

        // Genera il file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        XLSX.writeFile(wb, `Inventario_Backup_Full_${timestamp}.xlsx`);

        showNotification('Backup Excel creato con successo!', 'success');
    } catch (error) {
        console.error('Errore durante l\'esportazione XLSX:', error);
        showNotification('Errore durante la creazione del backup Excel', 'error');
    }
}

function showImportBackupModal() {
    document.getElementById('importBackupModal').classList.add('show');
}

function closeImportBackupModal() {
    document.getElementById('importBackupModal').classList.remove('show');
}

function restoreBackup() {
    const fileInput = document.getElementById('backupFile');
    if (!fileInput.files.length) {
        showNotification('Seleziona un file di backup', 'error');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const backupData = JSON.parse(e.target.result);

            // Validazione base dei dati
            if (backupData.products && backupData.categories && backupData.suppliers) {
                appData = backupData;
                saveToCloud();
                updateAll();
                closeImportBackupModal();
                showNotification('Backup ripristinato!');
            } else {
                showNotification('File di backup non valido', 'error');
            }
        } catch (error) {
            showNotification('Errore durante il ripristino del backup', 'error');
        }
    };

    reader.readAsText(file);
}

function resetData() {
    if (confirm('Sei sicuro di voler resettare tutti i dati? Questa operazione non può essere annullata.')) {
        appData.products = [];
        appData.categories = [];
        appData.suppliers = [];
        saveToCloud();
        updateAll();
        showNotification('Dati resettati');
    }
}

// FUNZIONI IMPORT/EXPORT
function showImportModal() {
    document.getElementById('importModal').classList.add('show');
    document.getElementById('excelFile').value = '';
    document.getElementById('importPreview').style.display = 'none';
}

function closeImportModal() {
    document.getElementById('importModal').classList.remove('show');
}

document.getElementById('excelFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            showImportPreview(jsonData);
        } catch (error) {
            showNotification('Errore lettura file', 'error');
        }
    };
    reader.readAsArrayBuffer(file);
});

function showImportPreview(data) {
    const previewBody = document.getElementById('importPreviewBody');
    previewBody.innerHTML = '';
    data.slice(0, 5).forEach(row => {
        previewBody.innerHTML += `<tr>
                    <td>${row.Categoria || ''}</td><td>${row.Sottocategoria || ''}</td><td>${row.Prodotto || ''}</td>
                    <td>${row.Quantità || ''}</td><td>${row.Unità || ''}</td><td>${row.Fornitore || ''}</td><td>${row['Prezzo unitario'] || ''}</td>
                </tr>`;
    });
    document.getElementById('importPreview').style.display = 'block';
}

function processExcelImport() {
    const file = document.getElementById('excelFile').files[0];
    if (!file) {
        showNotification('Seleziona un file', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            let importedCount = 0;
            jsonData.forEach(row => {
                if (row.Categoria && row.Prodotto) {
                    // Crea la categoria se non esiste
                    let category = appData.categories.find(c => c.name === row.Categoria);
                    if (!category) {
                        category = {
                            id: Date.now() + importedCount,
                            name: row.Categoria,
                            productCount: 0,
                            subcategories: row.Sottocategoria ? [row.Sottocategoria] : []
                        };
                        appData.categories.push(category);
                    } else if (row.Sottocategoria && !category.subcategories.includes(row.Sottocategoria)) {
                        category.subcategories.push(row.Sottocategoria);
                    }

                    // Crea il fornitore se non esiste
                    let supplier = appData.suppliers.find(s => s.name === row.Fornitore);
                    if (row.Fornitore && !supplier) {
                        supplier = {
                            id: Date.now() + importedCount + 1000,
                            name: row.Fornitore,
                            phone: '',
                            email: '',
                            productCount: 0
                        };
                        appData.suppliers.push(supplier);
                    }

                    let dept = 'entrambi';
                    if (row.Reparto) {
                        const r = row.Reparto.toLowerCase();
                        if (r.includes('cucina')) dept = 'cucina';
                        else if (r.includes('bar')) dept = 'bar';
                    }

                    const newProduct = {
                        id: Date.now() + importedCount,
                        name: row.Prodotto,
                        category: row.Categoria,
                        subcategory: row.Sottocategoria || '',
                        department: dept,
                        quantity: parseFloat(row.Quantità) || 0,
                        unit: row.Unità || 'pezzi',
                        price: parseFloat(row['Prezzo unitario']) || 0,
                        supplier: row.Fornitore || 'Importato',
                        status: 'in-stock'
                    };
                    appData.products.push(newProduct);
                    category.productCount++;
                    if (supplier) supplier.productCount++;
                    importedCount++;
                }
            });

            updateAllDropdowns();
            saveToCloud();
            updateAll();
            closeImportModal();
            showNotification(`${importedCount} prodotti importati!`);
        } catch (error) {
            showNotification('Errore importazione', 'error');
        }
    };
    reader.readAsArrayBuffer(file);
}


// FUNZIONI GRAFICI
let catChartInstance = null;
let stockChartInstance = null;

function renderCharts() {
    renderCategoryChart();
    renderStockChart();
}

function renderCategoryChart() {
    const ctx = document.getElementById('categoryChartCanvas');
    if (!ctx) return;

    const currency = appData.settings.currency === 'EUR' ? '€' : '$';

    // Prepare data: Value per Category
    const labels = appData.categories.map(c => c.name);
    const data = appData.categories.map(c => {
        return appData.products
            .filter(p => p.category === c.name)
            .reduce((sum, p) => sum + (p.quantity * p.price), 0);
    });

    if (catChartInstance) catChartInstance.destroy();

    Chart.register(ChartDataLabels);

    catChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Valore per Categoria',
                data: data,
                backgroundColor: [
                    '#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0',
                    '#fb8500', '#ffb703', '#8338ec', '#ff006e'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) { label += ': '; }
                            let value = context.parsed;
                            let total = context.chart._metasets[context.datasetIndex].total;
                            let percentage = (value / total * 100).toFixed(1) + '%';
                            return label + currency + ' ' + value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' (' + percentage + ')';
                        }
                    }
                },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 12 },
                    formatter: (value, ctx) => {
                        let sum = 0;
                        let dataArr = ctx.chart.data.datasets[0].data;
                        dataArr.map(data => { sum += data; });
                        let percentage = (value * 100 / sum).toFixed(1) + "%";
                        return percentage;
                    },
                    anchor: 'center',
                    align: 'center',
                    display: function (context) {
                        return context.dataset.data[context.dataIndex] > 0; // Hide 0% labels
                    }
                }
            }
        }
    });
}

function renderStockChart() {
    const ctx = document.getElementById('stockChartCanvas');
    if (!ctx) return;

    const lowStock = appData.products.filter(p => p.quantity <= appData.settings.lowStockLimit && p.quantity > 0).length;
    const outOfStock = appData.products.filter(p => p.quantity === 0).length;
    const inStock = appData.products.filter(p => p.quantity > appData.settings.lowStockLimit).length;

    if (stockChartInstance) stockChartInstance.destroy();

    stockChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['In Stock', 'Stock Basso', 'Esaurito'],
            datasets: [{
                label: 'Stato Stock',
                data: [inStock, lowStock, outOfStock],
                backgroundColor: ['#4cc9f0', '#f72585', '#e63946'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function updateAllDropdowns() {
    populateCategoryDropdown('productCategory');
    populateCategoryDropdown('modalProductCategory');
    populateCategoryDropdown('monthlyCategoryFilter');
    populateSupplierDropdown('productSupplier');
    populateSupplierDropdown('modalProductSupplier');
    populateCategoryDatalist();
}

function populateCategoryDatalist() {
    const datalist = document.getElementById('categoryList');
    if (!datalist) return;

    datalist.innerHTML = '';
    appData.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        datalist.appendChild(option);
    });
}

function exportToExcel() {
    try {
        const data = appData.products.map(product => ({
            'Prodotto': product.name,
            'Reparto': (product.department || 'entrambi').charAt(0).toUpperCase() + (product.department || 'entrambi').slice(1),
            'Categoria': product.category,
            'Sottocategoria': product.subcategory,
            'Quantità': product.quantity,
            'Unità': product.unit,
            'Fornitore': product.supplier,
            'Prezzo unitario': product.price,
            'Valore totale': (product.quantity * product.price).toFixed(2)
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Inventario");
        XLSX.writeFile(wb, "Inventario.xlsx");
        showNotification('Esportazione completata!');
    } catch (error) {
        showNotification('Errore esportazione', 'error');
    }
}

// MONTHLY INVENTORY FUNCTIONS

function setDepartmentFilter(department) {
    appData.settings.selectedDepartment = department;
    saveToCloud();

    // Update UI
    document.querySelectorAll('.department-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === `dept-btn-${department}`);
    });

    renderMonthlyInventoryTable();
}

function getDepartmentIcon(department) {
    switch (department) {
        case 'cucina': return '🍳 Cucina';
        case 'bar': return '🍹 Bar';
        default: return '🏢 Entrambi';
    }
}

function getDepartmentBadgeClass(department) {
    switch (department) {
        case 'cucina': return 'badge-cucina';
        case 'bar': return 'badge-bar';
        default: return 'badge-entrambi';
    }
}

function renderMonthlyInventoryTable() {
    const tbody = document.getElementById('monthlyInventoryTableBody');
    if (!tbody) return;

    const searchTerm = document.getElementById('monthlySearchInput')?.value.toLowerCase() || '';
    const selectedDept = appData.settings.selectedDepartment || 'tutti';
    const categoryFilterId = document.getElementById('monthlyCategoryFilter')?.value || '';

    // Trova il nome della categoria se c'è un filtro attivo
    let categoryFilterName = '';
    if (categoryFilterId) {
        const cat = appData.categories.find(c => c.id == categoryFilterId);
        if (cat) categoryFilterName = cat.name;
    }

    // Update department buttons state on load
    document.querySelectorAll('.department-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === `dept-btn-${selectedDept}`);
    });

    const filteredProducts = appData.products.filter(product => {
        // 1. Filtro Ricerca
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            (product.supplier && product.supplier.toLowerCase().includes(searchTerm));

        // 2. Filtro Reparto (Reso RIGIDO come richiesto dall'utente)
        // Se l'utente clicca Cucina, vuole VEDERE SOLO CUCINA.
        // Se l'utente clicca Tutti, vuole VEDERE SOLO ENTRAMBI.
        let productDept = product.department || 'entrambi';
        let targetDept = selectedDept === 'tutti' ? 'entrambi' : selectedDept;

        const matchesDept = productDept === targetDept;

        // 3. Filtro Categoria
        const matchesCategory = categoryFilterName === '' || product.category === categoryFilterName;

        return matchesSearch && matchesDept && matchesCategory;
    });

    // Helper functions per i badge
    const getDepartmentBadgeClass = (dept) => {
        if (dept === 'cucina') return 'badge-cucina';
        if (dept === 'bar') return 'badge-bar';
        return 'badge-neutral';
    };

    const getDepartmentIcon = (dept) => {
        if (dept === 'cucina') return '<i class="fas fa-utensils"></i> Cucina';
        if (dept === 'bar') return '<i class="fas fa-glass-martini-alt"></i> Bar';
        return '<i class="fas fa-layer-group"></i> Entrambi';
    };

    tbody.innerHTML = filteredProducts.map(p => {
        const isChanged = appData.monthlyInventoryChanges[p.id];
        const rowClass = isChanged ? 'style="background: #e6f7ff;"' : '';
        const dept = p.department || 'entrambi';

        return `
                <tr ${rowClass}>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <strong>${p.name}</strong>
                            ${isChanged ? '<i class="fas fa-check-circle" style="color: var(--success); font-size: 0.9rem;" title="Modificato"></i>' : ''}
                        </div>
                    </td>
                    <td><span class="badge ${getDepartmentBadgeClass(dept)}">${getDepartmentIcon(dept)}</span></td>
                    <td><span class="badge badge-neutral">${p.category}</span></td>
                    <td>${p.supplier || '-'}</td>
                    <td>
                        <span style="font-weight: 600; color: var(--gray);">${p.quantity} ${p.unit}</span>
                    </td>
                    <td>
                        <input type="number" 
                            id="monthly-qty-${p.id}" 
                            value="${p.quantity}" 
                            min="0" 
                            step="0.001"
                            inputmode="decimal"
                            pattern="[0-9]*"
                            onchange="updateMonthlyQuantity(${p.id}, this.value)"
                            style="width: 100px; padding: 0.8rem 0.5rem; border: 2px solid var(--primary); border-radius: 8px; text-align: center; font-weight: 600; font-size: 1.1rem;"
                        />
                    </td>
                    <td style="min-width: 60px; text-align: center;">
                        <button class="btn btn-sm btn-primary" onclick="openQuickQuantityModal(${p.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>`;
    }).join('');

    updateMonthlyStats(filteredProducts.length);
}

function updateMonthlyQuantity(productId, newQuantity) {
    const qty = parseFloat(newQuantity);
    if (isNaN(qty) || qty < 0) {
        showNotification('Quantità non valida', 'error');
        renderMonthlyInventoryTable();
        return;
    }

    const productIndex = appData.products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;

    appData.products[productIndex].quantity = qty;
    appData.products[productIndex].status =
        qty === 0 ? 'out-of-stock' :
            qty <= appData.settings.lowStockLimit ? 'low-stock' : 'in-stock';

    // Mark as changed
    appData.monthlyInventoryChanges[productId] = true;

    saveToCloud();
    updateAll();
    renderMonthlyInventoryTable();
}

function incrementQuantity(productId, amount) {
    const product = appData.products.find(p => p.id === productId);
    if (!product) return;

    const newQty = Math.max(0, product.quantity + amount);
    updateMonthlyQuantity(productId, newQty);
}

function filterMonthlyInventory() {
    renderMonthlyInventoryTable();
}

function updateMonthlyStats(totalFiltered = null) {
    // Count changes only for filtered products if totalFiltered is provided
    // Otherwise use total changes
    const countedProducts = Object.keys(appData.monthlyInventoryChanges).filter(id => {
        // Determine if this changed product is currently visible (matches filter)
        // This is an approximation since we don't have the filtered list here without passing it
        // Ideally, we pass the filtered list length.
        return true;
    }).length;

    // To be more precise, let's just count how many of the currently filtered products are changed
    // But for now, let's stick to total verified count vs total filtered list

    const totalProducts = totalFiltered !== null ? totalFiltered : appData.products.length;

    // Recalculate counted for the current view
    // We need to know which products are in the view to count them accurately as "verified in this view"
    // But simpler is: "Verified (Total)" and "Remaining (Total)"
    // OR "Verified (View)" and "Remaining (View)"

    // Let's go with View based statistics since we are filtering
    let viewCounted = 0;
    if (totalFiltered !== null) {
        // We need to re-filter to check which ones are changed
        // This is expensive to do again. 
        // Let's assume passed totalFiltered is the denominator.
        // The numerator should be how many of THESE products present in table are changed.
        // Since we don't have the list, let's look at the DOM or re-filter.
        // Let's re-filter for stats correctness.
        const searchTerm = document.getElementById('monthlySearchInput')?.value.toLowerCase() || '';
        const selectedDept = appData.settings.selectedDepartment || 'tutti';

        const currentViewProducts = appData.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm) ||
                (product.supplier && product.supplier.toLowerCase().includes(searchTerm));

            const productDept = product.department || 'entrambi';
            const matchesDept = selectedDept === 'tutti' ||
                productDept === 'entrambi' ||
                productDept === selectedDept;

            return matchesSearch && matchesDept;
        });

        viewCounted = currentViewProducts.filter(p => appData.monthlyInventoryChanges[p.id]).length;
        document.getElementById('monthlyCountedProducts').textContent = viewCounted;
        document.getElementById('monthlyRemainingProducts').textContent = totalFiltered - viewCounted;

    } else {
        const counted = Object.keys(appData.monthlyInventoryChanges).length;
        const total = appData.products.length;
        document.getElementById('monthlyCountedProducts').textContent = counted;
        document.getElementById('monthlyRemainingProducts').textContent = total - counted;
    }

    // Update last snapshot date
    if (appData.monthlySnapshots && appData.monthlySnapshots.length > 0) {
        const lastSnapshot = appData.monthlySnapshots[appData.monthlySnapshots.length - 1];
        const date = new Date(lastSnapshot.date);
        document.getElementById('lastSnapshotDate').textContent = date.toLocaleDateString('it-IT');
    } else {
        document.getElementById('lastSnapshotDate').textContent = 'Mai';
    }
}

function createMonthlySnapshot() {
    const now = new Date();
    const snapshot = {
        id: Date.now(),
        date: now.toISOString(),
        products: appData.products.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            subcategory: p.subcategory,
            quantity: p.quantity,
            unit: p.unit,
            price: p.price,
            supplier: p.supplier
        })),
        totalValue: appData.products.reduce((sum, p) => sum + (p.quantity * p.price), 0),
        totalProducts: appData.products.length
    };

    if (!appData.monthlySnapshots) {
        appData.monthlySnapshots = [];
    }

    appData.monthlySnapshots.push(snapshot);
    saveToCloud();

    showNotification(`Snapshot salvato: ${now.toLocaleDateString('it-IT')} ${now.toLocaleTimeString('it-IT')}`, 'success');
    updateMonthlyStats();
}

function exportMonthlyToExcel() {
    try {
        const now = new Date();
        const dateStr = now.toLocaleDateString('it-IT').replace(/\//g, '-');

        const data = appData.products.map(product => ({
            'Data Inventario': dateStr,
            'Prodotto': product.name,
            'Reparto': (product.department || 'entrambi').charAt(0).toUpperCase() + (product.department || 'entrambi').slice(1),
            'Categoria': product.category,
            'Sottocategoria': product.subcategory,
            'Quantità': product.quantity,
            'Unità': product.unit,
            'Fornitore': product.supplier,
            'Prezzo Unitario': product.price,
            'Valore Totale': (product.quantity * product.price).toFixed(2)
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Inventario ${dateStr}`);
        XLSX.writeFile(wb, `Inventario_Mensile_${dateStr}.xlsx`);

        showNotification('Inventario mensile esportato!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Errore durante l\'esportazione', 'error');
    }
}

// Snapshots Modal Functions
function showSnapshotsModal() {
    renderSnapshotsList();
    document.getElementById('snapshotsModal').classList.add('show');
}

function closeSnapshotsModal() {
    document.getElementById('snapshotsModal').classList.remove('show');
}

function renderSnapshotsList() {
    const container = document.getElementById('snapshotsListContainer');
    if (!container) return;

    if (!appData.monthlySnapshots || appData.monthlySnapshots.length === 0) {
        container.innerHTML = `
                    <p style="text-align: center; color: var(--gray); padding: 2rem;">
                        <i class="fas fa-inbox" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 1rem;"></i>
                        Nessuno snapshot salvato
                    </p>`;
        return;
    }

    const currency = appData.settings.currency === 'EUR' ? '€' : '$';
    container.innerHTML = appData.monthlySnapshots.slice().reverse().map(snapshot => {
        const date = new Date(snapshot.date);
        return `
                    <div class="card" style="margin-bottom: 1rem; padding: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin: 0 0 0.5rem 0; color: var(--primary);">
                                    <i class="fas fa-calendar-alt"></i>
                                    ${date.toLocaleDateString('it-IT')} - ${date.toLocaleTimeString('it-IT')}
                                </h4>
                                <p style="margin: 0; color: var(--gray); font-size: 0.9rem;">
                                    ${snapshot.totalProducts} prodotti • Valore: ${currency} ${snapshot.totalValue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-sm btn-outline" onclick="exportSnapshot(${snapshot.id})">
                                    <i class="fas fa-download"></i> Esporta
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteSnapshot(${snapshot.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>`;
    }).join('');
}

function exportSnapshot(snapshotId) {
    const snapshot = appData.monthlySnapshots.find(s => s.id === snapshotId);
    if (!snapshot) return;

    try {
        const date = new Date(snapshot.date);
        const dateStr = date.toLocaleDateString('it-IT').replace(/\//g, '-');

        const data = snapshot.products.map(product => ({
            'Data Snapshot': dateStr,
            'Prodotto': product.name,
            'Reparto': (product.department || 'entrambi').charAt(0).toUpperCase() + (product.department || 'entrambi').slice(1),
            'Categoria': product.category,
            'Sottocategoria': product.subcategory,
            'Quantità': product.quantity,
            'Unità': product.unit,
            'Fornitore': product.supplier,
            'Prezzo Unitario': product.price,
            'Valore Totale': (product.quantity * product.price).toFixed(2)
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Snapshot ${dateStr}`);
        XLSX.writeFile(wb, `Snapshot_${dateStr}.xlsx`);

        showNotification('Snapshot esportato!', 'success');
    } catch (error) {
        showNotification('Errore durante l\'esportazione', 'error');
    }
}

function deleteSnapshot(snapshotId) {
    if (!confirm('Eliminare questo snapshot?')) return;

    const index = appData.monthlySnapshots.findIndex(s => s.id === snapshotId);
    if (index !== -1) {
        appData.monthlySnapshots.splice(index, 1);
        saveToCloud();
        renderSnapshotsList();
        updateMonthlyStats();
        showNotification('Snapshot eliminato', 'success');
    }
}

// Reset Quantities Modal Functions
function showResetQuantitiesModal() {
    document.getElementById('confirmResetCheckbox').checked = false;
    document.getElementById('confirmResetBtn').disabled = true;
    document.getElementById('resetQuantitiesModal').classList.add('show');
}

function closeResetQuantitiesModal() {
    document.getElementById('resetQuantitiesModal').classList.remove('show');
}

// Enable/disable reset button based on checkbox
document.addEventListener('DOMContentLoaded', function () {
    const checkbox = document.getElementById('confirmResetCheckbox');
    const btn = document.getElementById('confirmResetBtn');
    if (checkbox && btn) {
        checkbox.addEventListener('change', function () {
            btn.disabled = !this.checked;
        });
    }
});

function confirmResetQuantities() {
    // Create automatic snapshot before reset
    createMonthlySnapshot();

    // Reset all quantities to 0
    appData.products.forEach(product => {
        product.quantity = 0;
        product.status = 'out-of-stock';
    });

    // Clear monthly changes tracking
    appData.monthlyInventoryChanges = {};

    saveToCloud();
    updateAll();
    renderMonthlyInventoryTable();
    closeResetQuantitiesModal();

    showNotification('Quantità azzerate! Snapshot salvato automaticamente.', 'success');
}

// UTILITY
// UTILITIES & PERFORMANCE
let searchTimeout;
function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const filteredProducts = appData.products.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            product.subcategory.toLowerCase().includes(searchTerm)
        );

        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;

        tbody.innerHTML = filteredProducts.slice(0, 10).map(p => createProductRow(p)).join('');

        // If on products tab, also filter the main table
        const allTbody = document.getElementById('allProductsTableBody');
        if (allTbody && document.getElementById('products-tab').classList.contains('active')) {
            allTbody.innerHTML = filteredProducts.map(p => {
                const currency = appData.settings.currency === 'EUR' ? '€' : '$';
                return `
                        <tr class="fade-in">
                            <td class="product-cell">
                                <span class="product-name" style="font-weight: 600; color: var(--dark);">${p.name}</span>
                            </td>
                            <td><span class="product-meta">${p.supplier || 'Nessun fornitore'}</span></td>
                            <td><span class="badge badge-category">${p.category}</span></td>
                            <td><span class="subcategory-text">${p.subcategory || '-'}</span></td>
                            <td class="quantity-cell">
                                <span class="quantity-value">${p.quantity}</span>
                                <span class="quantity-unit">${p.unit}</span>
                            </td>
                            <td class="price-cell">${currency} ${p.price.toFixed(2)}</td>
                            <td>
                                <div class="table-actions">
                                    <button class="action-btn edit" onclick="editProduct(${p.id})" title="Modifica"><i class="fas fa-edit"></i></button>
                                    <button class="action-btn delete" onclick="deleteProduct(${p.id})" title="Elimina"><i class="fas fa-trash-alt"></i></button>
                                </div>
                            </td>
                        </tr>`;
            }).join('');
        }
    }, 300);
}

function refreshData() {
    updateAll();
    showNotification('Sincronizzazione completata!', 'success');
}

function updateAll() {
    updateStatistics();
    renderRecentProducts();
    renderAllProductsTable();
    renderCategoriesTable();
    renderSuppliersTable();
    updateAllDropdowns();
    renderMonthlyInventoryTable(); // Update monthly inventory table
    saveToCloud(); // Auto-save to localStorage
}

let isInitialLoad = true;

function saveToCloud() {
    if (isInitialLoad) return; // Non salvare nel cloud se stiamo solo inizializzando i dati

    localStorage.setItem('inventarioData', JSON.stringify(appData));

    // Auto-Sync to Cloud
    if (appData.settings.autoSync && appData.settings.supabaseUrl) {
        debounceAutoSync();
    }
}

let autoSyncTimeout;
function debounceAutoSync() {
    updateCloudStatus('syncing', 'In coda...');
    clearTimeout(autoSyncTimeout);
    autoSyncTimeout = setTimeout(() => {
        syncToCloud(true); // true per modalità silenziosa
    }, 3000); // Aspetta 3 secondi di inattività
}

function updateCloudStatus(status, message) {
    const statusEl = document.getElementById('cloudStatus');
    const textEl = document.getElementById('cloudStatusText');
    if (!statusEl || !textEl) return;

    statusEl.className = 'sync-status ' + status;
    textEl.textContent = message || (status === 'online' ? 'Sincronizzato' : status === 'offline' ? 'Locale' : 'In corso...');

    const icon = statusEl.querySelector('i');
    if (status === 'syncing') {
        icon.className = 'fas fa-sync fa-spin';
    } else if (status === 'error') {
        icon.className = 'fas fa-exclamation-triangle';
    } else {
        icon.className = 'fas fa-cloud';
    }
}
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const title = document.getElementById('notificationTitle');
    const msg = document.getElementById('notificationMessage');
    title.textContent = type === 'success' ? 'Successo' : type === 'error' ? 'Errore' : 'Avviso';
    msg.textContent = message;
    notification.className = 'notification ' + type;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}


// SUPABASE INTEGRATION
async function syncToCloud(silent = false) {
    // Forza aggiornamento URL
    const urlInput = document.getElementById('supabaseUrl');
    const keyInput = document.getElementById('supabaseKey');
    if (urlInput && urlInput.value) {
        appData.settings.supabaseUrl = urlInput.value.trim();
        if (keyInput) appData.settings.supabaseKey = keyInput.value.trim();
        localStorage.setItem('inventarioData', JSON.stringify(appData));
    }

    const sbUrl = appData.settings.supabaseUrl;
    const sbKey = appData.settings.supabaseKey;

    if (!sbUrl || !sbKey || !sbUrl.includes('.supabase.co')) {
        if (!silent) {
            showNotification('Credenziali Supabase mancanti o non valide. Controlla le Impostazioni.', 'error');
            updateCloudStatus('error', 'Credenziali mancanti');
        }
        return;
    }

    if (!silent) {
        showNotification('Invio dati al Cloud in corso...', 'warning');
    }
    updateCloudStatus('syncing', 'Sincronizzazione...');

    try {
        const fetchUrl = `${sbUrl}/rest/v1/inventario_secure_v1_9x8b7c?id=eq.1`;
        const response = await fetch(fetchUrl, {
            method: 'PATCH',
            headers: {
                'apikey': sbKey,
                'Authorization': `Bearer ${sbKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ data: appData })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errText.substring(0, 50)}`);
        }

        if (!silent) showNotification('Dati salvati sul Cloud!', 'success');
        updateCloudStatus('online', 'Sincronizzato');

    } catch (e) {
        console.error('Supabase Sync Error:', e);
        if (!silent) showNotification('Errore di invio: ' + e.message, 'error');
        updateCloudStatus('error', 'Errore sync');
    }
}

async function restoreFromCloud(silent = false) {
    const sbUrl = appData.settings.supabaseUrl;
    const sbKey = appData.settings.supabaseKey;

    if (!sbUrl || !sbKey) {
        if (!silent) {
            showNotification('Inserisci URL e Chiave Supabase nelle impostazioni', 'error');
            updateCloudStatus('error', 'Credenziali mancanti');
        }
        return;
    }

    if (!silent && !confirm('Questo sovrascriverà i dati locali con quelli presenti nel Cloud Supabase. Continuare?')) return;

    if (!silent) {
        showNotification('Scaricamento dati...', 'warning');
    }
    updateCloudStatus('syncing', 'Caricamento...');

    try {
        const fetchUrl = `${sbUrl}/rest/v1/inventario_secure_v1_9x8b7c?id=eq.1&select=data`;
        const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
                'apikey': sbKey,
                'Authorization': `Bearer ${sbKey}`
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errText.substring(0, 50)}`);
        }

        const rows = await response.json();

        if (rows && rows.length > 0 && rows[0].data && rows[0].data.products) {
            appData = rows[0].data;
            if (appData.settings.autoSync === undefined) appData.settings.autoSync = true;
            localStorage.setItem('inventarioData', JSON.stringify(appData));
            updateAll();
            loadSettingsTab();
            if (!silent) showNotification('Dati ripristinati dal Cloud con successo!', 'success');
            updateCloudStatus('online', 'Sincronizzato');
        } else {
            if (!silent) showNotification('Il database Supabase sembra vuoto o non configurato.', 'error');
            updateCloudStatus('error', 'Dati non validi');
        }

    } catch (e) {
        console.error('Supabase Fetch Error:', e);
        if (!silent) showNotification('Errore di connessione a Supabase: ' + e.message, 'error');
        updateCloudStatus('error', 'Errore Rete');
    }
}

// INIZIALIZZAZIONE
document.addEventListener('DOMContentLoaded', function () {
    const savedData = localStorage.getItem('inventarioData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            appData.products = parsedData.products || appData.products;
            appData.categories = parsedData.categories || appData.categories;
            appData.suppliers = parsedData.suppliers || appData.suppliers;
            appData.settings = parsedData.settings || appData.settings;

            // Abilita auto-sync di default se non impostato
            if (appData.settings.autoSync === undefined) {
                appData.settings.autoSync = true;
            }
        } catch (e) {
            console.error('Errore nel caricamento dei dati salvati:', e);
        }
    }
    loadDashboardData();
    showNotification('Sistema caricato!');

    // Auto-restore dal Cloud all'avvio (se configurato)
    if (appData.settings.supabaseUrl && appData.settings.supabaseKey && appData.settings.autoSync) {
        setTimeout(() => {
            restoreFromCloud(true).finally(() => {
                isInitialLoad = false; // Ora l'app può salvare modifiche vere
            });
        }, 1500);
    } else {
        setTimeout(() => { isInitialLoad = false; }, 2000);
    }

    // Registrazione Service Worker per PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('Service Worker registrato!'))
                .catch(err => console.log('Errore Service Worker:', err));
        });
    }
});

// EXCEL IMPORT FUNCTIONS
function showImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.classList.add('show');
        // Reset file input
        const fileInput = document.getElementById('excelFile');
        if (fileInput) fileInput.value = '';
        // Hide preview
        const preview = document.getElementById('importPreview');
        if (preview) preview.style.display = 'none';
    }
}

function closeImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) modal.classList.remove('show');
}

// Handle Excel file selection and preview
document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('excelFile');
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                    // Show preview
                    displayImportPreview(jsonData);
                } catch (error) {
                    showNotification('Errore nella lettura del file Excel: ' + error.message, 'error');
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }
});

function displayImportPreview(data) {
    const preview = document.getElementById('importPreview');
    const tbody = document.getElementById('importPreviewBody');

    if (!preview || !tbody) return;

    tbody.innerHTML = '';

    // Show first 10 rows as preview
    const previewData = data.slice(0, 10);
    previewData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
                    <td>${row.Categoria || ''}</td>
                    <td>${row.Sottocategoria || ''}</td>
                    <td>${row.Prodotto || ''}</td>
                    <td>${row.Quantità || row.Quantita || 0}</td>
                    <td>${row.Unità || row.Unita || ''}</td>
                    <td>${row.Fornitore || ''}</td>
                    <td>${row.Prezzo || 0}</td>
                    <td>${row.Reparto || 'entrambi'}</td>
                `;
        tbody.appendChild(tr);
    });

    preview.style.display = 'block';
}

function processExcelImport() {
    const fileInput = document.getElementById('excelFile');
    if (!fileInput || !fileInput.files[0]) {
        showNotification('Seleziona un file Excel prima di importare', 'error');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            let importedCount = 0;
            let errorCount = 0;

            jsonData.forEach(row => {
                try {
                    // Validate required fields
                    if (!row.Prodotto || !row.Categoria || !row.Sottocategoria) {
                        errorCount++;
                        return;
                    }

                    // Get or create category
                    let category = appData.categories.find(c => c.name === row.Categoria);
                    if (!category) {
                        const newCategoryId = appData.categories.length > 0
                            ? Math.max(...appData.categories.map(c => c.id)) + 1
                            : 1;
                        category = {
                            id: newCategoryId,
                            name: row.Categoria,
                            subcategories: [],
                            productCount: 0
                        };
                        appData.categories.push(category);
                    }

                    // Add subcategory if not exists
                    if (row.Sottocategoria && !category.subcategories.includes(row.Sottocategoria)) {
                        category.subcategories.push(row.Sottocategoria);
                    }

                    // Get or create supplier
                    let supplier = null;
                    if (row.Fornitore) {
                        supplier = appData.suppliers.find(s => s.name === row.Fornitore);
                        if (!supplier) {
                            const newSupplierId = appData.suppliers.length > 0
                                ? Math.max(...appData.suppliers.map(s => s.id)) + 1
                                : 1;
                            supplier = {
                                id: newSupplierId,
                                name: row.Fornitore,
                                phone: '',
                                email: '',
                                productCount: 0
                            };
                            appData.suppliers.push(supplier);
                        }
                    }

                    // Create product
                    const newProductId = appData.products.length > 0
                        ? Math.max(...appData.products.map(p => p.id)) + 1
                        : 1;

                    const quantity = parseFloat(row.Quantità || row.Quantita || 0);
                    const price = parseFloat(row.Prezzo || 0);
                    const unit = (row.Unità || row.Unita || 'pezzi').toLowerCase();
                    const department = (row.Reparto || 'entrambi').toLowerCase();

                    const newProduct = {
                        id: newProductId,
                        name: row.Prodotto,
                        category: row.Categoria,
                        subcategory: row.Sottocategoria,
                        quantity: quantity,
                        unit: unit,
                        price: price,
                        supplier: row.Fornitore || '',
                        department: department,
                        status: quantity > 5 ? 'in-stock' : quantity > 0 ? 'low-stock' : 'out-of-stock'
                    };

                    appData.products.push(newProduct);
                    category.productCount++;
                    if (supplier) supplier.productCount++;
                    importedCount++;

                } catch (error) {
                    console.error('Error importing row:', error);
                    errorCount++;
                }
            });

            // Save and update
            saveData();
            updateAll();
            closeImportModal();

            // Show result
            if (importedCount > 0) {
                showNotification(`Importati ${importedCount} prodotti con successo!${errorCount > 0 ? ` (${errorCount} errori)` : ''}`, 'success');
            } else {
                showNotification('Nessun prodotto importato. Verifica il formato del file.', 'error');
            }

        } catch (error) {
            showNotification('Errore durante l\'importazione: ' + error.message, 'error');
            console.error('Import error:', error);
        }
    };

    reader.readAsArrayBuffer(file);
}