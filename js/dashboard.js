/**
 * XTREM MOBILE - Dashboard Module
 * Maneja estadísticas, gráficos y visualizaciones
 */

const Dashboard = {
    chartCategory: null,
    chartPie: null,

    init() {
        this.update();
    },

    update() {
        const stats = DataStore.getStats();

        // Update stat cards
        document.getElementById('statTotalProducts').textContent = stats.totalProducts;
        document.getElementById('statTotalStock').textContent = stats.totalStock;
        document.getElementById('statTotalValue').textContent = `Q${stats.totalValue.toFixed(2)}`;
        document.getElementById('statCategories').textContent = stats.activeCategories;
        document.getElementById('statAvgStock').textContent = stats.averageStock;

        // Update charts
        this.updateCategoryChart(stats);
        this.updatePieChart(stats);

        // Update tables
        this.updateTopProducts(stats.topProducts);
        this.updateRecentProducts(stats.recentProducts);

        // Meta de Teléfonos del Gobierno
        this.updateGovPhonesGoal();

        // Notificaciones de stock bajo en el menú lateral
        if (typeof App !== 'undefined' && App.updateStockAlertBadges) App.updateStockAlertBadges();
    },

    // Determina si una venta corresponde a un "Teléfono del Gobierno". Las ventas nuevas
    // guardan la categoría directamente; para ventas antiguas se busca el producto o,
    // si ya no existe, se revisa el nombre como último respaldo.
    isGovPhoneSale(sale) {
        if (sale.category) return sale.category === 'TELEFONOS DEL GOBIERNO';
        const product = DataStore.getProductById(sale.productId);
        if (product && product.category) return product.category === 'TELEFONOS DEL GOBIERNO';
        return (sale.productName || '').toLowerCase().includes('gobierno');
    },

    updateGovPhonesGoal() {
        const countEl = document.getElementById('govPhonesCount');
        if (!countEl) return;

        const GOAL = 30;
        const sales = DataStore.getSales();
        const now = new Date();
        const y = now.getFullYear(), m = now.getMonth();

        let given = 0;
        sales.forEach(s => {
            if (!s.createdAt) return;
            const d = new Date(s.createdAt);
            if (d.getFullYear() !== y || d.getMonth() !== m) return;
            if (!this.isGovPhoneSale(s)) return;
            given += parseInt(s.quantity) || 1;
        });

        const pct = Math.min(100, Math.round((given / GOAL) * 100));
        const barEl = document.getElementById('govPhonesProgressBar');
        const statusEl = document.getElementById('govPhonesStatusText');
        const monthEl = document.getElementById('govPhonesMonthLabel');

        countEl.textContent = given;
        barEl.style.width = pct + '%';
        barEl.setAttribute('aria-valuenow', pct);
        barEl.classList.toggle('gov-goal-reached', given >= GOAL);

        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        monthEl.textContent = monthNames[m] + ' ' + y;

        if (given === 0) {
            statusEl.innerHTML = 'Aún no se ha registrado ninguno este mes';
        } else if (given >= GOAL) {
            statusEl.innerHTML = '<i class="bi bi-trophy-fill me-1"></i>¡Meta alcanzada este mes!';
        } else {
            statusEl.textContent = `Faltan ${GOAL - given} para llegar a la meta de ${GOAL}`;
        }
    },

    updateCategoryChart(stats) {
        const ctx = document.getElementById('chartCategory').getContext('2d');
        
        const categories = DataStore.getCategories();
        const values = categories.map(cat => stats.categoryCount[cat] || 0);
        const colors = [
            '#DC3545', '#0d6efd', '#198754', '#ffc107', 
            '#0dcaf0', '#6f42c1', '#fd7e14'
        ];

        if (this.chartCategory) {
            this.chartCategory.destroy();
        }

        this.chartCategory = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories.map(c => c.charAt(0) + c.slice(1).toLowerCase()),
                datasets: [{
                    label: 'Cantidad de Productos',
                    data: values,
                    backgroundColor: colors.map(c => c + '80'),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 8,
                    barPercentage: 0.7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: { size: 11 }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            font: { size: 10 }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    updatePieChart(stats) {
        const ctx = document.getElementById('chartPie').getContext('2d');

        const labels = ['Nuevo', 'Seminuevo', 'Usado'];
        const values = [
            stats.statusCount['Nuevo'] || 0,
            stats.statusCount['Seminuevo'] || 0,
            stats.statusCount['Usado'] || 0
        ];
        const colors = ['#198754', '#ffc107', '#DC3545'];

        if (this.chartPie) {
            this.chartPie.destroy();
        }

        this.chartPie = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderColor: '#fff',
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 11 },
                            padding: 12,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                },
                cutout: '65%'
            }
        });
    },

    updateTopProducts(products) {
        const tbody = document.getElementById('topProductsTable');
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No hay datos disponibles</td></tr>';
            return;
        }

        tbody.innerHTML = products.map((p, idx) => `
            <tr>
                <td class="fw-bold">${idx + 1}</td>
                <td>${this.escapeHtml(p.model)}</td>
                <td><span class="badge bg-danger bg-opacity-10 text-danger">${this.escapeHtml(p.category)}</span></td>
                <td><span class="badge bg-dark">${parseInt(p.stock)}</span></td>
            </tr>
        `).join('');
    },

    updateRecentProducts(products) {
        const tbody = document.getElementById('recentProductsTable');
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No hay datos disponibles</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(p => {
            const date = p.entryDate || p.createdAt.split('T')[0] || '-';
            return `
                <tr>
                    <td class="fw-semibold">${this.escapeHtml(p.model)}</td>
                    <td><span class="badge bg-danger bg-opacity-10 text-danger">${this.escapeHtml(p.category)}</span></td>
                    <td class="fw-bold">Q${parseFloat(p.price).toFixed(2)}</td>
                    <td><small class="text-muted">${date}</small></td>
                </tr>
            `;
        }).join('');
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
