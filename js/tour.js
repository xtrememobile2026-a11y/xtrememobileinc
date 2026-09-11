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
            title: '¡Bienvenido a XTREME MOBILE!',
            description: 'Este es el menú lateral. Desde aquí te mueves entre todas las secciones del sistema. Vamos a recorrer las más importantes en menos de un minuto.',
            placement: 'right'
        },
        {
            target: '.top-bar',
            title: 'Barra Superior y Aviso',
            description: 'Arriba ves la sección en la que estás y la hora actual de Puerto Rico. Justo debajo, el aviso en movimiento te recuerda registrar cada venta para mantener el conteo correcto.',
            placement: 'bottom'
        },
        {
            target: '.gov-phones-banner',
            title: 'Meta de Teléfonos del Gobierno',
            description: 'Este panel muestra cuántos Teléfonos del Gobierno se han entregado este mes, con una meta de 30. Se actualiza solo cada vez que registras una venta de ese tipo.',
            placement: 'bottom'
        },
        {
            target: '#page-dashboard .stat-card:nth-child(1)',
            title: 'Estadísticas del Dashboard',
            description: 'Aquí verás los indicadores principales: total de productos, stock disponible, valor total del inventario y categorías registradas.',
            placement: 'bottom'
        },
        {
            target: '.sidebar .nav-link[data-page="inventario"]',
            title: 'Inventario',
            description: 'Agrega, edita y ajusta el stock de cada equipo. El campo "IVU" es el monto que paga el cliente por sacar el equipo. Si ves el stock en naranja, significa que el producto está a punto de llegar a Stock Bajo.',
            placement: 'right'
        },
        {
            target: '.sidebar .nav-link[data-page="ventas"]',
            title: 'Ventas',
            description: 'Busca y añade productos a un carrito, revisa el historial de ventas por fecha y vendedor, y haz el cuadre de caja (conteo de billetes y monedas) al cierre.',
            placement: 'right'
        },
        {
            target: '.sidebar .nav-link[data-page="compras"]',
            title: 'Compras (Nuevo)',
            description: 'El sistema revisa cada 10 minutos si algún producto se agotó y lo coloca aquí para encargarlo, junto con los productos que están por acabarse. Ideal para saber qué comprar.',
            placement: 'right'
        },
        {
            target: '.sidebar-user',
            title: 'Empleado del Mes',
            description: 'Si eres quien más ha vendido (en Q) este mes, verás una estrella dorada junto a tu nombre aquí y en la lista de Usuarios. ¡Se actualiza automáticamente!',
            placement: 'right'
        },
        {
            target: '#openProfileBtn',
            title: 'Mi Perfil',
            description: 'Presiona este ícono para editar tu nombre, correo o cambiar tu contraseña cuando quieras.',
            placement: 'right'
        },
        {
            target: '#supportNavBtn',
            title: 'Soporte Técnico y Actualizaciones',
            description: 'Aquí encuentras preguntas frecuentes y puedes reportar un problema (por ejemplo, si olvidaste tu contraseña). Un poco más abajo, "Actualizaciones" te muestra las novedades del sistema.',
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
        const el = document.querySelector(step.target);
        if (!el) return null;
        // Si el elemento (o algún ancestro) está oculto por CSS -por ejemplo, "Compras"
        // para un usuario sin acceso a esa sección- no se puede resaltar en el tour.
        if (el.getClientRects().length === 0) return null;
        return el;
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
        // Salta automáticamente los pasos cuyo elemento esté oculto para este usuario
        // (por ejemplo, por sus permisos), en vez de terminar el tour de golpe.
        let guard = 0;
        while (!this.getTarget(this.steps[this.currentIndex]) && guard < this.steps.length) {
            if (this.currentIndex < this.steps.length - 1) {
                this.currentIndex++;
            } else {
                this.end();
                return;
            }
            guard++;
        }

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
