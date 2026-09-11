/**
 * XTREM MOBILE - Módulo de Ventas (POS)
 * Carrito de venta (buscar/añadir productos), historial de ventas filtrable
 * por fecha/vendedor, y cuadre de caja (conteo de billetes y monedas).
 */

const POS = {
    cart: [],

    BILLS: [100, 50, 20, 10, 5, 1],
    COINS: [1, 0.25, 0.10, 0.05, 0.01],
    COIN_LABELS: { 1: '$1.00', 0.25: '25¢', 0.10: '10¢', 0.05: '5¢', 0.01: '1¢' },

    init() {
        this.setupNuevaVenta();
        this.setupHistorial();
        this.setupCuadre();
        this.applyTabPermissions();
    },

    applyTabPermissions() {
        const cuadreTab = document.getElementById('ventasTabCuadreItem');
        if (cuadreTab) cuadreTab.style.display = Auth.can('manageCuadre') ? '' : 'none';

        const nuevaVentaTabBtn = document.querySelector('#ventasTabs .nav-link[data-bs-target="#ventasTabNueva"]');
        const nuevaVentaLi = nuevaVentaTabBtn ? nuevaVentaTabBtn.closest('.nav-item') : null;
        if (nuevaVentaLi) nuevaVentaLi.style.display = Auth.can('manageSales') ? '' : 'none';
    },

    // Llamado cada vez que se navega a la página de Ventas
    onPageShow() {
        this.applyTabPermissions();
        this.populateSellerFilter();
        this.renderSalesTable();
        this.updateCuadreStats();
        this.renderCuadreHistory();
    },

    // ===== NUEVA VENTA (CARRITO) =====
    setupNuevaVenta() {
        document.getElementById('posSearchInput').addEventListener('input', () => this.renderSearchResults());
        document.getElementById('posCompleteSaleBtn').addEventListener('click', () => this.completeSale());
        this.renderCart();
    },

    renderSearchResults() {
        const term = document.getElementById('posSearchInput').value.toLowerCase().trim();
        const container = document.getElementById('posSearchResults');
        if (!term) {
            container.innerHTML = '<div class="text-center text-muted py-4 small">Escribe para buscar productos del inventario</div>';
            return;
        }

        const products = DataStore.getProducts().filter(p => {
            return (p.model && p.model.toLowerCase().includes(term)) ||
                (p.category && p.category.toLowerCase().includes(term)) ||
                (p.color && p.color.toLowerCase().includes(term));
        }).slice(0, 15);

        if (products.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-4 small">Sin resultados</div>';
            return;
        }

        container.innerHTML = products.map(p => {
            const stock = parseInt(p.stock) || 0;
            return `
            <div class="pos-search-item ${stock <= 0 ? 'pos-search-item-disabled' : ''} d-flex justify-content-between align-items-center" ${stock > 0 ? `onclick="POS.addToCart('${p.id}')"` : ''}>
                <div>
                    <div class="fw-semibold">${this.esc(p.model)}</div>
                    <small class="text-muted">${this.esc(p.category || '')}${p.color ? ' · ' + this.esc(p.color) : ''} · Stock: ${stock}</small>
                </div>
                <div class="text-end">
                    <div class="fw-bold text-danger">Q${(parseFloat(p.price) || 0).toFixed(2)}</div>
                    <button class="btn btn-sm btn-danger mt-1" ${stock <= 0 ? 'disabled' : ''}><i class="bi bi-plus-lg"></i></button>
                </div>
            </div>
        `;
        }).join('');
    },

    addToCart(productId) {
        const product = DataStore.getProductById(productId);
        if (!product) return;
        const stock = parseInt(product.stock) || 0;
        if (stock <= 0) {
            App.showToast('Este producto no tiene stock disponible', 'error');
            return;
        }

        const existing = this.cart.find(i => i.productId === productId);
        if (existing) {
            if (existing.qty + 1 > stock) {
                App.showToast('No hay más stock disponible de este producto', 'error');
                return;
            }
            existing.qty++;
        } else {
            this.cart.push({ productId, name: product.model, category: product.category || '', price: parseFloat(product.price) || 0, qty: 1, stock });
        }
        this.renderCart();
    },

    updateCartQty(productId, qty) {
        const item = this.cart.find(i => i.productId === productId);
        if (!item) return;
        qty = parseInt(qty) || 0;
        if (qty <= 0) {
            this.removeFromCart(productId);
            return;
        }
        if (qty > item.stock) {
            App.showToast('No hay suficiente stock. Disponible: ' + item.stock, 'error');
            qty = item.stock;
        }
        item.qty = qty;
        this.renderCart();
    },

    updateCartPrice(productId, price) {
        const item = this.cart.find(i => i.productId === productId);
        if (!item) return;
        item.price = parseFloat(price) || 0;
        this.renderCart();
    },

    removeFromCart(productId) {
        this.cart = this.cart.filter(i => i.productId !== productId);
        this.renderCart();
    },

    renderCart() {
        const container = document.getElementById('posCartBody');
        const totalEl = document.getElementById('posCartTotal');
        const completeBtn = document.getElementById('posCompleteSaleBtn');

        if (this.cart.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-cart-x fs-2 d-block mb-2"></i>Carrito vacío</div>';
            totalEl.textContent = 'Q0.00';
            completeBtn.disabled = true;
            return;
        }

        let total = 0;
        container.innerHTML = this.cart.map(item => {
            const subtotal = item.qty * item.price;
            total += subtotal;
            return `
                <div class="pos-cart-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="fw-semibold small">${this.esc(item.name)}</div>
                        <button class="btn btn-sm btn-link text-danger p-0" onclick="POS.removeFromCart('${item.productId}')" title="Quitar"><i class="bi bi-x-lg"></i></button>
                    </div>
                    <div class="d-flex align-items-center gap-2 mt-1 flex-wrap">
                        <input type="number" class="form-control form-control-sm" style="width:60px" min="1" max="${item.stock}" value="${item.qty}" onchange="POS.updateCartQty('${item.productId}', this.value)">
                        <span class="small text-muted">x Q</span>
                        <input type="number" class="form-control form-control-sm" style="width:80px" min="0" step="0.01" value="${item.price}" onchange="POS.updateCartPrice('${item.productId}', this.value)">
                        <span class="ms-auto fw-bold small">Q${subtotal.toFixed(2)}</span>
                    </div>
                </div>
            `;
        }).join('');

        totalEl.textContent = 'Q' + total.toFixed(2);
        completeBtn.disabled = false;
    },

    async completeSale() {
        if (this.cart.length === 0) return;
        // Protección contra doble clic / doble envío: mientras se procesa una venta,
        // se ignoran clics adicionales y el botón se deshabilita visualmente.
        if (this._processingSale) return;
        this._processingSale = true;

        const completeBtn = document.getElementById('posCompleteSaleBtn');
        const originalBtnHtml = completeBtn.innerHTML;
        completeBtn.disabled = true;
        completeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Procesando...';

        const customer = document.getElementById('posCustomer').value.trim();
        const note = document.getElementById('posReceiptNote').value.trim();
        const currentUser = Auth.getCurrentUser();
        const ticketId = 'tkt_' + Date.now();

        try {
            for (const item of this.cart) {
                const total = item.qty * item.price;
                await DataStore.addSale({
                    productId: item.productId,
                    productName: item.name,
                    category: item.category || '',
                    quantity: item.qty,
                    price: item.price,
                    total: total,
                    customer: customer,
                    seller: currentUser ? currentUser.fullName : 'Sistema',
                    sellerId: currentUser ? currentUser.id : null,
                    ticketId: ticketId,
                    receiptNote: note
                });

                const product = DataStore.getProductById(item.productId);
                if (product) {
                    const newStock = Math.max(0, (parseInt(product.stock) || 0) - item.qty);
                    await DataStore.updateProduct(item.productId, { stock: newStock });
                }
            }

            await Inventory.renderTable();
            Dashboard.update();
            if (typeof Purchases !== 'undefined') Purchases.scan();

            const itemsSummary = this.cart.map(i => `${i.qty}x ${i.name}`).join(', ');
            const totalVenta = this.cart.reduce((sum, i) => sum + i.qty * i.price, 0);
            await App.logHistory('Venta Registrada', `Venta de ${itemsSummary} (total: Q${totalVenta.toFixed(2)})${customer ? ` - Cliente: ${customer}` : ''}`);
            App.showToast('Venta registrada exitosamente', 'success');

            this.cart = [];
            document.getElementById('posCustomer').value = '';
            document.getElementById('posReceiptNote').value = '';
            document.getElementById('posSearchInput').value = '';
            this.renderSearchResults();
            this.renderCart();
            this.populateSellerFilter();
            this.renderSalesTable();
            this.updateCuadreStats();
            if (typeof App.renderUsersTable === 'function') App.renderUsersTable();

            Receipt.printSale(ticketId);
        } catch (e) {
            console.error('Error al registrar venta:', e);
            App.showToast('Error al registrar la venta. Intente de nuevo.', 'error');
        } finally {
            this._processingSale = false;
            completeBtn.disabled = this.cart.length === 0;
            completeBtn.innerHTML = originalBtnHtml;
        }
    },

    // ===== HISTORIAL DE VENTAS =====
    setupHistorial() {
        document.getElementById('searchSalesInput').addEventListener('input', () => this.renderSalesTable());
        document.getElementById('filterSalesSeller').addEventListener('change', () => this.renderSalesTable());
        document.getElementById('filterSalesFrom').addEventListener('change', () => this.renderSalesTable());
        document.getElementById('filterSalesTo').addEventListener('change', () => this.renderSalesTable());
        document.getElementById('clearSalesFilters').addEventListener('click', () => {
            document.getElementById('searchSalesInput').value = '';
            document.getElementById('filterSalesSeller').value = 'all';
            document.getElementById('filterSalesFrom').value = '';
            document.getElementById('filterSalesTo').value = '';
            this.renderSalesTable();
        });
        this.populateSellerFilter();
        this.renderSalesTable();
    },

    populateSellerFilter() {
        const select = document.getElementById('filterSalesSeller');
        const sales = DataStore.getSales();
        const sellers = [...new Set(sales.map(s => s.seller).filter(Boolean))];
        const current = select.value;
        select.innerHTML = '<option value="all">Todos</option>' + sellers.map(s => `<option value="${this.esc(s)}">${this.esc(s)}</option>`).join('');
        select.value = sellers.includes(current) ? current : 'all';
    },

    getFilteredSales() {
        const sales = DataStore.getSales();
        const search = document.getElementById('searchSalesInput').value.toLowerCase().trim();
        const seller = document.getElementById('filterSalesSeller').value;
        const from = document.getElementById('filterSalesFrom').value;
        const to = document.getElementById('filterSalesTo').value;

        return sales.filter(s => {
            if (search) {
                const match = (s.productName && s.productName.toLowerCase().includes(search)) ||
                    (s.customer && s.customer.toLowerCase().includes(search));
                if (!match) return false;
            }
            if (seller !== 'all' && s.seller !== seller) return false;
            const dateStr = s.createdAt ? s.createdAt.split('T')[0] : '';
            if (from && dateStr < from) return false;
            if (to && dateStr > to) return false;
            return true;
        });
    },

    renderSalesTable() {
        const sales = this.getFilteredSales();
        const tbody = document.getElementById('salesBody');

        document.getElementById('salesCount').textContent = `${sales.length} registros`;

        if (sales.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted py-5">
                <i class="bi bi-receipt-cutoff fs-1 d-block mb-2"></i>
                No hay ventas registradas
            </td></tr>`;
            document.getElementById('salesTotalValue').textContent = 'Q0.00';
            return;
        }

        let total = 0;
        tbody.innerHTML = sales.slice().reverse().map((s, i) => {
            total += parseFloat(s.total) || 0;
            const dt = s.createdAt ? new Date(s.createdAt) : null;
            const dateStr = dt ? dt.toLocaleDateString('es-GT') : '-';
            const timeStr = dt ? dt.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }) : '-';
            return `
            <tr>
                <td class="fw-bold">${i + 1}</td>
                <td><small>${dateStr}</small></td>
                <td><small>${timeStr}</small></td>
                <td>${this.esc(s.productName || '')}</td>
                <td>${s.quantity || 1}</td>
                <td>Q${(parseFloat(s.price) || 0).toFixed(2)}</td>
                <td>Q${(parseFloat(s.total) || 0).toFixed(2)}</td>
                <td>${this.esc(s.customer || '')}</td>
                <td><span class="badge bg-danger bg-opacity-10 text-danger">${this.esc(s.seller || '')}</span></td>
                <td><button class="action-btn action-btn-edit" title="Imprimir recibo" onclick="Receipt.printSale('${s.ticketId || s.id}')"><i class="bi bi-printer"></i></button></td>
            </tr>`;
        }).join('');
        document.getElementById('salesTotalValue').textContent = `Q${total.toFixed(2)}`;
    },

    // ===== CUADRE DE CAJA =====
    setupCuadre() {
        this.renderCuadreInputs();
        document.getElementById('saveCuadreBtn').addEventListener('click', () => this.saveCuadre());
        document.getElementById('filterCuadreDate').addEventListener('change', () => this.renderCuadreHistory());
        this.updateCuadreStats();
        this.renderCuadreHistory();
    },

    renderCuadreInputs() {
        const billsContainer = document.getElementById('cuadreBillsContainer');
        const coinsContainer = document.getElementById('cuadreCoinsContainer');

        billsContainer.innerHTML = this.BILLS.map(v => `
            <div class="col-6 col-md-4">
                <label class="form-label small">$${v}.00</label>
                <div class="input-group input-group-sm">
                    <span class="input-group-text">x</span>
                    <input type="number" class="form-control cuadre-input" data-denom="${v}" data-type="bill" min="0" value="0">
                </div>
                <small class="text-muted cuadre-subtotal" data-denom-subtotal="bill-${v}">Q0.00</small>
            </div>
        `).join('');

        coinsContainer.innerHTML = this.COINS.map(v => `
            <div class="col-6 col-md-4">
                <label class="form-label small">${this.COIN_LABELS[v]}</label>
                <div class="input-group input-group-sm">
                    <span class="input-group-text">x</span>
                    <input type="number" class="form-control cuadre-input" data-denom="${v}" data-type="coin" min="0" value="0">
                </div>
                <small class="text-muted cuadre-subtotal" data-denom-subtotal="coin-${v}">Q0.00</small>
            </div>
        `).join('');

        document.querySelectorAll('.cuadre-input').forEach(input => {
            input.addEventListener('input', () => this.calcCuadreTotal());
        });
    },

    calcCuadreTotal() {
        let total = 0;
        document.querySelectorAll('.cuadre-input').forEach(input => {
            const denom = parseFloat(input.dataset.denom);
            const type = input.dataset.type;
            const qty = parseInt(input.value) || 0;
            const subtotal = denom * qty;
            total += subtotal;
            const subtotalEl = document.querySelector(`[data-denom-subtotal="${type}-${input.dataset.denom}"]`);
            if (subtotalEl) subtotalEl.textContent = 'Q' + subtotal.toFixed(2);
        });

        document.getElementById('cuadreTotalCounted').textContent = 'Q' + total.toFixed(2);

        const expected = this.getTodaysSalesTotal();
        const diff = total - expected;
        const diffEl = document.getElementById('cuadreDifference');
        diffEl.textContent = (diff >= 0 ? '+' : '') + 'Q' + diff.toFixed(2);
        diffEl.className = diff === 0 ? 'text-success' : (diff < 0 ? 'text-danger' : 'text-warning');

        return total;
    },

    getTodaysSalesTotal() {
        const todayStr = new Date().toISOString().split('T')[0];
        const sales = DataStore.getSales().filter(s => s.createdAt && s.createdAt.split('T')[0] === todayStr);
        return sales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
    },

    getTodaysTicketCount() {
        const todayStr = new Date().toISOString().split('T')[0];
        const sales = DataStore.getSales().filter(s => s.createdAt && s.createdAt.split('T')[0] === todayStr);
        const tickets = new Set(sales.map(s => s.ticketId || s.id));
        return tickets.size;
    },

    updateCuadreStats() {
        const expectedEl = document.getElementById('cuadreExpectedToday');
        const ticketsEl = document.getElementById('cuadreTicketsToday');
        if (expectedEl) expectedEl.textContent = 'Q' + this.getTodaysSalesTotal().toFixed(2);
        if (ticketsEl) ticketsEl.textContent = this.getTodaysTicketCount();
        this.calcCuadreTotal();
    },

    async saveCuadre() {
        const denominations = { bills: {}, coins: {} };
        document.querySelectorAll('.cuadre-input').forEach(input => {
            const qty = parseInt(input.value) || 0;
            if (input.dataset.type === 'bill') denominations.bills[input.dataset.denom] = qty;
            else denominations.coins[input.dataset.denom] = qty;
        });

        const totalCounted = this.calcCuadreTotal();
        const totalExpected = this.getTodaysSalesTotal();
        const note = document.getElementById('cuadreNote').value.trim();
        const currentUser = Auth.getCurrentUser();

        const entry = {
            date: new Date().toISOString().split('T')[0],
            denominations,
            totalCounted,
            totalExpected,
            difference: totalCounted - totalExpected,
            note,
            userId: currentUser ? currentUser.id : null,
            userName: currentUser ? currentUser.fullName : 'Sistema'
        };

        await DataStore.addCashCount(entry);
        await App.logHistory('Cuadre de Caja', `Cuadre registrado: Contado Q${totalCounted.toFixed(2)}, Esperado Q${totalExpected.toFixed(2)}, Diferencia Q${entry.difference.toFixed(2)}`);
        App.showToast('Cuadre guardado exitosamente', 'success');

        document.querySelectorAll('.cuadre-input').forEach(input => input.value = 0);
        document.getElementById('cuadreNote').value = '';
        this.calcCuadreTotal();
        this.renderCuadreHistory();
    },

    renderCuadreHistory() {
        const dateFilterEl = document.getElementById('filterCuadreDate');
        const dateFilter = dateFilterEl ? dateFilterEl.value : '';
        let list = DataStore.getCashCounts().slice().reverse();
        if (dateFilter) list = list.filter(c => c.date === dateFilter);

        const tbody = document.getElementById('cuadreHistoryBody');
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4 small">Sin cuadres registrados</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(c => {
            const diff = parseFloat(c.difference) || 0;
            const diffClass = diff === 0 ? 'text-success' : (diff < 0 ? 'text-danger' : 'text-warning');
            return `
                <tr style="cursor:pointer" onclick="POS.viewCuadreDetail('${c.id}')">
                    <td><small>${c.date}</small></td>
                    <td><small>${this.esc(c.userName || '')}</small></td>
                    <td><small>Q${(parseFloat(c.totalCounted) || 0).toFixed(2)}</small></td>
                    <td><small class="${diffClass}">Q${diff.toFixed(2)}</small></td>
                    <td><i class="bi bi-chevron-right text-muted"></i></td>
                </tr>
            `;
        }).join('');
    },

    viewCuadreDetail(id) {
        const entry = DataStore.getCashCounts().find(c => c.id === id);
        if (!entry) return;

        let html = `
            <div class="mb-3">
                <div><strong>Fecha:</strong> ${this.esc(entry.date)}</div>
                <div><strong>Usuario:</strong> ${this.esc(entry.userName || '')}</div>
            </div>
            <table class="table table-sm">
                <thead><tr><th>Denominación</th><th>Cantidad</th><th>Subtotal</th></tr></thead>
                <tbody>
        `;
        this.BILLS.forEach(v => {
            const qty = (entry.denominations && entry.denominations.bills && entry.denominations.bills[v]) || 0;
            if (qty > 0) html += `<tr><td>$${v}.00</td><td>${qty}</td><td>Q${(v * qty).toFixed(2)}</td></tr>`;
        });
        this.COINS.forEach(v => {
            const qty = (entry.denominations && entry.denominations.coins && entry.denominations.coins[v]) || 0;
            if (qty > 0) html += `<tr><td>${this.COIN_LABELS[v]}</td><td>${qty}</td><td>Q${(v * qty).toFixed(2)}</td></tr>`;
        });
        html += `
                </tbody>
            </table>
            <div class="d-flex justify-content-between"><strong>Total Contado:</strong><strong>Q${(parseFloat(entry.totalCounted) || 0).toFixed(2)}</strong></div>
            <div class="d-flex justify-content-between"><strong>Ventas Esperadas:</strong><strong>Q${(parseFloat(entry.totalExpected) || 0).toFixed(2)}</strong></div>
            <div class="d-flex justify-content-between"><strong>Diferencia:</strong><strong>Q${(parseFloat(entry.difference) || 0).toFixed(2)}</strong></div>
            ${entry.note ? `<div class="mt-2"><strong>Nota:</strong> ${this.esc(entry.note)}</div>` : ''}
        `;

        document.getElementById('cuadreDetailBody').innerHTML = html;
        const modal = new bootstrap.Modal(document.getElementById('cuadreDetailModal'));
        modal.show();
    },

    esc(text) {
        const div = document.createElement('div');
        div.textContent = text == null ? '' : String(text);
        return div.innerHTML;
    }
};
