/**
 * XTREME MOBILE - Tour Guiado del Panel de Administración
 * Muestra un recorrido paso a paso resaltando las partes del panel
 * con una pantalla oscura y "spotlight" sobre cada elemento.
 */
const Tour = {
    currentIndex: 0,
    active: false,

    steps: [
        {
            target: '#sidebar',
            title: 'Menú de Navegación',
            description: 'Este es el menú lateral. Desde aquí puedes moverte entre las secciones del sistema: Dashboard, Inventario, Accesorios, Inventario General, Horarios, Historial y Usuarios.',
            placement: 'right'
        },
        {
            target: '#page-dashboard .stat-card:nth-child(1)',
            title: 'Estadísticas del Dashboard',
            description: 'Aquí verás los indicadores principales de tu negocio: total de productos, stock disponible, valor total del inventario y categorías registradas.',
            placement: 'bottom'
        },
        {
            target: '.top-bar',
            title: 'Barra Superior',
            description: 'En la barra superior se muestra el título de la sección actual y la fecha/hora en tiempo real de Puerto Rico.',
            placement: 'bottom'
        },
        {
            target: '#tickerBar',
            title: 'Aviso en Movimiento',
            description: 'Este texto se desplaza continuamente. Recuerda: cada vez que vendas algún equipo, regístralo aquí para llevar el conteo correcto.',
            placement: 'bottom'
        },
        {
            target: '.sidebar .nav-link[data-page="inventario"]',
            title: 'Registro de Ventas e Inventario',
            description: 'Al hacer clic en "Inventario" podrás agregar, editar y ajustar el stock de cada equipo. Registra cada venta para mantener el conteo correcto.',
            placement: 'right'
        }
    ],

    init() {
        document.getElementById('welcomeTourBtn').addEventListener('click', () => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('welcomeModal'));
            if (modal) modal.hide();
            this.start();
        });

        document.getElementById('welcomeSkipBtn').addEventListener('click', () => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('welcomeModal'));
            if (modal) modal.hide();
            this.markSeen();
        });

        document.getElementById('tourNextBtn').addEventListener('click', () => this.next());
        document.getElementById('tourPrevBtn').addEventListener('click', () => this.prev());
        document.getElementById('tourSkipBtn').addEventListener('click', () => this.end());
    },

    // Se muestra el modal de bienvenida solo la primera vez por usuario
    showWelcomeIfNew() {
        const user = Auth.getCurrentUser();
        if (!user) return;
        const key = 'xtrem_tour_seen_' + user.id;
        if (localStorage.getItem(key)) return;
        const modal = new bootstrap.Modal(document.getElementById('welcomeModal'));
        modal.show();
    },

    markSeen() {
        const user = Auth.getCurrentUser();
        if (!user) return;
        localStorage.setItem('xtrem_tour_seen_' + user.id, '1');
    },

    getTarget(step) {
        return document.querySelector(step.target);
    },

    start() {
        this.currentIndex = 0;
        this.active = true;
        const overlay = document.getElementById('tourOverlay');
        overlay.classList.remove('d-none');
        document.body.style.overflow = 'hidden';
        this.renderStep();
    },

    renderStep() {
        const step = this.steps[this.currentIndex];
        const target = this.getTarget(step);
        if (!target) {
            this.end();
            return;
        }

        // Actualizar contenido del tooltip
        document.getElementById('tourStepBadge').textContent = (this.currentIndex + 1) + ' / ' + this.steps.length;
        document.getElementById('tourTitle').textContent = step.title;
        document.getElementById('tourDescription').textContent = step.description;

        // Botón siguiente / terminar
        const nextBtn = document.getElementById('tourNextBtn');
        if (this.currentIndex === this.steps.length - 1) {
            nextBtn.innerHTML = 'Finalizar<i class="bi bi-check-lg ms-1"></i>';
        } else {
            nextBtn.innerHTML = 'Siguiente<i class="bi bi-chevron-right ms-1"></i>';
        }

        // Botón anterior
        document.getElementById('tourPrevBtn').style.visibility = this.currentIndex === 0 ? 'hidden' : 'visible';

        // Posicionar el spotlight sobre el elemento
        this.positionSpotlight(target);
        this.positionTooltip(target, step.placement);
    },

    positionSpotlight(target) {
        const spotlight = document.getElementById('tourSpotlight');
        const rect = target.getBoundingClientRect();

        spotlight.style.display = 'block';
        spotlight.style.width = Math.max(rect.width, 50) + 'px';
        spotlight.style.height = Math.max(rect.height, 40) + 'px';
        spotlight.style.left = rect.left + 'px';
        spotlight.style.top = rect.top + 'px';
    },

    positionTooltip(target, placement) {
        const tooltip = document.getElementById('tourTooltip');
        const rect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const margin = 16;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let left = 0;
        let top = 0;

        switch (placement) {
            case 'right':
                left = rect.right + margin;
                top = rect.top + rect.height / 2 - tooltipRect.height / 2;
                break;
            case 'bottom':
                left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                top = rect.bottom + margin;
                break;
            case 'left':
                left = rect.left - tooltipRect.width - margin;
                top = rect.top + rect.height / 2 - tooltipRect.height / 2;
                break;
            case 'top':
            default:
                left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                top = rect.top - tooltipRect.height - margin;
                break;
        }

        // Ajustar para que el tooltip no se salga de la pantalla
        if (left < 10) left = 10;
        if (left + tooltipRect.width > vw - 10) left = vw - tooltipRect.width - 10;
        if (top < 10) top = 10;
        if (top + tooltipRect.height > vh - 10) top = vh - tooltipRect.height - 10;

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    },

    next() {
        if (this.currentIndex < this.steps.length - 1) {
            this.currentIndex++;
            this.renderStep();
        } else {
            this.end();
        }
    },

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.renderStep();
        }
    },

    end() {
        this.active = false;
        const overlay = document.getElementById('tourOverlay');
        overlay.classList.add('d-none');
        document.getElementById('tourSpotlight').style.display = 'none';
        document.body.style.overflow = '';
        this.markSeen();
    }
};
