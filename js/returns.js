/**
 * XTREM MOBILE - Devoluciones
 * Registra devoluciones de equipos y repone el inventario automáticamente
 */
const Returns = {
    productIndex: [],

    init() {
        document.getElementById('addReturnBtn').addEventListener('click', () => this.openModal());
        document.getElementById('saveReturnBtn').addEventListener('click', () => this.save());
        document.getElementById('returnProductSearch').addEventListener('input', () => this.matchProduct());
        document.getElementById('searchReturns').addEventListener('input', () => this.renderTable());
        document.getElementById('filterReturnDamage').addEventListener('change', () => this.renderTable());
        document.getElementById('filterReturnDateFrom').addEventListener('change', () => this.renderTable());
    },

    openModal() {
        document.getElementById('returnForm').reset();
        document.getElementById('returnProductId').value = '';
        document.getElementById('returnDate').value = new Date().toISOString().split('T')[0];
        const user = Auth.getCurrentUser();
        document.getElementById('returnReceivedBy').value = user ? user.fullName : '';
        document.getElementById('returnNewCategoryWrap').classList.add('d-none');
        document.getElementById('returnNewPriceWrap').classList.add('d-none');
        document.getElementById('returnNewCategory').required = false;
        document.getElementById('returnNewPrice').required = false;
        const hint = document.getElementById('returnProductHint');
        hint.textContent = 'Si el equipo aparece en el inventario, selecciónalo de la lista para vincular la devolución automáticamente.';
        hint.classList.remove('text-success', 'text-danger');
        this.populateProductOptions();
        new bootstrap.Modal(document.getElementById('returnModal')).show();
    },

    populateProductOptions() {
        const products = DataStore.getProducts();
        this.productIndex = products.map(p => ({
            id: p.id,
            label: `${p.model} — ${p.color || 'Sin color'}${p.storage ? ' · ' + p.storage : ''}${p.imei ? ' · IMEI ' + p.imei : ''}`,
            product: p
        }));
        const datalist = document.getElementById('returnProductOptions');
        datalist.innerHTML = this.productIndex.map(entry => `<option value="${this.escapeAttr(entry.label)}">`).join('');
    },

    matchProduct() {
        const value = document.getElementById('returnProductSearch').value.trim();
        const match = this.productIndex.find(entry => entry.label === value);
        const hint = document.getElementById('returnProductHint');
        const categoryWrap = document.getElementById('returnNewCategoryWrap');
        const priceWrap = document.getElementById('returnNewPriceWrap');
        const categorySelect = document.getElementById('returnNewCategory');
        const priceInput = document.getElementById('returnNewPrice');

        if (match) {
            document.getElementById('returnProductId').value = match.id;
            document.getElementById('returnImei').value = match.product.imei || '';
            document.getElementById('returnColor').value = match.product.color || '';
            document.getElementById('returnStorage').value = match.product.storage || '';
            categoryWrap.classList.add('d-none');
            priceWrap.classList.add('d-none');
            categorySelect.required = false;
            priceInput.required = false;
            hint.textContent = `Vinculado al inventario: se sumará al stock de "${match.product.model}".`;
            hint.classList.remove('text-danger');
            hint.classList.add('text-success');
        } else {
            document.getElementById('returnProductId').value = '';
            categorySelect.required = !!value;
            priceInput.required = !!value;
            if (value) {
                categoryWrap.classList.remove('d-none');
                priceWrap.classList.remove('d-none');
                hint.textContent = 'Este equipo no está en el inventario actual: se creará como un producto nuevo con el stock devuelto.';
                hint.classList.remove('text-success');
                hint.classList.add('text-danger');
            } else {
                categoryWrap.classList.add('d-none');
                priceWrap.classList.add('d-none');
                hint.textContent = 'Si el equipo aparece en el inventario, selecciónalo de la lista para vincular la devolución automáticamente.';
                hint.classList.remove('text-success', 'text-danger');
            }
        }
    },

    save() {
        const productId = document.getElementById('returnProductId').value;
        const searchValue = document.getElementById('returnProductSearch').value.trim();
        const quantity = parseInt(document.getElementById('returnQuantity').value) || 0;
        const reason = document.getElementById('returnReason').value;
        const returnDate = document.getElementById('returnDate').value;
        const receivedBy = document.getElementById('returnReceivedBy').value.trim();
        const condition = document.getElementById('returnCondition').value;
        const completeInput = document.querySelector('input[name="returnComplete"]:checked');
        const damageInput = document.querySelector('input[name="returnDamage"]:checked');
        const memo = document.getElementById('returnMemo').value.trim();
        const imei = document.getElementById('returnImei').value.trim();
        const color = document.getElementById('returnColor').value.trim();
        const storage = document.getElementById('returnStorage').value;

        if (!searchValue || !quantity || quantity < 1 || !reason || !returnDate || !receivedBy || !memo) {
            App.showToast('Por favor completa todos los campos obligatorios', 'error');
            return;
        }

        const complete = completeInput ? completeInput.value : 'si';
        const physicalDamage = damageInput ? damageInput.value : 'no';

        let product;
        let model;
        let category;

        if (productId) {
            product = DataStore.getProductById(productId);
            if (!product) {
                App.showToast('El equipo seleccionado ya no existe en el inventario', 'error');
                return;
            }
            model = product.model;
            category = product.category;
            const newStock = (parseInt(product.stock) || 0) + quantity;
            DataStore.updateProduct(product.id, { stock: newStock, updatedAt: new Date().toISOString() });
        } else {
            category = document.getElementById('returnNewCategory').value;
            const price = document.getElementById('returnNewPrice').value;
            if (!category || price === '') {
                App.showToast('Indica la categoría y el precio para agregar este equipo al inventario', 'error');
                return;
            }
            model = searchValue;
            product = DataStore.addProduct({
                category,
                model,
                imei,
                color,
                storage,
                price: parseFloat(price) || 0,
                stock: quantity,
                minStock: 0,
                status: condition,
                entryDate: returnDate
            });
        }

        DataStore.addReturn({
            productId: product.id,
            model,
            category,
            imei,
            color,
            storage,
            quantity,
            reason,
            returnDate,
            receivedBy,
            condition,
            complete,
            physicalDamage,
            memo
        });

        App.logHistory('Devolución registrada', `Se registró la devolución de "${model}" (x${quantity}). Motivo: ${reason}. Recibido por: ${receivedBy}. El inventario se incrementó automáticamente.`);

        bootstrap.Modal.getInstance(document.getElementById('returnModal')).hide();
        this.renderTable();
        Dashboard.update();
        App.showToast('Devolución registrada. El inventario se actualizó automáticamente.', 'success');
    },

    renderTable() {
        const search = (document.getElementById('searchReturns').value || '').trim().toLowerCase();
        const damageFilter = document.getElementById('filterReturnDamage').value;
        const dateFrom = document.getElementById('filterReturnDateFrom').value;

        let returns = DataStore.getReturns();

        if (search) {
            returns = returns.filter(r =>
                (r.model || '').toLowerCase().includes(search) ||
                (r.imei || '').toLowerCase().includes(search) ||
                (r.reason || '').toLowerCase().includes(search) ||
                (r.receivedBy || '').toLowerCase().includes(search)
            );
        }
        if (damageFilter !== 'all') {
            returns = returns.filter(r => r.physicalDamage === damageFilter);
        }
        if (dateFrom) {
            returns = returns.filter(r => r.returnDate >= dateFrom);
        }

        document.getElementById('returnsCount').textContent = returns.length;
        const tbody = document.getElementById('returnsBody');

        if (!returns.length) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-5">
                <i class="bi bi-arrow-return-left fs-1 d-block mb-2"></i>
                No hay devoluciones registradas
            </td></tr>`;
            return;
        }

        tbody.innerHTML = returns.map((r, i) => `
            <tr>
                <td class="fw-bold">${i + 1}</td>
                <td>${this.escape(r.model)}<br><small class="text-muted">${this.escape(r.category || '')}</small></td>
                <td><small>${this.escape(r.imei || '-')}</small></td>
                <td><small>${this.escape(r.color || '-')}${r.storage ? ' · ' + this.escape(r.storage) : ''}</small></td>
                <td><small>${this.escape(r.reason)}</small></td>
                <td>
                    ${r.physicalDamage === 'si' ? '<span class="badge bg-danger">Con daño</span>' : '<span class="badge bg-success">Sin daño</span>'}
                    ${r.complete === 'no' ? '<span class="badge bg-warning text-dark ms-1">Incompleto</span>' : ''}
                </td>
                <td><small>${this.escape(r.receivedBy)}</small></td>
                <td><small>${r.returnDate ? new Date(r.returnDate + 'T00:00:00').toLocaleDateString('es-GT') : '-'}</small></td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" data-view-return="${r.id}" title="Ver memo">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('[data-view-return]').forEach(btn => {
            btn.addEventListener('click', () => this.viewDetail(btn.dataset.viewReturn));
        });
    },

    viewDetail(id) {
        const record = DataStore.getReturns().find(r => r.id === id);
        if (!record) return;
        const body = document.getElementById('returnDetailBody');
        body.innerHTML = `
            <div class="mb-3">
                <h6 class="fw-bold mb-1">${this.escape(record.model)}</h6>
                <small class="text-muted">${this.escape(record.category || '')} ${record.color ? '· ' + this.escape(record.color) : ''} ${record.storage ? '· ' + this.escape(record.storage) : ''}</small>
            </div>
            <dl class="row small mb-0">
                <dt class="col-5">IMEI</dt><dd class="col-7">${this.escape(record.imei || '-')}</dd>
                <dt class="col-5">Cantidad</dt><dd class="col-7">${record.quantity}</dd>
                <dt class="col-5">Motivo</dt><dd class="col-7">${this.escape(record.reason)}</dd>
                <dt class="col-5">Fecha</dt><dd class="col-7">${record.returnDate ? new Date(record.returnDate + 'T00:00:00').toLocaleDateString('es-GT') : '-'}</dd>
                <dt class="col-5">Recibido por</dt><dd class="col-7">${this.escape(record.receivedBy)}</dd>
                <dt class="col-5">Estado del equipo</dt><dd class="col-7">${this.escape(record.condition)}</dd>
                <dt class="col-5">Entrega completa</dt><dd class="col-7">${record.complete === 'si' ? 'Sí' : 'No, incompleta'}</dd>
                <dt class="col-5">Daño físico</dt><dd class="col-7">${record.physicalDamage === 'si' ? 'Sí' : 'No'}</dd>
            </dl>
            <hr>
            <div class="small fw-semibold mb-1">Memo / Observaciones</div>
            <p class="small mb-0">${this.escape(record.memo)}</p>
        `;
        new bootstrap.Modal(document.getElementById('returnDetailModal')).show();
    },

    escape(value) {
        const div = document.createElement('div');
        div.textContent = value || '';
        return div.innerHTML;
    },

    escapeAttr(value) {
        return this.escape(value).replace(/"/g, '&quot;');
    }
};
