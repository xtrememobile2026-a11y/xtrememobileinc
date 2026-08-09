/** Venta rápida: tocar un equipo, confirmar y descontar una unidad. */
const Sales = {
    selectedProductId: null,

    init() {
        document.getElementById('salesProducts').addEventListener('click', event => {
            const card = event.target.closest('[data-sale-product]');
            if (card) this.askConfirmation(card.dataset.saleProduct);
        });
        document.getElementById('confirmSaleBtn').addEventListener('click', () => this.confirmSale());
        document.getElementById('saleSearchName').addEventListener('input', () => this.renderProducts());
        document.getElementById('saleSearchColor').addEventListener('input', () => this.renderProducts());
        document.getElementById('saleSearchCategory').addEventListener('change', () => this.renderProducts());
        document.getElementById('clearSaleFilters').addEventListener('click', () => this.clearFilters());
        document.getElementById('decreaseSaleQuantity').addEventListener('click', () => this.changeQuantity(-1));
        document.getElementById('increaseSaleQuantity').addEventListener('click', () => this.changeQuantity(1));
        document.getElementById('saleQuantity').addEventListener('input', () => this.validateQuantity());
    },

    render() {
        this.populateCategories();
        this.renderProducts();
        this.renderRecentSales();
    },

    renderProducts() {
        const nameSearch = document.getElementById('saleSearchName').value.trim().toLowerCase();
        const colorSearch = document.getElementById('saleSearchColor').value.trim().toLowerCase();
        const categorySearch = document.getElementById('saleSearchCategory').value;
        const products = DataStore.getProducts().filter(product => {
            const matchesName = !nameSearch || (product.model || '').toLowerCase().includes(nameSearch);
            const matchesColor = !colorSearch || (product.color || '').toLowerCase().includes(colorSearch);
            const matchesCategory = !categorySearch || product.category === categorySearch;
            return product.category !== 'ACCESORIOS' && matchesName && matchesColor && matchesCategory;
        });
        const container = document.getElementById('salesProducts');
        if (!products.length) {
            container.innerHTML = '<div class="col-12 text-center text-muted py-5"><i class="bi bi-search fs-1 d-block mb-2"></i>No se encontraron equipos con esos filtros.</div>';
            return;
        }
        container.innerHTML = products.map(product => {
            const available = Number(product.stock) > 0;
            return `<div class="col-12 col-sm-6 col-lg-4 col-xl-3"><button type="button" class="btn text-start w-100 h-100 border shadow-sm p-3 ${available ? 'bg-white' : 'bg-light opacity-50'}" data-sale-product="${product.id}" ${available ? '' : 'disabled'}><div class="d-flex justify-content-between gap-2"><i class="bi bi-phone fs-3 text-danger"></i><span class="badge ${available ? 'bg-success' : 'bg-secondary'}">${available ? product.stock + ' disponible(s)' : 'Agotado'}</span></div><div class="fw-bold mt-3 text-dark">${this.escape(product.model)}</div><small class="text-muted d-block">${this.escape(product.color || 'Sin color')}${product.storage ? ' · ' + this.escape(product.storage) : ''}</small><div class="text-danger fw-bold mt-2">Q${Number(product.price || 0).toFixed(2)}</div></button></div>`;
        }).join('');
    },

    clearFilters() {
        document.getElementById('saleSearchName').value = '';
        document.getElementById('saleSearchColor').value = '';
        document.getElementById('saleSearchCategory').value = '';
        this.renderProducts();
    },

    populateCategories() {
        const select = document.getElementById('saleSearchCategory');
        const currentValue = select.value;
        const categories = [...new Set(DataStore.getProducts().filter(product => product.category && product.category !== 'ACCESORIOS').map(product => product.category))].sort();
        select.innerHTML = '<option value="">Todas las categorías</option>' + categories.map(category => `<option value="${this.escape(category)}">${this.escape(category)}</option>`).join('');
        select.value = categories.includes(currentValue) ? currentValue : '';
    },
    askConfirmation(productId) {
        const product = DataStore.getProductById(productId);
        if (!product || Number(product.stock) < 1) { App.showToast('Este equipo ya no está disponible.', 'error'); this.render(); return; }
        this.selectedProductId = productId;
        const quantityInput = document.getElementById('saleQuantity');
        quantityInput.value = 1;
        quantityInput.max = product.stock;
        document.getElementById('saleQuantityHelp').textContent = 'Máximo disponible: ' + product.stock + ' unidad(es).';
        document.getElementById('confirmSaleProduct').innerHTML = `<div class="fw-bold">${this.escape(product.model)}</div><small class="text-muted">${this.escape(product.color || 'Sin color')}${product.storage ? ' · ' + this.escape(product.storage) : ''}</small><div class="text-danger fw-bold mt-2">Q${Number(product.price || 0).toFixed(2)} <span class="text-muted fw-normal">· ${product.stock} en stock</span></div>`;
        bootstrap.Modal.getOrCreateInstance(document.getElementById('confirmSaleModal')).show();
    },

    changeQuantity(change) {
        const input = document.getElementById('saleQuantity');
        const max = Number(input.max) || 1;
        input.value = Math.max(1, Math.min(max, (Number(input.value) || 1) + change));
    },

    validateQuantity() {
        const input = document.getElementById('saleQuantity');
        const max = Number(input.max) || 1;
        input.value = Math.max(1, Math.min(max, Number(input.value) || 1));
    },

    confirmSale() {
        const product = DataStore.getProductById(this.selectedProductId);
        if (!product || Number(product.stock) < 1) { App.showToast('Este equipo ya no está disponible.', 'error'); this.render(); return; }
        this.validateQuantity();
        const quantity = Number(document.getElementById('saleQuantity').value);
        if (quantity > Number(product.stock)) { App.showToast('La cantidad supera el stock disponible.', 'error'); return; }
        const remainingStock = Number(product.stock) - quantity;
        const sale = DataStore.addSale({ productId: product.id, model: product.model, imei: product.imei || '', price: Number(product.price || 0), quantity, customer: 'Venta rápida', paymentMethod: 'No especificado', seller: (Auth.getCurrentUser() || {}).fullName || 'Usuario' });
        DataStore.updateProduct(product.id, { stock: remainingStock, updatedAt: new Date().toISOString() });
        App.logHistory('Venta registrada', `Se vendieron ${quantity} unidad(es) de "${product.model}". Stock restante: ${remainingStock}. Venta: ${sale.id}`);
        bootstrap.Modal.getInstance(document.getElementById('confirmSaleModal')).hide();
        this.selectedProductId = null;
        this.render();
        Dashboard.update();
        App.showToast(`Venta registrada: ${quantity} unidad(es) de ${product.model}. El stock se actualizó automáticamente.`, 'success');
    },

    renderRecentSales() {
        const sales = DataStore.getSales().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        document.getElementById('salesCount').textContent = sales.length;
        const container = document.getElementById('recentSales');
        container.innerHTML = sales.length ? sales.slice(0, 8).map(sale => `<div class="list-group-item py-3 d-flex justify-content-between gap-3"><div><div class="fw-semibold">${this.escape(sale.model)} <span class="badge bg-light text-dark border">x${sale.quantity || 1}</span></div><small class="text-muted">${new Date(sale.createdAt).toLocaleString('es-GT')}</small></div><span class="text-danger fw-bold text-nowrap">Q${Number(sale.price || 0).toFixed(2)}</span></div>`).join('') : '<div class="text-center text-muted py-5"><i class="bi bi-receipt fs-2 d-block mb-2"></i>Aún no hay ventas registradas.</div>';
    },

    escape(value) { const element = document.createElement('div'); element.textContent = value || ''; return element.innerHTML; }
};



