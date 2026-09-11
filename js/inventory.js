/**
 * XTREM MOBILE - Inventory Module
 * Maneja el CRUD de productos y filtros
 * Roles: 
 *   - Inventario: Solo ver, copiar, PDF y ajustar stock (+/-)
 *   - Vendedor: Editar todo (agregar, editar, eliminar)
 *   - Administrador: Editar todo
 */

const Inventory = {
    currentPage: 1,
    pageSize: 10,
    filteredProducts: [],

    init() {
        this.loadCategories();
        this.setupEventListeners();
        this.applyRolePermissions();
        this.renderTable();
    },

    applyRolePermissions() {
        const addBtn = document.getElementById('addProductBtn');
        const canEditInventory = Auth.can('editInventory');

        // Usuarios sin el permiso "editInventory" no pueden agregar productos
        addBtn.style.display = canEditInventory ? '' : 'none';

        // Mostrar/ocultar la columna de Costo según el permiso "viewCost"
        const canViewCost = Auth.can('viewCost');
        document.querySelectorAll('.cost-col').forEach(el => el.classList.toggle('d-none', !canViewCost));
        const costWrapper = document.getElementById('productCostWrapper');
        if (costWrapper) costWrapper.classList.toggle('d-none', !canViewCost);
    },

    loadCategories() {
        const select = document.getElementById('filterCategory');
        const categories = DataStore.getCategories();
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });
    },

    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', () => this.applyFilters());
        document.getElementById('filterCategory').addEventListener('change', () => this.applyFilters());
        document.getElementById('filterStatus').addEventListener('change', () => this.applyFilters());
        document.getElementById('filterDateFrom').addEventListener('change', () => this.applyFilters());
        document.getElementById('filterDateTo').addEventListener('change', () => this.applyFilters());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());

        document.getElementById('addProductBtn').addEventListener('click', () => this.openAddModal());
        document.getElementById('saveProductBtn').addEventListener('click', () => this.saveProduct());

        // Stock modal events
        document.getElementById('stockDecrementBtn').addEventListener('click', () => {
            const input = document.getElementById('stockQuantity');
            const val = parseInt(input.value) || 1;
            if (val > 0) input.value = val - 1;
        });
        document.getElementById('stockIncrementBtn').addEventListener('click', () => {
            const input = document.getElementById('stockQuantity');
            const val = parseInt(input.value) || 1;
            input.value = val + 1;
        });
        document.getElementById('stockRemoveBtn').addEventListener('click', () => this.adjustStock(-1));
        document.getElementById('stockAddBtn').addEventListener('click', () => this.adjustStock(1));
    },

    applyFilters() {
        this.currentPage = 1;
        this.renderTable();
    },

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('filterCategory').value = 'all';
        document.getElementById('filterStatus').value = 'all';
        document.getElementById('filterDateFrom').value = '';
        document.getElementById('filterDateTo').value = '';
        this.applyFilters();
    },

    getFilteredProducts() {
        const products = DataStore.getProducts();
        const search = document.getElementById('searchInput').value.toLowerCase().trim();
        const category = document.getElementById('filterCategory').value;
        const status = document.getElementById('filterStatus').value;
        const dateFrom = document.getElementById('filterDateFrom').value;
        const dateTo = document.getElementById('filterDateTo').value;

        return products.filter(p => {
            if (p.category === 'ACCESORIOS') return false;

            if (search) {
                const matchSearch =
                    (p.model && p.model.toLowerCase().includes(search)) ||
                    (p.color && p.color.toLowerCase().includes(search)) ||
                    (p.category && p.category.toLowerCase().includes(search));
                if (!matchSearch) return false;
            }

            if (category !== 'all' && p.category !== category) return false;

            if (status !== 'all' && p.status !== status) return false;

            if (dateFrom && p.entryDate && p.entryDate < dateFrom) return false;
            if (dateTo && p.entryDate && p.entryDate > dateTo) return false;

            return true;
        });
    },

    renderTable() {
        this.filteredProducts = this.getFilteredProducts();
        const tbody = document.getElementById('inventoryBody');
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const pageProducts = this.filteredProducts.slice(startIndex, startIndex + this.pageSize);

        const canEditInventory = Auth.can('editInventory');
        const canViewCost = Auth.can('viewCost');

        if (pageProducts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="13" class="text-center text-muted py-5">
                <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                ${this.filteredProducts.length === 0 ? 'No hay productos registrados' : 'No se encontraron resultados'}
            </td></tr>`;
        } else {
            tbody.innerHTML = pageProducts.map((p, idx) => {
                // Usuarios sin permiso de edición: solo pueden ajustar stock (+/-)
                // Usuarios con permiso de edición: pueden editar y eliminar
                let actionsHtml = '';
                if (!canEditInventory) {
                    actionsHtml = `
                        <button class="action-btn bg-success bg-opacity-10 text-success" onclick="Inventory.openStockModal('${p.id}')" title="Ajustar Stock">
                            <i class="bi bi-box-seam"></i>
                        </button>
                    `;
                } else {
                    actionsHtml = `
                        <div class="d-flex gap-1">
                            <button class="action-btn action-btn-edit" onclick="Inventory.openEditModal('${p.id}')" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="action-btn action-btn-delete" onclick="Inventory.confirmDelete('${p.id}')" title="Eliminar">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    `;
                }

                const costCell = `<td class="cost-col ${canViewCost ? '' : 'd-none'}">${parseFloat(p.cost) > 0 ? 'Q' + parseFloat(p.cost).toFixed(2) : '-'}</td>`;

                return `
                <tr>
                    <td class="fw-bold">${startIndex + idx + 1}</td>
                    <td><span class="fw-semibold">${this.escapeHtml(p.model)}</span></td>
                    <td><span class="badge bg-danger bg-opacity-10 text-danger">${this.escapeHtml(p.category)}</span></td>
                    <td>${parseFloat(p.imei) > 0 ? 'Q' + parseFloat(p.imei).toFixed(2) : '-'}</td>
                    <td>${this.escapeHtml(p.color || '-')}</td>
                    <td>${p.storage || '-'}</td>
                    <td class="fw-semibold">${parseFloat(p.price) > 0 ? 'Q' + parseFloat(p.price).toFixed(2) : '<span class="text-success">Gratis</span>'}</td>
                    ${costCell}
<td><span class="badge ${this.getStockColor(p.stock, p.minStock)}">${parseInt(p.stock)}</span></td>
                    <td><span class="badge bg-secondary">${parseInt(p.minStock || 0)}</span></td>
                    <td>${this.getStatusBadge(p.status)}</td>
                    <td><small class="text-muted">${p.entryDate || '-'}</small></td>
                    <td>${actionsHtml}</td>
                </tr>
            `}).join('');
        }

        // Update count
        document.getElementById('productCount').textContent = `${this.filteredProducts.length} productos`;

        // Update pagination
        this.renderPagination();
    },

    renderPagination() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.pageSize) || 1;
        const pagination = document.getElementById('pagination');

        if (totalPages <= 1) {
            pagination.innerHTML = `
                <li class="page-item disabled"><a class="page-link" href="#">«</a></li>
                <li class="page-item active"><a class="page-link" href="#">1</a></li>
                <li class="page-item disabled"><a class="page-link" href="#">»</a></li>
            `;
            return;
        }

        let html = '';
        
        // Previous
        html += `<li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="Inventory.goToPage(${this.currentPage - 1})">«</a>
        </li>`;

        // Pages
        for (let i = 1; i <= totalPages; i++) {
            html += `<li class="page-item ${i === this.currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="Inventory.goToPage(${i})">${i}</a>
            </li>`;
        }

        // Next
        html += `<li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="Inventory.goToPage(${this.currentPage + 1})">»</a>
        </li>`;

        pagination.innerHTML = html;
    },

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredProducts.length / this.pageSize) || 1;
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderTable();
        }
    },

    openAddModal() {
        document.getElementById('productModalTitle').innerHTML = '<i class="bi bi-plus-circle me-2"></i>Agregar Producto';
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        document.getElementById('productDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('productCostWrapper').classList.toggle('d-none', !Auth.can('viewCost'));

        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();
    },

    openEditModal(id) {
        const product = DataStore.getProductById(id);
        if (!product) return;

        document.getElementById('productModalTitle').innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Producto';
        document.getElementById('productId').value = product.id;
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productModel').value = product.model || '';
        document.getElementById('productImei').value = product.imei || '';
        document.getElementById('productColor').value = product.color || '';
        document.getElementById('productStorage').value = product.storage || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productCost').value = product.cost || '';
        document.getElementById('productStock').value = product.stock || '';
        document.getElementById('productMinStock').value = product.minStock || '';
        document.getElementById('productStatus').value = product.status || 'Nuevo';
        document.getElementById('productDate').value = product.entryDate || '';
        document.getElementById('productCostWrapper').classList.toggle('d-none', !Auth.can('viewCost'));

        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();
    },

    async saveProduct() {
        const id = document.getElementById('productId').value;
        const priceVal = parseFloat(document.getElementById('productPrice').value);
        const costVal = parseFloat(document.getElementById('productCost').value);
        const ivuVal = parseFloat(document.getElementById('productImei').value);
        const stockVal = parseInt(document.getElementById('productStock').value);
        const minStockVal = parseInt(document.getElementById('productMinStock').value);

        const data = {
            category: document.getElementById('productCategory').value,
            model: document.getElementById('productModel').value.trim(),
            // Campo interno "imei"; en la interfaz se muestra como "IVU" (monto en Q que paga el cliente por el equipo)
            imei: isNaN(ivuVal) || ivuVal < 0 ? 0 : ivuVal,
            color: document.getElementById('productColor').value.trim(),
            storage: document.getElementById('productStorage').value,
            price: isNaN(priceVal) ? 0 : priceVal,
            stock: isNaN(stockVal) || stockVal < 0 ? 0 : stockVal,
            minStock: isNaN(minStockVal) || minStockVal < 0 ? 0 : minStockVal,
            status: document.getElementById('productStatus').value,
            entryDate: document.getElementById('productDate').value
        };

        if (Auth.can('viewCost')) {
            data.cost = isNaN(costVal) || costVal < 0 ? 0 : costVal;
        }

        if (!data.category) {
            App.showToast('Por favor seleccione una Categoría', 'error');
            document.getElementById('productCategory').focus();
            return;
        }
        if (!data.model) {
            App.showToast('Por favor ingrese el Modelo del dispositivo', 'error');
            document.getElementById('productModel').focus();
            return;
        }
        if (data.price < 0) {
            App.showToast('Por favor ingrese un Precio válido (0 o más)', 'error');
            document.getElementById('productPrice').focus();
            return;
        }

        try {
            if (id) {
                await DataStore.updateProduct(id, data);
                await App.logHistory('Edición de producto', `Se editó el producto "${data.model}" (categoría: ${data.category}, precio: Q${data.price}, stock: ${data.stock})`);
                App.showToast('Producto actualizado exitosamente', 'success');
            } else {
                await DataStore.addProduct(data);
                await App.logHistory('Nuevo producto', `Se agregó el producto "${data.model}" (categoría: ${data.category}, precio: Q${data.price}, stock: ${data.stock})`);
                App.showToast('Producto agregado exitosamente', 'success');
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
            if (modal) modal.hide();
            this.renderTable();
            Dashboard.update();
            if (typeof Purchases !== 'undefined') Purchases.scan();
        } catch (e) {
            console.error('Error al guardar producto:', e);
            App.showToast('Error al guardar el producto. Intente de nuevo.', 'error');
        }
    },

    confirmDelete(id) {
        const product = DataStore.getProductById(id);
        document.getElementById('deleteModalMessage').textContent = 
            `¿Estás seguro de eliminar "${product.model}"? Esta acción no se puede deshacer.`;
        document.getElementById('confirmDeleteBtn').onclick = () => this.deleteProduct(id);
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    },

    async deleteProduct(id) {
        const product = DataStore.getProductById(id);
        await DataStore.deleteProduct(id);
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal.hide();
        await App.logHistory('Eliminación de producto', `Se eliminó el producto "${product.model}" (IVU: Q${(parseFloat(product.imei) || 0).toFixed(2)})`);
        App.showToast('Producto eliminado exitosamente', 'success');
        this.renderTable();
        Dashboard.update();
        if (typeof Purchases !== 'undefined') Purchases.scan();
    },

    // ===== STOCK ADJUSTMENT =====
    openStockModal(id) {
        const product = DataStore.getProductById(id);
        if (!product) return;

        document.getElementById('stockProductId').value = id;
        document.getElementById('stockProductName').textContent = product.model;
        document.getElementById('stockCurrentValue').textContent = parseInt(product.stock) || 0;
        document.getElementById('stockMinValue').textContent = parseInt(product.minStock || 0);
        document.getElementById('stockQuantity').value = 1;
        document.getElementById('stockError').classList.add('d-none');

        const modal = new bootstrap.Modal(document.getElementById('stockModal'));
        modal.show();
    },

    async adjustStock(direction) {
        const id = document.getElementById('stockProductId').value;
        const quantity = parseInt(document.getElementById('stockQuantity').value) || 1;
        const errorEl = document.getElementById('stockError');
        
        const product = DataStore.getProductById(id);
        if (!product) return;

        let currentStock = parseInt(product.stock) || 0;
        
        if (direction === -1) {
            if (quantity > currentStock) {
                errorEl.textContent = 'No puedes quitar más stock del disponible. Stock actual: ' + currentStock;
                errorEl.classList.remove('d-none');
                return;
            }
            currentStock -= quantity;
        } else {
            currentStock += quantity;
        }

        errorEl.classList.add('d-none');
        await DataStore.updateProduct(id, { stock: currentStock });

        document.getElementById('stockCurrentValue').textContent = currentStock;

        this.renderTable();
        Dashboard.update();
        if (typeof Purchases !== 'undefined') Purchases.scan();

        const action = direction === -1 ? 'quitado' : 'agregado';
        await App.logHistory('Ajuste de stock', `Se ${action} ${quantity} unidad(es) de "${product.model}". Stock actual: ${currentStock}`);
        App.showToast(`Stock ${action}: ${quantity} unidad(es). Stock actual: ${currentStock}`, 'success');
    },

getStatusBadge(status) {
        const classes = {
            'Nuevo': 'badge-nuevo',
            'Seminuevo': 'badge-seminuevo',
            'Usado': 'badge-usado'
        };
        const cls = classes[status] || 'bg-secondary';
        return `<span class="badge badge-status ${cls}">${status || '-'}</span>`;
    },

    // Determina el color del badge de stock según el nivel respecto al mínimo
    getStockColor(stock, minStock) {
        const s = parseInt(stock) || 0;
        const m = parseInt(minStock) || 0;
        if (s <= 0) return 'bg-danger';                               // Sin stock
        if (m <= 0) return 'bg-success';                             // Sin mínimo definido -> OK
        if (s <= m) return 'bg-danger';                              // Por debajo/igual al mínimo (Stock Bajo)
        if (s <= m * 1.5) return 'badge-stock-medium';               // Cerca de llegar a Stock Bajo -> Naranja
        return 'bg-success';                                         // Stock suficiente
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // ===== ACCESORIOS =====
    setupAccesories() {
        document.getElementById('addAccBtn').addEventListener('click', () => this.openAccesoryModal());
        document.getElementById('saveAccBtn').addEventListener('click', () => this.saveAccesory());
        document.getElementById('searchAccInput').addEventListener('input', () => this.renderAccesoriesTable());
        document.getElementById('filterAccCategory').addEventListener('change', () => this.renderAccesoriesTable());
        document.getElementById('filterAccDateFrom').addEventListener('change', () => this.renderAccesoriesTable());
        document.getElementById('filterAccDateTo').addEventListener('change', () => this.renderAccesoriesTable());
        document.getElementById('exportAccPdfBtn').addEventListener('click', () => Export.exportAccesoriesPdf());
        document.getElementById('copyAccTextBtn').addEventListener('click', () => {
            const accesories = this.getFilteredAccesories();
            if (accesories.length === 0) {
                App.showToast('No hay accesorios para copiar', 'error');
                return;
            }
            const dt = Export.getFormattedDateTime();
            const user = Auth.getCurrentUser();
            let text = 'XTREME MOBILE INC. - ACCESORIOS\n';
            text += 'Tel: ' + COMPANY.phone + '\n';
            text += '========================\n';
            text += 'Usuario: ' + user.fullName + ' | ' + dt.dateStr + ' ' + dt.timeStr + '\n';
            text += 'Total: ' + accesories.length + ' accesorios\n';
            text += '========================\n\n';
            accesories.forEach((p, idx) => {
                const price = parseFloat(p.price) > 0 ? 'Q' + parseFloat(p.price).toFixed(2) : 'Gratis';
                text += (idx + 1) + '. ' + p.model + ' | ' + this.getAccesoryType(p.model) + ' | ' + (p.color || '-') + ' | ' + price + ' | Stock: ' + (parseInt(p.stock) || 0) + '\n';
            });
            text += '\n========================\n';
            text += '(c) ' + new Date().getFullYear() + ' XTREME MOBILE INC.\n';
            navigator.clipboard.writeText(text).then(() => {
                App.showToast('Texto copiado al portapapeles', 'success');
            }).catch(() => {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                App.showToast('Texto copiado al portapapeles', 'success');
            });
        });
        this.renderAccesoriesTable();
    },

    getFilteredAccesories() {
        const products = DataStore.getProducts().filter(p => p.category === 'ACCESORIOS');
        const search = document.getElementById('searchAccInput').value.toLowerCase().trim();
        const category = document.getElementById('filterAccCategory').value;
        const dateFrom = document.getElementById('filterAccDateFrom').value;
        const dateTo = document.getElementById('filterAccDateTo').value;

        return products.filter(p => {
            if (search) {
                const match = (p.model && p.model.toLowerCase().includes(search)) ||
                    (p.color && p.color.toLowerCase().includes(search));
                if (!match) return false;
            }
            if (category !== 'all') {
                if (category === 'Templates') {
                    if (!p.model.toLowerCase().includes('template')) return false;
                } else {
                    if (!p.model.toLowerCase().includes(category.toLowerCase())) return false;
                }
            }
            if (dateFrom && p.entryDate && p.entryDate < dateFrom) return false;
            if (dateTo && p.entryDate && p.entryDate > dateTo) return false;
            return true;
        });
    },

    renderAccesoriesTable() {
        const accesories = this.getFilteredAccesories();
        const tbody = document.getElementById('accesoriosBody');
        document.getElementById('accCount').textContent = `${accesories.length} accesorios`;

        if (accesories.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-5">
                <i class="bi bi-tools fs-1 d-block mb-2"></i>No hay accesorios registrados
            </td></tr>`;
            return;
        }

        tbody.innerHTML = accesories.map((p, idx) => `
            <tr>
                <td class="fw-bold">${idx + 1}</td>
                <td><span class="fw-semibold">${this.escapeHtml(p.model)}</span></td>
                <td><span class="badge bg-info bg-opacity-10 text-info">${this.getAccesoryType(p.model)}</span></td>
                <td>${this.escapeHtml(p.color || '-')}</td>
                <td class="fw-semibold">${parseFloat(p.price) > 0 ? 'Q' + parseFloat(p.price).toFixed(2) : '<span class="text-success">Gratis</span>'}</td>
<td><span class="badge ${this.getStockColor(p.stock, p.minStock)}">${parseInt(p.stock)}</span></td>
                <td><small class="text-muted">${p.entryDate || '-'}</small></td>
                <td>
                    <div class="d-flex gap-1">
                        <button class="action-btn action-btn-edit" onclick="Inventory.openAccesoryModal('${p.id}')" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="action-btn action-btn-delete" onclick="Inventory.confirmDeleteAccesory('${p.id}')" title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    getAccesoryType(model) {
        const m = (model || '').toLowerCase();
        if (m.includes('cargador')) return 'Cargadores';
        if (m.includes('template') || m.includes('vidrio')) return 'Templates';
        if (m.includes('protector')) return 'Protectores';
        if (m.includes('chip') || m.includes('esim')) return 'Chips SIM';
        if (m.includes('case')) return 'Cases';
        if (m.includes('cable')) return 'Cables';
        if (m.includes('adaptador')) return 'Adaptadores';
        return 'Accesorios';
    },

    openAccesoryModal(id) {
        const product = id ? DataStore.getProductById(id) : null;
        document.getElementById('accModalTitle').innerHTML = product ? '<i class="bi bi-pencil me-2"></i>Editar Accesorio' : '<i class="bi bi-plus-circle me-2"></i>Agregar Accesorio';
        document.getElementById('accId').value = product ? product.id : '';
document.getElementById('accName').value = product ? product.model : '';
        document.getElementById('accType').value = product ? this.getAccesoryType(product.model) : 'Templates';
        document.getElementById('accColor').value = product ? product.color : '';
        document.getElementById('accPrice').value = product ? product.price : '';
        document.getElementById('accStock').value = product ? product.stock : '';
        document.getElementById('accMinStock').value = product ? product.minStock || '' : '2';
        document.getElementById('accDate').value = product ? product.entryDate : '';

        const modal = new bootstrap.Modal(document.getElementById('accesoryModal'));
        modal.show();
    },

    async saveAccesory() {
        const id = document.getElementById('accId').value;
        const name = document.getElementById('accName').value.trim();
        const type = document.getElementById('accType').value;
        const price = parseFloat(document.getElementById('accPrice').value) || 0;
        const stock = parseInt(document.getElementById('accStock').value) || 0;
        const minStock = parseInt(document.getElementById('accMinStock').value) || 0;
        const color = document.getElementById('accColor').value.trim();
        const date = document.getElementById('accDate').value;

        if (!name) {
            App.showToast('Por favor ingrese el nombre del accesorio', 'error');
            return;
        }

        const data = {
            model: name,
            category: 'ACCESORIOS',
            color,
            price,
            stock,
            minStock,
            entryDate: date
        };

        if (id) {
            await DataStore.updateProduct(id, data);
            await App.logHistory('Edición de accesorio', `Se editó el accesorio "${name}"`);
            App.showToast('Accesorio actualizado exitosamente', 'success');
        } else {
            await DataStore.addProduct(data);
            await App.logHistory('Nuevo accesorio', `Se agregó el accesorio "${name}"`);
            App.showToast('Accesorio agregado exitosamente', 'success');
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('accesoryModal'));
        if (modal) modal.hide();
        this.renderAccesoriesTable();
        if (typeof App !== 'undefined' && App.updateStockAlertBadges) App.updateStockAlertBadges();
        if (typeof Purchases !== 'undefined') Purchases.scan();
    },

    confirmDeleteAccesory(id) {
        const product = DataStore.getProductById(id);
        document.getElementById('deleteModalMessage').textContent = `¿Estás seguro de eliminar el accesorio "${product.model}"?`;
        document.getElementById('confirmDeleteBtn').onclick = async () => {
            await DataStore.deleteProduct(id);
            await App.logHistory('Eliminación de accesorio', `Se eliminó el accesorio "${product.model}"`);
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
            App.showToast('Accesorio eliminado exitosamente', 'success');
            this.renderAccesoriesTable();
            if (typeof App !== 'undefined' && App.updateStockAlertBadges) App.updateStockAlertBadges();
            if (typeof Purchases !== 'undefined') Purchases.scan();
        };
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    }
};
