/**
 * XTREM MOBILE - Módulo de Compras
 * Detecta automáticamente productos agotados (Inventario, Accesorios e Inventario
 * General) y los coloca en una lista para encargar. También muestra los productos
 * que están por acabarse (stock bajo, pero todavía disponibles).
 */

const Purchases = {
    SCAN_INTERVAL_MS: 10 * 60 * 1000, // 10 minutos
    _timer: null,
    _scanning: false,

    init() {
        this.renderPage();
        this.scan();
        if (!this._timer) {
            this._timer = setInterval(() => this.scan(), this.SCAN_INTERVAL_MS);
        }
    },

    onPageShow() {
        this.scan();
    },

    // Reúne el estado actual de Inventario (celulares), Accesorios e Inventario
    // General en una sola lista uniforme para poder revisarlos juntos.
    getAllStockItems() {
        const items = [];
        DataStore.getProducts().forEach(p => {
            items.push({
                productType: p.category === 'ACCESORIOS' ? 'accesorio' : 'inventario',
                productId: p.id,
                name: p.model,
                category: p.category || '',
                color: p.color || '',
                detail: [p.storage, p.status].filter(Boolean).join(' · '),
                stock: parseInt(p.stock) || 0,
                minStock: parseInt(p.minStock) || 0
            });
        });
        DataStore.getSupplies().forEach(s => {
            items.push({
                productType: 'supply',
                productId: s.id,
                name: s.name,
                category: s.category || '',
                color: '',
                detail: s.unit || '',
                stock: parseInt(s.quantity) || 0,
                minStock: parseInt(s.minStock) || 0
            });
        });
        return items;
    },

    // Crea solicitudes de compra para lo que se acabó y elimina automáticamente las
    // que ya se resolvieron porque el producto fue reabastecido.
    async scan() {
        if (this._scanning) return;
        this._scanning = true;
        try {
            const items = this.getAllStockItems();
            const existing = DataStore.getPurchaseRequests();
            let changed = false;

            for (const item of items) {
                if (item.stock > 0) continue;
                if (existing.find(e => e.productId === item.productId)) continue;
                await DataStore.addPurchaseRequest({
                    productType: item.productType,
                    productId: item.productId,
                    name: item.name,
                    category: item.category,
                    color: item.color,
                    detail: item.detail,
                    ordered: false
                });
                changed = true;
            }

            const stockById = {};
            items.forEach(i => { stockById[i.productId] = i.stock; });
            const currentRequests = DataStore.getPurchaseRequests();
            for (const req of currentRequests) {
                const currentStock = stockById[req.productId];
                if (currentStock !== undefined && currentStock > 0) {
                    await DataStore.deletePurchaseRequest(req.id);
                    changed = true;
                }
            }

            this.renderPage();
            if (typeof App !== 'undefined' && App.updateStockAlertBadges) App.updateStockAlertBadges();
        } finally {
            this._scanning = false;
        }
    },

    renderPage() {
        const container = document.getElementById('comprasPendingList');
        if (!container) return; // La página aún no está en el DOM (usuario sin acceso, por ejemplo)

        const pending = DataStore.getPurchaseRequests().slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        document.getElementById('comprasPendingCount').textContent = pending.length;

        if (pending.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-check2-circle fs-1 d-block mb-2 text-success"></i>
                    No hay productos agotados por encargar
                </div>`;
        } else {
            container.innerHTML = pending.map(req => `
                <div class="compras-item ${req.ordered ? 'compras-item-ordered' : ''}">
                    <div>
                        <div class="fw-bold">${this.esc(req.name)}</div>
                        <div class="small text-muted">${this.esc(req.category || '')}${req.color ? ' · ' + this.esc(req.color) : ''}${req.detail ? ' · ' + this.esc(req.detail) : ''}</div>
                        <div class="small text-muted">Agotado desde: ${new Date(req.createdAt).toLocaleDateString('es-GT')}</div>
                        ${req.ordered ? '<span class="badge bg-success mt-1">Ya se ordenó</span>' : ''}
                    </div>
                    <div class="compras-item-actions">
                        <button class="btn btn-sm ${req.ordered ? 'btn-outline-secondary' : 'btn-outline-success'}" onclick="Purchases.toggleOrdered('${req.id}')">
                            <i class="bi bi-${req.ordered ? 'arrow-counterclockwise' : 'check-lg'} me-1"></i>${req.ordered ? 'Deshacer' : 'Marcar Ordenado'}
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="Purchases.removeRequest('${req.id}')" title="Quitar de la lista">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        const lowStockItems = this.getAllStockItems().filter(i => i.minStock > 0 && i.stock > 0 && i.stock <= i.minStock);
        const lowContainer = document.getElementById('comprasLowStockList');
        document.getElementById('comprasLowStockCount').textContent = lowStockItems.length;

        if (lowStockItems.length === 0) {
            lowContainer.innerHTML = '<div class="text-center text-muted py-4">No hay productos por acabarse en este momento</div>';
        } else {
            lowContainer.innerHTML = lowStockItems.map(item => `
                <div class="compras-item">
                    <div>
                        <div class="fw-bold">${this.esc(item.name)}</div>
                        <div class="small text-muted">${this.esc(item.category || '')}${item.color ? ' · ' + this.esc(item.color) : ''}</div>
                    </div>
                    <div class="text-end">
                        <span class="badge badge-stock-medium">${item.stock} en stock</span>
                        <div class="small text-muted">Mínimo: ${item.minStock}</div>
                    </div>
                </div>
            `).join('');
        }
    },

    async toggleOrdered(id) {
        const req = DataStore.getPurchaseRequests().find(r => r.id === id);
        if (!req) return;
        await DataStore.updatePurchaseRequest(id, { ordered: !req.ordered });
        this.renderPage();
    },

    async removeRequest(id) {
        await DataStore.deletePurchaseRequest(id);
        this.renderPage();
        if (typeof App !== 'undefined' && App.updateStockAlertBadges) App.updateStockAlertBadges();
    },

    esc(text) {
        const div = document.createElement('div');
        div.textContent = text == null ? '' : String(text);
        return div.innerHTML;
    }
};
