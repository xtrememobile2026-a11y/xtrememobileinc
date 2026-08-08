/**
 * XTREM MOBILE - Export Module
 * Maneja exportación a PDF, copiado de texto e impresión de recibos profesionales
 */

const Export = {
    init() {
        document.getElementById('exportPdfBtn').addEventListener('click', () => this.exportToPdf());
        document.getElementById('copyTextBtn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('printInventoryBtn').addEventListener('click', () => Receipt.printInventory());
        document.getElementById('printAccesoriesBtn').addEventListener('click', () => Receipt.printAccesories());
        document.getElementById('printSuppliesBtn').addEventListener('click', () => Receipt.printSupplies());
    },

    getCurrentProducts() {
        // Get whatever is currently displayed in the table
        return Inventory.filteredProducts.length > 0 ? Inventory.filteredProducts : DataStore.getProducts();
    },

    exportToPdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'letter'
        });

        const products = this.getCurrentProducts();
        const currentUser = Auth.getCurrentUser();
        const dateStr = new Date().toLocaleString('es-PR', {
            timeZone: 'America/Puerto_Rico',
            dateStyle: 'long',
            timeStyle: 'short'
        });

        // Header
        doc.setFillColor(220, 53, 69);
        doc.rect(0, 0, 297, 30, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('XTREME MOBILE INC. - INVENTARIO', 14, 12);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Tel: 787-205-2220', 14, 18);
        doc.text('Generado por: ' + currentUser.fullName + ' (' + (currentUser.role || '') + ') | ' + dateStr, 14, 24);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text('Total: ' + products.length + ' productos', 270, 22, { align: 'right' });

        // Category summary
        let yPos = 38;
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('RESUMEN POR CATEGORIA', 14, yPos);

        yPos += 6;
        const categories = DataStore.getCategories();
        const summary = categories.map(cat => {
            const count = products.filter(p => p.category === cat).length;
            return { category: cat, count };
        }).filter(s => s.count > 0);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const summaryText = summary.map(s => s.category + ': ' + s.count).join(' | ');
        doc.text(summaryText, 14, yPos);

        // Table
        yPos += 6;
        const tableData = products.map((p, idx) => [
            idx + 1,
            p.model || '-',
            p.category || '-',
            p.imei || '-',
            p.color || '-',
            p.storage || '-',
            'Q' + parseFloat(p.price).toFixed(2),
            parseInt(p.stock) || 0,
            p.status || '-',
            p.entryDate || '-'
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['#', 'Modelo', 'Categoria', 'IMEI', 'Color', 'Almac.', 'Precio', 'Stock', 'Estado', 'Fecha']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [220, 53, 69],
                fontSize: 8,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 7,
                cellPadding: 2
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            columnStyles: {
                0: { cellWidth: 8, halign: 'center' },
                1: { cellWidth: 35 },
                2: { cellWidth: 30 },
                3: { cellWidth: 30 },
                4: { cellWidth: 20 },
                5: { cellWidth: 18 },
                6: { cellWidth: 22, halign: 'right' },
                7: { cellWidth: 14, halign: 'center' },
                8: { cellWidth: 20, halign: 'center' },
                9: { cellWidth: 22, halign: 'center' }
            },
            margin: { left: 10, right: 10 }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text('XTREME MOBILE INC. - Tel: 787-205-2220 - Pagina ' + i + ' de ' + pageCount, 14, 205);
            doc.text('(c) ' + new Date().getFullYear() + ' XTREME MOBILE INC. - Todos los derechos reservados', 270, 205, { align: 'right' });
        }

        doc.save('INVENTARIO_XTREME_' + new Date().toISOString().split('T')[0] + '.pdf');
        App.showToast('PDF exportado exitosamente', 'success');
    },

    copyToClipboard() {
        const products = this.getCurrentProducts();
        const currentUser = Auth.getCurrentUser();
        const dateStr = new Date().toLocaleString('es-PR', {
            timeZone: 'America/Puerto_Rico',
            dateStyle: 'long',
            timeStyle: 'short'
        });

        let text = '';
        text += 'XTREME MOBILE INC.\n';
        text += 'Tel: 787-205-2220\n';
        text += '========================\n';
        text += 'Usuario: ' + currentUser.fullName + ' (' + (currentUser.role || '') + ') | ' + dateStr + '\n';
        text += 'Total: ' + products.length + ' productos\n';
        text += '========================\n\n';

        if (products.length === 0) {
            text += 'No hay productos registrados.\n';
        } else {
            // Agrupar por categoria
            const grouped = {};
            products.forEach(p => {
                const cat = p.category || 'OTROS';
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push(p);
            });

            Object.keys(grouped).forEach(cat => {
                text += cat + '\n';
                text += '------------------------\n';
                grouped[cat].forEach((p) => {
                    const model = p.model || '-';
                    const color = p.color ? ' ' + p.color : '';
                    const stock = parseInt(p.stock) || 0;
                    text += stock + ' - ' + model + color + '\n';
                });
                text += '\n';
            });
        }

        text += '========================\n';
        text += '(c) ' + new Date().getFullYear() + ' XTREME MOBILE INC.\n';

        navigator.clipboard.writeText(text).then(() => {
            App.showToast('Texto copiado al portapapeles', 'success');
        }).catch(() => {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            App.showToast('Texto copiado al portapapeles', 'success');
        });
    }
};

/**
 * Módulo de Recibo Térmico para impresión
 * Diseñado para impresoras térmicas de 80mm (Star TSP100 / TSP143).
 * Muestra únicamente: cantidad restante, modelo y color,
 * junto con el nombre de la empresa, teléfono y la persona que imprimió.
 * Texto grande para máxima legibilidad.
 */
const Receipt = {
    COMPANY: 'XTREME MOBILE INC.',
    PHONE: '787-205-2220',

    // Escapar HTML
    esc(value) {
        const div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML;
    },

    // Formatea fecha y hora (Puerto Rico)
    formatDateTime() {
        const now = new Date();
        const date = now.toLocaleDateString('es-PR', { timeZone: 'America/Puerto_Rico', day: '2-digit', month: '2-digit', year: 'numeric' });
        const time = now.toLocaleTimeString('es-PR', { timeZone: 'America/Puerto_Rico', hour: '2-digit', minute: '2-digit' });
        return { date, time };
    },

    // Encabezado: empresa, teléfono, fecha/hora y persona que imprime
    buildHeader(title) {
        const user = Auth.getCurrentUser();
        const { date, time } = this.formatDateTime();
        return `
            <div class="th-company">${this.COMPANY}</div>
            <div class="th-phone">${this.PHONE}</div>
            <div class="th-sep">- - - - - - - - - - - - - - - - - - - - - -</div>
            <div class="th-title">${title}</div>
            <div class="th-meta">Fecha: ${date}  Hora: ${time}</div>
            <div class="th-user">Impreso por: ${this.esc(user ? user.fullName : 'Sistema')}</div>
            <div class="th-sep">=================================</div>
        `;
    },

    // Genera el pie del recibo
    buildFooter(totalLabel, totalValue) {
        return `
            <div class="th-sep">=================================</div>
            <div class="th-total">
                <span>${totalLabel}</span>
                <span>${totalValue}</span>
            </div>
            <div class="th-sep">- - - - - - - - - - - - - - - - - - - - - -</div>
            <div class="th-footer">${this.COMPANY}</div>
            <div class="th-footer">${this.PHONE}</div>
        `;
    },

    // Construye las líneas del recibo: cantidad = stock, modelo y color
    buildItems(items, emptyMsg) {
        if (items.length === 0) {
            return `<div class="th-empty">${emptyMsg}</div>`;
        }
        return items.map(item => {
            const detail = item.detail ? ' (' + this.esc(item.detail) + ')' : '';
            return `
                <div class="th-line">
                    <span class="th-qty">${item.qty}</span>
                    <span class="th-item">${this.esc(item.name)}${detail}</span>
                </div>
            `;
        }).join('');
    },

    // ===== IMPRESIÓN DE INVENTARIO (Celulares) =====
    printInventory() {
        const products = Inventory.filteredProducts.length > 0 ? Inventory.filteredProducts : DataStore.getProducts().filter(p => p.category !== 'ACCESORIOS');
        const title = 'INVENTARIO CELULARES';
        const total = products.length;

        const items = products.map(p => ({
            qty: parseInt(p.stock) || 0,
            name: p.model,
            detail: p.color || ''
        }));

        const html = `
            <div class="receipt">
                ${this.buildHeader(title)}
                ${this.buildItems(items, 'No hay productos registrados')}
                ${this.buildFooter('Total Productos:', total)}
            </div>
        `;

        this.renderAndPrint(html);
    },

    // ===== IMPRESIÓN DE ACCESORIOS =====
    printAccesories() {
        const accesories = Inventory.getFilteredAccesories();
        const title = 'INVENTARIO ACCESORIOS';
        const total = accesories.length;

        const items = accesories.map(p => ({
            qty: parseInt(p.stock) || 0,
            name: p.model,
            detail: p.color || ''
        }));

        const html = `
            <div class="receipt">
                ${this.buildHeader(title)}
                ${this.buildItems(items, 'No hay accesorios registrados')}
                ${this.buildFooter('Total Accesorios:', total)}
            </div>
        `;

        this.renderAndPrint(html);
    },

    // ===== IMPRESIÓN DE INVENTARIO GENERAL (Suministros) =====
    printSupplies() {
        const supplies = App.getFilteredSupplies();
        const title = 'INVENTARIO GENERAL';
        const total = supplies.length;

        const items = supplies.map(s => ({
            qty: parseInt(s.quantity) || 0,
            name: s.name,
            detail: s.unit || ''
        }));

        const html = `
            <div class="receipt">
                ${this.buildHeader(title)}
                ${this.buildItems(items, 'No hay suministros registrados')}
                ${this.buildFooter('Total Suministros:', total)}
            </div>
        `;

        this.renderAndPrint(html);
    },

    // Renderiza el recibo y dispara la impresión
    renderAndPrint(html) {
        const container = document.getElementById('printReceipt');
        container.innerHTML = html;

        // Disparar impresión
        window.print();

        // Limpiar después de imprimir
        setTimeout(() => {
            container.innerHTML = '';
        }, 1000);
    }
};
