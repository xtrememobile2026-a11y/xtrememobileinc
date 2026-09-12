/**
 * XTREM MOBILE - Main Application Controller
 * Maneja la navegación, eventos globales y orquestación
 */

const APP_VERSION = '1.0.0';
const APP_VERSION_DATE = '2026-09-11';

const App = {
    toastInstance: null,

    async init() {
        // Loading screen
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
        }, 800);

        // Check session
        if (Auth.init()) {
            // Esperar a que DataStore (roles/permisos incluidos) termine de cargar
            // antes de construir el menú, para no ocultarlo por una carrera con Supabase.
            if (DataStore.readyPromise) await DataStore.readyPromise;
            this.showMainApp();
        }

// Setup events (but NOT initModules - that's only for main app)
        this.setupAuthEvents();
        this.setupNavigation();
        this.setupClock();
        Tour.init();
    },

    setupAuthEvents() {
        // Toggle password visibility
        document.getElementById('togglePassword').addEventListener('click', () => {
            const input = document.getElementById('loginPassword');
            const icon = document.querySelector('#togglePassword i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('bi-eye', 'bi-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('bi-eye-slash', 'bi-eye');
            }
        });

        // Login form submit
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            console.log('Login attempt:', username, password);

            const result = await Auth.login(username, password);
            console.log('Login result:', result);
            if (result.success) {
                this.showMainApp();
                await this.logHistory('Inicio de sesión', `El usuario "${username}" inició sesión correctamente`);
            } else {
                const errorEl = document.getElementById('loginError');
                errorEl.textContent = result.message;
                errorEl.classList.remove('d-none');
            }
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', async (e) => {
            e.preventDefault();
            const user = Auth.getCurrentUser();
            if (user) {
                await this.logHistory('Cierre de sesión', `El usuario "${user.fullName}" cerró sesión`);
            }
            Auth.logout();
            // Recargar la página por completo (en vez de solo ocultar/mostrar secciones) para
            // garantizar que ningún listener de botones quede duplicado si luego alguien inicia
            // sesión de nuevo en la misma pestaña. Sin esto, cada inicio de sesión repetía la
            // configuración de TODOS los botones (Completar Venta, Guardar, etc.), causando que
            // un solo clic disparara la acción varias veces.
            location.reload();
        });

        // Admin password verification
        document.getElementById('verifyAdminBtn').addEventListener('click', () => {
            const passInput = document.getElementById('adminPassInput');
            const errorEl = document.getElementById('adminPassError');
            const adminUser = DataStore.getUsers().find(u => u.role === 'Administrador');
            
            if (adminUser && passInput.value === adminUser.password) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('adminPassModal'));
                modal.hide();
                errorEl.classList.add('d-none');
                if (this.pendingPage) {
                    this.showPage(this.pendingPage);
                    this.pendingPage = null;
                }
            } else {
                errorEl.textContent = 'Contraseña de administrador incorrecta';
                errorEl.classList.remove('d-none');
                passInput.value = '';
                passInput.focus();
            }
        });

        // Admin password modal - enter key
        document.getElementById('adminPassInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('verifyAdminBtn').click();
            }
        });
    },

    setupNavigation() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar .nav-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateTo(page);
                
                // Close sidebar on mobile
                if (window.innerWidth < 768) {
                    document.getElementById('sidebar').classList.remove('show');
                }
            });
        });

        // Sidebar toggle (mobile)
        document.getElementById('toggleSidebar').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('show');
        });

        document.getElementById('closeSidebar').addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('show');
        });
    },

    pendingPage: null,

navigateTo(page) {
        const user = Auth.getCurrentUser();
        const status = Permissions.getEffectiveAreaStatus(user, page);

        if (status !== 'full') {
            const name = user ? user.fullName : 'usuario';
            const title = Permissions.AREA_LABELS[page] || 'Esta sección';
            if (status === 'soon') {
                App.showToast(`La sección "${title}" estará disponible próximamente para ${name}. ¡Gracias por tu paciencia!`, 'error');
            } else {
                App.showToast(`No tienes acceso a la sección "${title}". Contacta al administrador si crees que esto es un error.`, 'error');
            }
            return;
        }

        this.showPage(page);
    },

    showPage(page) {
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(p => p.classList.add('d-none'));

        // Show target page
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) {
            targetPage.classList.remove('d-none');
        }

        // Refresh data of the page being shown
        try {
            if (page === 'horarios') {
                this.renderScheduleCalendar();
            } else if (page === 'ventas') {
                POS.onPageShow();
            } else if (page === 'historial') {
                this.renderHistoryTable();
            } else if (page === 'inventario') {
                Inventory.renderTable();
            } else if (page === 'accesorios') {
                Inventory.renderAccesoriesTable();
            } else if (page === 'dashboard') {
                Dashboard.update();
            } else if (page === 'sql-editor') {
                this.setupSqlEditor();
            } else if (page === 'areas-usuarios') {
                RolesAdmin.onPageShow();
            } else if (page === 'usuarios') {
                this.renderUsersTable();
            } else if (page === 'actualizaciones') {
                this.renderUpdatesPage();
            } else if (page === 'compras') {
                Purchases.onPageShow();
            } else if (page === 'inventario-general') {
                this.renderSuppliesTable();
            }
        } catch (e) {
            console.error('Error updating page data:', e);
        }

        // Update sidebar active state
        document.querySelectorAll('.sidebar .nav-link[data-page]').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            inventario: 'Inventario de Celulares',
            accesorios: 'Accesorios',
            'inventario-general': 'Inventario General',
            horarios: 'Horarios de Empleados',
            ventas: 'Ventas',
            historial: 'Historial de Actividad',
            usuarios: 'Usuarios del Sistema',
            'sql-editor': 'Editor SQL',
            'areas-usuarios': 'Áreas de Usuarios',
            'actualizaciones': 'Actualizaciones',
            'compras': 'Compras'
        };
        document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';
    },

    showMainApp() {
        const user = Auth.getCurrentUser();
        if (user) {
            document.getElementById('sidebarUserName').textContent = user.fullName || user.username || 'Usuario';
            document.getElementById('sidebarUserRole').textContent = user.role || 'Usuario';
            document.getElementById('userAvatar').textContent = (user.fullName || user.username || 'U').charAt(0).toUpperCase();
            this.updateSidebarStar();
        }

        document.getElementById('loginPage').classList.add('d-none');
        document.getElementById('mainApp').classList.remove('d-none');

        // Aplicar permisos del menú según el rol (restricciones para ciertas secciones)
        this.applyMenuPermissions();
        
        // Initialize modules
        this.initModules().then(() => {
            this.navigateTo('dashboard');
        });

        // Show welcome popup for new users
        Tour.showWelcomeIfNew();
    },

    // Cada ítem del menú se muestra, se marca "Próx." o se oculta según el acceso
    // efectivo del usuario a esa área (rol + ajustes individuales en "Áreas de Usuarios").
    applyMenuPermissions() {
        const user = Auth.getCurrentUser();
        document.querySelectorAll('.sidebar .nav-link[data-page]').forEach(link => {
            const page = link.dataset.page;
            const li = link.closest('.nav-item');
            const badge = link.querySelector('.soon-badge');
            const status = Permissions.getEffectiveAreaStatus(user, page);

            if (!li) return;
            li.style.display = status === 'none' ? 'none' : '';
            if (badge) badge.style.display = status === 'soon' ? '' : 'none';
        });
    },

    async initModules() {
        if (typeof SupabaseService !== 'undefined') {
            await SupabaseService.init();
        }
        
        Dashboard.init();
        Inventory.init();
        await DataStore.seedAccessoryTemplates();
        Export.init();
        await this.setupUsers();
        await this.setupSupplies();
        await this.setupSchedule();
        await this.setupHistory();
        POS.init();
        Purchases.init();
        RolesAdmin.init();
        this.setupSupportModal();
        this.setupProfileModal();
        Inventory.setupAccesories();
        this.updateStockAlertBadges();
        this.startAutoSync();
    },

    // Cada 10 segundos: (1) reintenta subir a Supabase cualquier dato local que no
    // haya logrado sincronizarse todavía (por ejemplo, por un corte de conexión o un
    // permiso que se corrigió después), y (2) revisa si hay cambios nuevos hechos desde
    // otro dispositivo/usuario y refresca la pantalla actual sin interrumpir al usuario.
    startAutoSync() {
        if (this._autoSyncTimer) return;
        this._autoSyncTimer = setInterval(async () => {
            if (typeof SupabaseService !== 'undefined' && SupabaseService.isConnected()) {
                await SupabaseService.migrateAllData();
                await SupabaseService.syncFromSupabase();
                this.refreshSessionFromLocalData();
                this.refreshCurrentPageData();
            }
        }, 10000);
    },

    // Si el usuario que tiene la sesión abierta en ESTE dispositivo cambió sus propios
    // datos (nombre, usuario, rol o contraseña) desde OTRO dispositivo, esto mantiene la
    // sesión local al día en vez de dejarla con la copia vieja de cuando inició sesión.
    refreshSessionFromLocalData() {
        const current = Auth.getCurrentUser();
        if (!current) return;
        const fresh = DataStore.getUsers().find(u => u.id === current.id);
        if (fresh && JSON.stringify(fresh) !== JSON.stringify(current)) {
            Auth.currentUser = fresh;
            localStorage.setItem('xtrem_session', JSON.stringify(fresh));
            const nameEl = document.getElementById('sidebarUserName');
            if (nameEl) nameEl.textContent = fresh.fullName || fresh.username;
            const roleEl = document.getElementById('sidebarUserRole');
            if (roleEl) roleEl.textContent = fresh.role || '';
            const avatarEl = document.getElementById('userAvatar');
            if (avatarEl) avatarEl.textContent = (fresh.fullName || fresh.username || 'U').charAt(0).toUpperCase();
        }
    },

    // Fuerza una subida completa de todo lo guardado localmente a Supabase ahora mismo
    // (en vez de esperar al próximo ciclo de 10 segundos). Solo para el superadministrador.
    async forceFullSync() {
        if (typeof SupabaseService === 'undefined' || !SupabaseService.isConnected()) {
            App.showToast('No hay conexión con Supabase en este momento', 'error');
            return;
        }
        App.showToast('Sincronizando con Supabase...', 'success');
        const result = await SupabaseService.migrateAllData();
        await SupabaseService.syncFromSupabase();
        this.refreshCurrentPageData();

        console.log('Resultado de sincronización:', result);

        if (result.ok) {
            const c = result.localCounts;
            const resumen = c ? ` (localmente: ${c.sales} ventas, ${c.history} historial, ${c.roles} roles)` : '';
            App.showToast('Sincronización completa exitosa' + resumen, 'success');
        } else {
            App.showToast('Fallaron: ' + (result.details ? result.details.join(' | ') : result.failed.join(', ')), 'error');
        }
    },

    refreshCurrentPageData() {
        const activeLink = document.querySelector('.sidebar .nav-link.active[data-page]');
        const page = activeLink ? activeLink.dataset.page : null;
        try {
            if (page === 'horarios') this.renderScheduleCalendar();
            else if (page === 'ventas') POS.onPageShow();
            else if (page === 'historial') this.renderHistoryTable();
            else if (page === 'inventario') Inventory.renderTable();
            else if (page === 'accesorios') Inventory.renderAccesoriesTable();
            else if (page === 'dashboard') Dashboard.update();
            else if (page === 'areas-usuarios') RolesAdmin.onPageShow();
            else if (page === 'usuarios') this.renderUsersTable();
            else if (page === 'compras') Purchases.onPageShow();
            else if (page === 'inventario-general') this.renderSuppliesTable();
        } catch (e) {
            console.error('Error refrescando datos de la página:', e);
        }
        this.updateStockAlertBadges();
    },

    setupClock() {
        const updateClock = () => {
            const now = new Date();
            const options = {
                timeZone: 'America/Puerto_Rico',
                dateStyle: 'medium',
                timeStyle: 'medium'
            };
            document.getElementById('currentDateTime').textContent = now.toLocaleString('es-PR', options);
        };
        updateClock();
        setInterval(updateClock, 1000);
    },

    async setupUsers() {
        document.getElementById('addUserBtn').addEventListener('click', () => {
            document.getElementById('userModalTitle').innerHTML = '<i class="bi bi-person-plus me-2"></i>Nuevo Usuario';
            document.getElementById('userForm').reset();
            document.getElementById('userId').value = '';
            document.getElementById('userPassword').required = true;
            document.querySelector('#userModal .text-muted').style.display = 'none';
            this.populateUserRoleSelect('role_vendedor');
            const modal = new bootstrap.Modal(document.getElementById('userModal'));
            modal.show();
        });

        document.getElementById('saveUserBtn').addEventListener('click', async () => {
            const id = document.getElementById('userId').value;
            const roleId = document.getElementById('userRole').value;
            const roleObj = Permissions.getRoleById(roleId);
            const data = {
                fullName: document.getElementById('userFullName').value.trim(),
                username: document.getElementById('userUsername').value.trim(),
                email: document.getElementById('userEmail').value.trim(),
                password: document.getElementById('userPassword').value,
                roleId: roleId,
                role: roleObj ? roleObj.name : 'Vendedor'
            };

            if (!data.fullName || !data.username || !data.email) {
                App.showToast('Por favor complete todos los campos obligatorios', 'error');
                return;
            }

            if (id) {
                const existingUser = DataStore.getUsers().find(u => u.id === id);
                if (existingUser && (existingUser.id === 'usr_angel' || existingUser.username.toLowerCase() === 'angel')) {
                    data.roleId = 'role_admin_prog';
                    data.role = 'Administrador de programación';
                    data.fullName = 'ANGEL A. COLON NEGRON';
                }
                const updateData = { fullName: data.fullName, username: data.username, email: data.email, roleId: data.roleId, role: data.role };
                if (data.password) updateData.password = data.password;
                await DataStore.updateUser(id, updateData);
                await this.logHistory('Edición de usuario', `Se editó el usuario "${data.username}" (nombre: ${data.fullName}, correo: ${data.email}, rol: ${data.role})`);

                const currentUser = Auth.getCurrentUser();
                if (currentUser && currentUser.id === id) {
                    const updatedUser = DataStore.getUsers().find(u => u.id === id);
                    if (updatedUser) {
                        Auth.currentUser = updatedUser;
                        localStorage.setItem('xtrem_session', JSON.stringify(updatedUser));
                        document.getElementById('sidebarUserName').textContent = updatedUser.fullName;
                        document.getElementById('sidebarUserRole').textContent = updatedUser.role;
                        document.getElementById('userAvatar').textContent = updatedUser.fullName.charAt(0).toUpperCase();
                        Inventory.applyRolePermissions();
                        Inventory.renderTable();
                    }
                }

                App.showToast('Usuario actualizado exitosamente', 'success');
            } else {
                if (!data.password || data.password.length < 6) {
                    App.showToast('La contraseña debe tener al menos 6 caracteres', 'error');
                    return;
                }
                const existing = DataStore.findUserByUsername(data.username);
                if (existing) {
                    App.showToast('El nombre de usuario ya existe', 'error');
                    return;
                }
                await DataStore.addUser(data);
                await this.logHistory('Nuevo usuario', `Se creó el usuario "${data.username}" con nombre "${data.fullName}", correo "${data.email}" y rol "${data.role}"`);
                App.showToast('Usuario agregado exitosamente', 'success');
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
            modal.hide();
            this.renderUsersTable();
        });

        this.renderUsersTable();
    },

    // Llena el <select> de rol con todos los roles disponibles (incluye los que Angel
    // haya creado desde "Áreas de Usuarios") y respeta el permiso "changeRoles".
    populateUserRoleSelect(selectedRoleId) {
        const select = document.getElementById('userRole');
        const roles = Permissions.getRoles();
        select.innerHTML = roles.map(r => `<option value="${r.id}">${this.escapeHtml(r.name)}</option>`).join('');
        select.value = selectedRoleId || 'role_vendedor';
        select.disabled = !Auth.can('changeRoles');
    },

    // ===== SQL EDITOR =====
    setupSqlEditor() {
        if (this.sqlEditorInitialized) return;
        this.sqlEditorInitialized = true;

        document.getElementById('runSqlBtn').addEventListener('click', () => this.executeSqlQuery());
        document.getElementById('clearSqlBtn').addEventListener('click', () => {
            document.getElementById('sqlQueryInput').value = '';
            document.getElementById('sqlResultsContainer').style.display = 'none';
            document.getElementById('sqlNoResults').classList.add('d-none');
            document.getElementById('sqlError').classList.add('d-none');
            document.getElementById('sqlSuccess').classList.add('d-none');
        });

        document.getElementById('sqlQueryInput').addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                this.executeSqlQuery();
            }
        });
    },

    executeSqlQuery() {
        const query = document.getElementById('sqlQueryInput').value.trim();
        const errorEl = document.getElementById('sqlError');
        const successEl = document.getElementById('sqlSuccess');
        const resultsContainer = document.getElementById('sqlResultsContainer');
        const noResults = document.getElementById('sqlNoResults');
        const resultCount = document.getElementById('sqlResultCount');
        const resultsHead = document.getElementById('sqlResultsHead');
        const resultsBody = document.getElementById('sqlResultsBody');

        errorEl.classList.add('d-none');
        successEl.classList.add('d-none');
        resultsContainer.style.display = 'none';
        noResults.classList.add('d-none');

        if (!query) {
            errorEl.textContent = 'Por favor ingrese una consulta SQL';
            errorEl.classList.remove('d-none');
            return;
        }

        const runSupabase = async () => {
            if (!SupabaseService.isConnected()) {
                throw new Error('Supabase no está conectado. Verifique la configuración.');
            }

            let result = await SupabaseService.client.rpc('execute_sql', { query });

            if (result.error) {
                throw new Error(result.error.message || 'Error ejecutando consulta en Supabase');
            }

            const data = result.data;
            if (!data || data.length === 0) {
                noResults.classList.remove('d-none');
                successEl.textContent = 'Consulta ejecutada correctamente (0 filas afectadas)';
                successEl.classList.remove('d-none');
                return;
            }

            resultsContainer.style.display = 'block';
            resultCount.textContent = `${data.length} fila(s)`;

            const columns = Object.keys(data[0]);
            resultsHead.innerHTML = '<tr>' + columns.map(col => `<th>${this.escapeHtml(col)}</th>`).join('') + '</tr>';
            resultsBody.innerHTML = data.map(row =>
                '<tr>' + columns.map(col => {
                    const val = row[col];
                    if (val === null || val === undefined) return '<td class="text-muted">NULL</td>';
                    if (typeof val === 'object') return `<td>${this.escapeHtml(JSON.stringify(val))}</td>`;
                    return `<td>${this.escapeHtml(String(val))}</td>`;
                }).join('') + '</tr>'
            ).join('');
        };

        const runLocal = () => {
            if (typeof alasql === 'undefined') {
                throw new Error('AlaSQL no está cargado. Verifique la conexión a internet.');
            }

            const users = DataStore.getUsers();
            const products = DataStore.getProducts();
            const supplies = DataStore.getSupplies();
            const schedule = DataStore.getSchedule();
            const sales = DataStore.getSales();
            const history = DataStore.getHistory();

            alasql('CREATE TABLE IF NOT EXISTS users');
            alasql('CREATE TABLE IF NOT EXISTS products');
            alasql('CREATE TABLE IF NOT EXISTS supplies');
            alasql('CREATE TABLE IF NOT EXISTS schedule');
            alasql('CREATE TABLE IF NOT EXISTS sales');
            alasql('CREATE TABLE IF NOT EXISTS history');

            alasql('DROP TABLE IF EXISTS users');
            alasql('DROP TABLE IF EXISTS products');
            alasql('DROP TABLE IF EXISTS supplies');
            alasql('DROP TABLE IF EXISTS schedule');
            alasql('DROP TABLE IF EXISTS sales');
            alasql('DROP TABLE IF EXISTS history');

            alasql('CREATE TABLE users');
            alasql.tables.users.data = users.map(u => ({...u}));

            alasql('CREATE TABLE products');
            alasql.tables.products.data = products.map(p => ({...p}));

            alasql('CREATE TABLE supplies');
            alasql.tables.supplies.data = supplies.map(s => ({...s}));

            alasql('CREATE TABLE schedule');
            alasql.tables.schedule.data = schedule.map(s => ({...s}));

            alasql('CREATE TABLE sales');
            alasql.tables.sales.data = sales.map(s => ({...s}));

            alasql('CREATE TABLE history');
            alasql.tables.history.data = history.map(h => ({...h}));

            const result = alasql(query);

            if (!result || result.length === 0) {
                noResults.classList.remove('d-none');
                successEl.textContent = 'Consulta ejecutada correctamente (0 filas afectadas)';
                successEl.classList.remove('d-none');
            } else {
                resultsContainer.style.display = 'block';
                resultCount.textContent = `${result.length} fila(s)`;

                const columns = Object.keys(result[0]);
                resultsHead.innerHTML = '<tr>' + columns.map(col => `<th>${this.escapeHtml(col)}</th>`).join('') + '</tr>';
                resultsBody.innerHTML = result.map(row =>
                    '<tr>' + columns.map(col => {
                        const val = row[col];
                        if (val === null || val === undefined) return '<td class="text-muted">NULL</td>';
                        if (typeof val === 'object') return `<td>${this.escapeHtml(JSON.stringify(val))}</td>`;
                        return `<td>${this.escapeHtml(String(val))}</td>`;
                    }).join('') + '</tr>'
                ).join('');
            }
        };

        (async () => {
            try {
                await runSupabase();
            } catch (supErr) {
                console.warn('Supabase falló, usando localStorage:', supErr);
                try {
                    runLocal();
                } catch (localErr) {
                    errorEl.textContent = 'Error en la consulta: ' + localErr.message;
                    errorEl.classList.remove('d-none');
                }
            }
        })();
    },

    // Id del usuario con mayor monto (Q) vendido en el mes calendario actual.
    // Se agrupa por sellerId cuando está disponible (ventas nuevas); para ventas
    // antiguas que solo tienen el nombre, se busca el usuario por nombre (sin
    // distinguir mayúsculas/espacios) como respaldo.
    getTopSellerThisMonth() {
        const sales = DataStore.getSales();
        const users = DataStore.getUsers();
        const now = new Date();
        const y = now.getFullYear(), m = now.getMonth();

        const findUserIdByName = (name) => {
            if (!name) return null;
            const normalized = name.trim().toLowerCase();
            const match = users.find(u => (u.fullName || '').trim().toLowerCase() === normalized);
            return match ? match.id : null;
        };

        const totals = {};
        sales.forEach(s => {
            if (!s.createdAt) return;
            const d = new Date(s.createdAt);
            if (d.getFullYear() !== y || d.getMonth() !== m) return;

            const userId = s.sellerId || findUserIdByName(s.seller);
            if (!userId) return;

            totals[userId] = (totals[userId] || 0) + (parseFloat(s.total) || 0);
        });

        let topId = null, topVal = 0;
        Object.entries(totals).forEach(([id, val]) => {
            if (val > topVal) { topVal = val; topId = id; }
        });
        return topId;
    },

    // Muestra/oculta la estrella junto al nombre del usuario en el menú lateral
    updateSidebarStar() {
        const star = document.getElementById('sidebarUserStar');
        if (!star) return;
        const user = Auth.getCurrentUser();
        const topSellerId = this.getTopSellerThisMonth();
        const isTopSeller = !!(user && topSellerId && user.id === topSellerId);
        star.classList.toggle('d-none', !isTopSeller);
        if (isTopSeller && typeof bootstrap !== 'undefined' && !bootstrap.Tooltip.getInstance(star)) {
            new bootstrap.Tooltip(star);
        }
    },

    renderUsersTable() {
        const users = DataStore.getUsers();
        const tbody = document.getElementById('usersTableBody');

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-5">
                <i class="bi bi-people fs-1 d-block mb-2"></i>
                No hay usuarios registrados
            </td></tr>`;
            return;
        }

        const topSellerId = this.getTopSellerThisMonth();

        tbody.innerHTML = users.map((u, idx) => {
            const date = new Date(u.createdAt).toLocaleDateString('es-GT');
            const star = (topSellerId && u.id === topSellerId)
                ? ' <i class="bi bi-star-fill text-warning ms-1" data-bs-toggle="tooltip" data-bs-placement="top" title="Empleado del mes"></i>'
                : '';
            return `
                <tr>
                    <td class="fw-bold">${idx + 1}</td>
                    <td>${this.escapeHtml(u.fullName)}${star}</td>
                    <td><code>${this.escapeHtml(u.username)}</code></td>
<td>${this.escapeHtml(u.email)}</td>
                    <td><span class="role-badge ${u.role === 'Administrador de programación' ? 'role-badge-blue' : (u.role === 'Administrador' ? 'role-badge-red' : 'role-badge-gray')}">${this.escapeHtml(u.role)}</span></td>
                    <td><small class="text-muted">${date}</small></td>
                    <td>
                        <div class="d-flex gap-1">
                            <button class="action-btn action-btn-edit" onclick="App.editUser('${u.id}')" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="action-btn action-btn-delete" onclick="App.deleteUser('${u.id}')" title="Eliminar">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => new bootstrap.Tooltip(el));
        this.updateSidebarStar();
    },

    editUser(id) {
        const users = DataStore.getUsers();
        const user = users.find(u => u.id === id);
        if (!user) return;

        document.getElementById('userModalTitle').innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Usuario';
        document.getElementById('userId').value = user.id;
        document.getElementById('userFullName').value = user.fullName;
        document.getElementById('userUsername').value = user.username;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userPassword').value = '';
        document.getElementById('userPassword').required = false;
        this.populateUserRoleSelect(user.roleId);
        document.querySelector('#userModal .text-muted').style.display = 'block';

        const modal = new bootstrap.Modal(document.getElementById('userModal'));
        modal.show();
    },

    deleteUser(id) {
        if (id === 'usr_angel') {
            App.showToast('El superadministrador "Angel" no puede ser eliminado', 'error');
            return;
        }
        if (id === Auth.getCurrentUser().id) {
            App.showToast('No puedes eliminar tu propio usuario', 'error');
            return;
        }

        const users = DataStore.getUsers();
        const user = users.find(u => u.id === id);
        if (!user) {
            App.showToast('El usuario no existe', 'error');
            return;
        }
        document.getElementById('deleteModalMessage').textContent = 
            `¿Estás seguro de eliminar al usuario "${user.fullName}"?`;
        document.getElementById('confirmDeleteBtn').onclick = async () => {
            const deleted = await DataStore.deleteUser(id);
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
            if (deleted) {
                await this.logHistory('Eliminación de usuario', `Se eliminó al usuario "${user.username}" (${user.fullName})`);
                App.showToast('Usuario eliminado exitosamente', 'success');
            } else {
                App.showToast('No se pudo eliminar el usuario', 'error');
            }
            this.renderUsersTable();
        };
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    },

// ===== SUPPLIES =====
    async setupSupplies() {
        document.getElementById('addSupplyBtn').addEventListener('click', () => {
            document.getElementById('supplyModalTitle').innerHTML = '<i class="bi bi-boxes me-2"></i>Agregar Suministro';
            document.getElementById('supplyForm').reset();
            document.getElementById('supplyId').value = '';
            const modal = new bootstrap.Modal(document.getElementById('supplyModal'));
            modal.show();
        });

        document.getElementById('saveSupplyBtn').addEventListener('click', async () => {
            const id = document.getElementById('supplyId').value;
            const data = {
                name: document.getElementById('supplyName').value.trim(),
                category: document.getElementById('supplyCategory').value,
                quantity: parseInt(document.getElementById('supplyQuantity').value) || 0,
                unit: document.getElementById('supplyUnit').value.trim() || 'Unidades',
                minStock: parseInt(document.getElementById('supplyMinStock').value) || 0,
                notes: document.getElementById('supplyNotes').value.trim()
            };

            if (!data.name) {
                App.showToast('Por favor ingrese el nombre del producto', 'error');
                return;
            }

            if (id) {
                await DataStore.updateSupply(id, data);
                await this.logHistory('Edición de suministro', `Se editó el suministro "${data.name}" (categoría: ${data.category}, cantidad: ${data.quantity})`);
                App.showToast('Suministro actualizado exitosamente', 'success');
            } else {
                await DataStore.addSupply(data);
                await this.logHistory('Nuevo suministro', `Se agregó el suministro "${data.name}" (categoría: ${data.category}, cantidad: ${data.quantity})`);
                App.showToast('Suministro agregado exitosamente', 'success');
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById('supplyModal'));
            modal.hide();
            this.renderSuppliesTable();
            this.updateStockAlertBadges();
            if (typeof Purchases !== 'undefined') Purchases.scan();
        });

        document.getElementById('searchSupplies').addEventListener('input', () => this.renderSuppliesTable());
        document.getElementById('filterSuppliesCategory').addEventListener('change', () => this.renderSuppliesTable());
        document.getElementById('filterSuppliesStatus').addEventListener('change', () => this.renderSuppliesTable());

        document.getElementById('exportSuppliesPdfBtn').addEventListener('click', () => {
            const supplies = this.getFilteredSupplies();
            if (supplies.length === 0) {
                App.showToast('No hay datos para exportar', 'error');
                return;
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const currentUser = Auth.getCurrentUser();
            const dateStr = new Date().toLocaleString('es-PR', {
                timeZone: 'America/Puerto_Rico',
                dateStyle: 'long',
                timeStyle: 'short'
            });

            doc.setFillColor(220, 53, 69);
            doc.rect(0, 0, 210, 30, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('XTREME MOBILE INC.', 105, 12, { align: 'center' });
            doc.setFontSize(10);
            doc.text('Inventario General - Oficina y Suministros', 105, 20, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text('Tel: 787-205-2220', 105, 26, { align: 'center' });

            doc.setTextColor(60, 60, 60);
            doc.setFontSize(9);
            doc.text('Generado por: ' + (currentUser ? currentUser.fullName : 'N/A') + ' | ' + dateStr, 14, 36);
            doc.text('Total: ' + supplies.length + ' suministros', 196, 36, { align: 'right' });

            const headers = [['#', 'Producto', 'Categoría', 'Cantidad', 'Unidad', 'Stock Mínimo', 'Estado', 'Notas']];
            const body = supplies.map((s, i) => [
                i + 1,
                s.name,
                s.category,
                s.quantity,
                s.unit || 'Unidades',
                s.minStock || 0,
                s.quantity <= s.minStock ? 'Stock Bajo' : 'OK',
                s.notes || ''
            ]);

            doc.autoTable({
                head: headers,
                body,
                startY: 42,
                theme: 'grid',
                headStyles: { fillColor: [220, 53, 69], fontSize: 8, fontStyle: 'bold', halign: 'center' },
                bodyStyles: { fontSize: 8 },
                alternateRowStyles: { fillColor: [245, 245, 245] }
            });

            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.text('XTREME MOBILE INC. - Pagina ' + i + ' de ' + pageCount, 14, 290);
                doc.text('(c) ' + new Date().getFullYear() + ' XTREME MOBILE INC. - Tel: 787-205-2220', 196, 290, { align: 'right' });
            }

            doc.save('inventario-general.pdf');
            App.showToast('PDF exportado exitosamente', 'success');
        });

        this.renderSuppliesTable();
    },

    getFilteredSupplies() {
        const supplies = DataStore.getSupplies();
        const search = document.getElementById('searchSupplies').value.toLowerCase();
        const category = document.getElementById('filterSuppliesCategory').value;
        const status = document.getElementById('filterSuppliesStatus').value;

        return supplies.filter(s => {
            if (search && !s.name.toLowerCase().includes(search) && !s.category.toLowerCase().includes(search)) return false;
            if (category !== 'all' && s.category !== category) return false;
            if (status === 'bajo' && s.quantity > s.minStock) return false;
            if (status === 'ok' && s.quantity <= s.minStock) return false;
            return true;
        });
    },

    renderSuppliesTable() {
        const supplies = this.getFilteredSupplies();
        const tbody = document.getElementById('suppliesBody');

        document.getElementById('suppliesCount').textContent = `${supplies.length} suministros`;

        if (supplies.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted py-5">
                <i class="bi bi-boxes fs-1 d-block mb-2"></i>
                No hay suministros registrados
            </td></tr>`;
            return;
        }

        tbody.innerHTML = supplies.map((s, i) => {
            const qty = parseInt(s.quantity) || 0;
            const min = parseInt(s.minStock) || 0;
            const isLow = min > 0 && qty <= min;
            const isNearLow = min > 0 && !isLow && qty <= min * 1.5;
            const date = s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('es-GT') : '-';

            let qtyClass = 'text-success';
            let statusBadge = '<span class="badge bg-success">OK</span>';
            if (isLow) {
                qtyClass = 'text-danger';
                statusBadge = '<span class="badge bg-danger">Stock Bajo</span>';
            } else if (isNearLow) {
                qtyClass = 'text-orange';
                statusBadge = '<span class="badge badge-stock-medium">Por Acabarse</span>';
            }

            return `
                <tr>
                    <td class="fw-bold">${i + 1}</td>
                    <td>${this.escapeHtml(s.name)}</td>
                    <td><span class="badge bg-secondary">${this.escapeHtml(s.category)}</span></td>
                    <td class="fw-bold ${qtyClass}">${qty}</td>
                    <td>${this.escapeHtml(s.unit || 'Unidades')}</td>
                    <td>${s.minStock || 0}</td>
                    <td>${statusBadge}</td>
                    <td><small class="text-muted">${this.escapeHtml(s.notes || '')}</small></td>
                    <td><small class="text-muted">${date}</small></td>
                    <td>
                        <div class="d-flex gap-1">
                            <button class="action-btn action-btn-edit" onclick="App.editSupply('${s.id}')" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="action-btn action-btn-delete" onclick="App.deleteSupply('${s.id}')" title="Eliminar">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    editSupply(id) {
        const supplies = DataStore.getSupplies();
        const supply = supplies.find(s => s.id === id);
        if (!supply) return;

        document.getElementById('supplyModalTitle').innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Suministro';
        document.getElementById('supplyId').value = supply.id;
        document.getElementById('supplyName').value = supply.name;
        document.getElementById('supplyCategory').value = supply.category;
        document.getElementById('supplyQuantity').value = supply.quantity;
        document.getElementById('supplyUnit').value = supply.unit || '';
        document.getElementById('supplyMinStock').value = supply.minStock || 0;
        document.getElementById('supplyNotes').value = supply.notes || '';

        const modal = new bootstrap.Modal(document.getElementById('supplyModal'));
        modal.show();
    },

    deleteSupply(id) {
        const supplies = DataStore.getSupplies();
        const supply = supplies.find(s => s.id === id);
        document.getElementById('deleteModalMessage').textContent = `¿Estás seguro de eliminar "${supply.name}"?`;
        document.getElementById('confirmDeleteBtn').onclick = async () => {
            await DataStore.deleteSupply(id);
            await this.logHistory('Eliminación de suministro', `Se eliminó el suministro "${supply.name}"`);
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
            App.showToast('Suministro eliminado exitosamente', 'success');
            this.renderSuppliesTable();
            this.updateStockAlertBadges();
            if (typeof Purchases !== 'undefined') Purchases.scan();
        };
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    },

    // ===== SCHEDULE =====
    populateScheduleEmployeeSelect(selectedName) {
        const select = document.getElementById('scheduleEmployeeSelect');
        const users = DataStore.getUsers();
        select.innerHTML = '<option value="">Seleccionar empleado...</option>';
        users.forEach(u => {
            if (u.username && u.password) {
                const option = document.createElement('option');
                option.value = u.fullName;
                option.textContent = u.fullName;
                if (u.fullName === selectedName) option.selected = true;
                select.appendChild(option);
            }
        });
    },

    async setupSchedule() {
        document.getElementById('addScheduleBtn').addEventListener('click', () => {
            document.getElementById('scheduleModalTitle').innerHTML = '<i class="bi bi-calendar-plus me-2"></i>Agregar Horario';
            document.getElementById('scheduleForm').reset();
            document.getElementById('scheduleId').value = '';
            document.getElementById('scheduleDate').value = '';
            this.populateScheduleEmployeeSelect();
            const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
            modal.show();
        });

        document.getElementById('saveScheduleBtn').addEventListener('click', async () => {
            const id = document.getElementById('scheduleId').value;
            const dateValue = document.getElementById('scheduleDate').value;
            const dayName = dateValue ? (() => {
                const d = new Date(dateValue + 'T00:00:00');
                const names = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
                return names[(d.getDay() + 6) % 7];
            })() : '';

            const selectEmployee = document.getElementById('scheduleEmployeeSelect');
            const employeeName = selectEmployee.value || document.getElementById('scheduleEmployee').value.trim();

            const data = {
                employeeName: employeeName,
                date: dateValue,
                day: dayName,
                startTime: document.getElementById('scheduleStart').value,
                endTime: document.getElementById('scheduleEnd').value,
                role: document.getElementById('scheduleRole').value,
                notes: document.getElementById('scheduleNotes').value.trim()
            };

            if (!data.employeeName || !data.date) {
                App.showToast('Por favor complete los campos obligatorios', 'error');
                return;
            }

            if (id) {
                await DataStore.updateScheduleEntry(id, data);
                await this.logHistory('Edición de horario', `Se editó el horario de "${data.employeeName}" (${data.date}, ${data.startTime}-${data.endTime}, rol: ${data.role})`);
                App.showToast('Horario actualizado exitosamente', 'success');
            } else {
                await DataStore.addScheduleEntry(data);
                await this.logHistory('Nuevo horario', `Se agregó el horario de "${data.employeeName}" (${data.date}, ${data.startTime}-${data.endTime}, rol: ${data.role})`);
                App.showToast('Horario agregado exitosamente', 'success');
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById('scheduleModal'));
            modal.hide();
            this.renderScheduleCalendar();
        });

        document.getElementById('searchSchedule').addEventListener('input', () => this.renderScheduleCalendar());
        document.getElementById('filterScheduleDay').addEventListener('change', () => this.renderScheduleCalendar());

        document.getElementById('scheduleCalendar').addEventListener('click', (e) => {
            if (e.target.closest('.action-btn-edit') || e.target.closest('.action-btn-delete')) return;
            const cell = e.target.closest('.schedule-day-cell[data-date]');
            if (!cell) return;
            const dateValue = cell.getAttribute('data-date');
            document.getElementById('scheduleModalTitle').innerHTML = '<i class="bi bi-calendar-plus me-2"></i>Agregar Horario';
            document.getElementById('scheduleForm').reset();
            document.getElementById('scheduleId').value = '';
            document.getElementById('scheduleDate').value = dateValue;
            this.populateScheduleEmployeeSelect();
            const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
            modal.show();
        });

        const now = new Date();
        this.scheduleCurrentMonth = now.getMonth();
        this.scheduleCurrentYear = now.getFullYear();

        document.getElementById('schedulePrevMonth').addEventListener('click', () => {
            this.scheduleCurrentMonth--;
            if (this.scheduleCurrentMonth < 0) {
                this.scheduleCurrentMonth = 11;
                this.scheduleCurrentYear--;

            }
            this.renderScheduleCalendar();
        });

        document.getElementById('scheduleNextMonth').addEventListener('click', () => {
            this.scheduleCurrentMonth++;
            if (this.scheduleCurrentMonth > 11) {
                this.scheduleCurrentMonth = 0;
                this.scheduleCurrentYear++;
            }
            this.renderScheduleCalendar();
        });

        await DataStore.seedSundayClosures();
        this.renderScheduleCalendar();
    },

    getFilteredSchedule() {
        const schedule = DataStore.getSchedule();
        const search = document.getElementById('searchSchedule').value.toLowerCase();
        const day = document.getElementById('filterScheduleDay').value;
        const dayNames = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

        return schedule.filter(s => {
            if (search && !s.employeeName.toLowerCase().includes(search)) return false;
            if (day !== 'all') {
                if (s.date) {
                    const d = new Date(s.date + 'T00:00:00');
                    if (dayNames[d.getDay()] !== day) return false;
                } else if (s.day && s.day !== day) {
                    return false;
                }
            }
            return true;
        });
    },

    renderScheduleCalendar() {
        const schedule = this.getFilteredSchedule();
        const container = document.getElementById('scheduleCalendar');
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayShortNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

        const now = new Date();
        if (!this.scheduleCurrentMonth) {
            this.scheduleCurrentMonth = now.getMonth();
            this.scheduleCurrentYear = now.getFullYear();
        }

        document.getElementById('scheduleMonthYear').textContent = `${monthNames[this.scheduleCurrentMonth]} ${this.scheduleCurrentYear}`;
        document.getElementById('scheduleCount').textContent = `${schedule.length} registros`;

        const firstDay = new Date(this.scheduleCurrentYear, this.scheduleCurrentMonth, 1);
        const startOffset = firstDay.getDay();
        const daysInMonth = new Date(this.scheduleCurrentYear, this.scheduleCurrentMonth + 1, 0).getDate();
        const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

        const today = new Date();
        const isCurrentMonth = today.getMonth() === this.scheduleCurrentMonth && today.getFullYear() === this.scheduleCurrentYear;
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

        const employeeColors = this.getEmployeeColors(schedule);

        let html = '<div class="schedule-month-grid">';

        dayShortNames.forEach(d => {
            html += `<div class="schedule-weekday-header">${d}</div>`;
        });
        html += `<div class="schedule-weekday-header schedule-week-hours-header">Horas/Semana</div>`;

        const weeks = [];
        for (let i = 0; i < totalCells; i += 7) {
            const weekDays = [];
            for (let j = 0; j < 7; j++) {
                const dayNum = i + j - startOffset + 1;
                const isCurrentMonthDay = dayNum >= 1 && dayNum <= daysInMonth;
                weekDays.push({
                    dayNum: isCurrentMonthDay ? dayNum : null,
                    isCurrentMonth: isCurrentMonthDay,
                    date: isCurrentMonthDay ? `${this.scheduleCurrentYear}-${String(this.scheduleCurrentMonth+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}` : null
                });
            }
            weeks.push(weekDays);
        }

        weeks.forEach((weekDays, weekIdx) => {
            weekDays.forEach(day => {
                if (!day.isCurrentMonth || day.dayNum === null) {
                    html += `<div class="schedule-day-cell other-month"></div>`;
                    return;
                }

                const cellDate = day.date;
                const date = new Date(this.scheduleCurrentYear, this.scheduleCurrentMonth, day.dayNum);
                const dowIndex = date.getDay();
                const dayName = daysOfWeek[dowIndex];
                const dayEntries = schedule.filter(s => s.date === cellDate);

                const isToday = isCurrentMonth && day.dayNum === today.getDate();
                const cellClass = isToday ? 'schedule-day-cell today' : 'schedule-day-cell';

                html += `<div class="${cellClass}" data-date="${cellDate}" style="cursor:pointer">`;
                html += `<div class="schedule-day-number">${day.dayNum}</div>`;
                html += `<div class="schedule-day-entries">`;

                if (dayEntries.length === 0) {
                    html += `<small class="text-muted d-block text-center" style="font-size:0.7rem">—</small>`;
                } else {
                    dayEntries.forEach(s => {
                        const color = employeeColors[s.employeeName] || '#6c757d';
                        html += `
                            <div class="schedule-card" style="border-left:3px solid ${color}; background: linear-gradient(to right, ${this.hexToRgba(color, 0.08)}, #fff)">
                                <div class="schedule-card-title" style="color:${color}">${this.escapeHtml(s.employeeName)}</div>
                                <div class="schedule-card-time"><i class="bi bi-clock"></i> ${s.startTime} - ${s.endTime}</div>
                                <div class="schedule-card-role"><span class="badge" style="background:${this.hexToRgba(color, 0.12)};color:${color}">${this.escapeHtml(s.role || 'Vendedor')}</span></div>
                                ${s.notes ? `<div class="schedule-card-notes">${this.escapeHtml(s.notes)}</div>` : ''}
                                <div class="schedule-card-actions d-flex gap-1 mt-1">
                                    <button class="action-btn action-btn-edit" onclick="App.editSchedule('${s.id}')" title="Editar">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="action-btn action-btn-delete" onclick="App.deleteSchedule('${s.id}')" title="Eliminar">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                    });
                }

                html += `</div></div>`;
            });

            const weekSchedule = schedule.filter(s => {
                if (!s.date) return false;
                const d = new Date(s.date + 'T00:00:00');
                const y = d.getFullYear();
                const m = d.getMonth();
                const day = d.getDate();
                const weekStart = new Date(this.scheduleCurrentYear, this.scheduleCurrentMonth, weekDays[0].dayNum || 1);
                const weekEnd = new Date(this.scheduleCurrentYear, this.scheduleCurrentMonth, weekDays[6].dayNum || 1);
                if (weekDays[0].dayNum === null) weekStart.setDate(weekStart.getDate() - 7);
                if (weekDays[6].dayNum === null) weekEnd.setDate(weekEnd.getDate() + 7);
                return d >= weekStart && d <= weekEnd;
            });

            const hoursByEmployee = {};
            weekSchedule.forEach(s => {
                if (!s.startTime || !s.endTime) return;
                const hours = this.calculateHours(s.startTime, s.endTime);
                if (!hoursByEmployee[s.employeeName]) hoursByEmployee[s.employeeName] = 0;
                hoursByEmployee[s.employeeName] += hours;
            });

            html += `<div class="schedule-week-hours-cell">`;
            if (Object.keys(hoursByEmployee).length === 0) {
                html += `<small class="text-muted d-block text-center" style="font-size:0.7rem">—</small>`;
            } else {
                Object.entries(hoursByEmployee).forEach(([name, hours]) => {
                    const color = employeeColors[name] || '#6c757d';
                    html += `
                        <div class="schedule-hours-card" style="border-left:3px solid ${color}">
                            <div class="schedule-hours-name" style="color:${color}">${this.escapeHtml(name)}</div>
                            <div class="schedule-hours-value">${hours.toFixed(1)}h</div>
                        </div>
                    `;
                });
            }
            html += `</div>`;
        });

        html += '</div>';

        container.innerHTML = html;
    },

    calculateHours(startTime, endTime) {
        const start = new Date('1970-01-01T' + startTime + ':00');
        const end = new Date('1970-01-01T' + endTime + ':00');
        let diff = (end - start) / (1000 * 60 * 60);
        if (diff < 0) diff += 24;
        return diff;
    },

    getEmployeeColors(schedule) {
        const colors = ['#DC3545', '#0D6EFD', '#198754', '#FFC107', '#0DCaf0', '#6F42C1', '#FD7E14', '#20C997', '#D63384', '#6610F2'];
        const map = {};
        const names = [...new Set(schedule.map(s => s.employeeName))];
        names.forEach((name, idx) => {
            map[name] = colors[idx % colors.length];
        });
        return map;
    },

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    editSchedule(id) {
        const schedule = DataStore.getSchedule();
        const entry = schedule.find(s => s.id === id);
        if (!entry) return;

        document.getElementById('scheduleModalTitle').innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Horario';
        document.getElementById('scheduleId').value = entry.id;
        this.populateScheduleEmployeeSelect(entry.employeeName);
        document.getElementById('scheduleDate').value = entry.date || '';
        document.getElementById('scheduleStart').value = entry.startTime;
        document.getElementById('scheduleEnd').value = entry.endTime;
        document.getElementById('scheduleRole').value = entry.role || 'Vendedor';
        document.getElementById('scheduleNotes').value = entry.notes || '';

        const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
        modal.show();
    },

    deleteSchedule(id) {
        const schedule = DataStore.getSchedule();
        const entry = schedule.find(s => s.id === id);
        document.getElementById('deleteModalMessage').textContent = 
            `¿Estás seguro de eliminar el horario de "${entry.employeeName}" (${entry.date || entry.day})?`;
        document.getElementById('confirmDeleteBtn').onclick = async () => {
            await DataStore.deleteScheduleEntry(id);
            await this.logHistory('Eliminación de horario', `Se eliminó el horario de "${entry.employeeName}" (${entry.date || entry.day})`);
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
            App.showToast('Horario eliminado exitosamente', 'success');
            this.renderScheduleCalendar();
        };
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    },

    // ===== HISTORY =====
    async setupHistory() {
        const clearBtn = document.getElementById('clearHistoryBtn');
        if (clearBtn) {
            clearBtn.style.display = Auth.can('clearHistory') ? '' : 'none';
        }

        document.getElementById('searchHistory').addEventListener('input', () => this.renderHistoryTable());
        document.getElementById('filterHistoryFrom').addEventListener('change', () => this.renderHistoryTable());
        document.getElementById('filterHistoryTo').addEventListener('change', () => this.renderHistoryTable());
        if (clearBtn) {
            clearBtn.addEventListener('click', async () => {
                await DataStore.clearHistory();
                this.renderHistoryTable();
                App.showToast('Historial limpiado exitosamente', 'success');
            });
        }

        this.renderHistoryTable();
    },

    getFilteredHistory() {
        const history = DataStore.getHistory();
        const search = document.getElementById('searchHistory').value.toLowerCase();
        const dateFrom = document.getElementById('filterHistoryFrom').value;
        const dateTo = document.getElementById('filterHistoryTo').value;

        return history.filter(h => {
            const detail = `${h.action || ''} ${h.detail || ''} ${h.user || ''}`.toLowerCase();
            if (search && !detail.includes(search)) return false;
            const date = h.createdAt ? h.createdAt.split('T')[0] : '';
            if (dateFrom && date < dateFrom) return false;
            if (dateTo && date > dateTo) return false;
            return true;
        });
    },

    renderHistoryTable() {
        const history = this.getFilteredHistory();
        const tbody = document.getElementById('historyBody');

        document.getElementById('historyCount').textContent = `${history.length} registros`;

        if (history.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-5">
                <i class="bi bi-clock-history fs-1 d-block mb-2"></i>
                No hay historial registrado
            </td></tr>`;
            return;
        }

        tbody.innerHTML = history.slice().reverse().map((h, i) => `
            <tr>
                <td class="fw-bold">${i + 1}</td>
                <td><small>${new Date(h.createdAt).toLocaleString('es-GT')}</small></td>
                <td>${this.escapeHtml(h.user || '')}</td>
                <td><span class="badge bg-danger bg-opacity-10 text-danger">${this.escapeHtml(h.action || '')}</span></td>
                <td><small>${this.escapeHtml(h.detail || '')}</small></td>
            </tr>
        `).join('');
    },

    async logHistory(action, detail) {
        const user = Auth.getCurrentUser();
        await DataStore.addHistoryEntry({
            user: user ? user.fullName : 'Sistema',
            action: action,
            detail: detail
        });
    },

    // ===== NOTIFICACIONES DE STOCK BAJO EN EL MENÚ =====
    updateStockAlertBadges() {
        const products = DataStore.getProducts();
        const supplies = DataStore.getSupplies();
        const isLow = (stock, min) => {
            const s = parseInt(stock) || 0;
            const m = parseInt(min) || 0;
            // Un producto agotado (stock 0) siempre cuenta como "bajo", tenga o no
            // un stock mínimo configurado. Si tiene mínimo, también cuenta al llegar a él.
            if (s <= 0) return true;
            return m > 0 && s <= m;
        };

        const inventarioCount = products.filter(p => p.category !== 'ACCESORIOS' && isLow(p.stock, p.minStock)).length;
        const accesoriosCount = products.filter(p => p.category === 'ACCESORIOS' && isLow(p.stock, p.minStock)).length;
        const suppliesCount = supplies.filter(s => isLow(s.quantity, s.minStock)).length;
        const comprasCount = (typeof DataStore.getPurchaseRequests === 'function') ? DataStore.getPurchaseRequests().filter(r => !r.ordered).length : 0;

        this.setNavBadge('navBadgeInventario', inventarioCount);
        this.setNavBadge('navBadgeAccesorios', accesoriosCount);
        this.setNavBadge('navBadgeInventarioGeneral', suppliesCount);
        this.setNavBadge('navBadgeCompras', comprasCount);
    },

    setNavBadge(id, count) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = count;
        el.classList.toggle('d-none', count <= 0);
    },

    // ===== MI PERFIL =====
    setupProfileModal() {
        document.getElementById('profileModal').addEventListener('show.bs.modal', () => this.openProfileModal());
        document.getElementById('saveProfileBtn').addEventListener('click', () => this.saveProfile());

        // Botones de "ver contraseña" (ojo) para los 3 campos de contraseña
        this.setupPasswordToggle('toggleProfileCurrentPassword', 'profileCurrentPassword');
        this.setupPasswordToggle('toggleProfileNewPassword', 'profileNewPassword');
        this.setupPasswordToggle('toggleProfileNewPasswordConfirm', 'profileNewPasswordConfirm');

        // Barra de seguridad de la nueva contraseña, se actualiza mientras se escribe
        document.getElementById('profileNewPassword').addEventListener('input', (e) => {
            this.updatePasswordStrengthUI(e.target.value);
        });
    },

    setupPasswordToggle(btnId, inputId) {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        btn.addEventListener('click', () => {
            const icon = btn.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('bi-eye', 'bi-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('bi-eye-slash', 'bi-eye');
            }
        });
    },

    // Calcula qué tan segura es una contraseña (longitud, mayúsculas/minúsculas,
    // números y símbolos) y devuelve un nivel para mostrar en la barra visual.
    calculatePasswordStrength(pwd) {
        if (!pwd) return { score: 0, label: 'Sin contraseña', color: '#dc3545', percent: 0 };

        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        const levels = [
            { min: 0, label: 'Muy débil', color: '#dc3545', percent: 15 },
            { min: 1, label: 'Débil', color: '#fd7e14', percent: 35 },
            { min: 2, label: 'Media', color: '#ffc107', percent: 55 },
            { min: 3, label: 'Fuerte', color: '#20c997', percent: 75 },
            { min: 4, label: 'Muy fuerte', color: '#198754', percent: 100 }
        ];
        let result = levels[0];
        levels.forEach(l => { if (score >= l.min) result = l; });
        return { score, ...result };
    },

    updatePasswordStrengthUI(pwd) {
        const strength = this.calculatePasswordStrength(pwd);
        const fill = document.getElementById('profilePasswordStrengthFill');
        const label = document.getElementById('profilePasswordStrengthLabel');
        fill.style.width = strength.percent + '%';
        fill.style.backgroundColor = strength.color;
        label.textContent = pwd ? `Seguridad: ${strength.label} (usa mayúsculas, números y símbolos para mejorarla)` : 'Usa mayúsculas, minúsculas, números y símbolos para una contraseña más segura.';
        label.style.color = pwd ? strength.color : '';
    },

    async openProfileModal() {
        // Fuerza una lectura fresca desde Supabase antes de mostrar el formulario. Si la
        // contraseña (u otro dato) se cambió desde otro dispositivo, la sesión de este
        // dispositivo podría estar desactualizada; sin esto, validar "contraseña actual"
        // podía comparar contra un valor viejo y rechazar la contraseña correcta.
        if (typeof SupabaseService !== 'undefined' && SupabaseService.isConnected()) {
            await SupabaseService.syncFromSupabase();
            this.refreshSessionFromLocalData();
        }

        const user = Auth.getCurrentUser();
        if (!user) return;

        document.getElementById('profileAvatarPreview').textContent = (user.fullName || user.username || 'U').charAt(0).toUpperCase();
        document.getElementById('profileNamePreview').textContent = user.fullName || user.username;
        document.getElementById('profileUsernamePreview').textContent = '@' + user.username;
        document.getElementById('profileFullName').value = user.fullName || '';
        document.getElementById('profileUsername').value = user.username || '';
        document.getElementById('profileEmail').value = user.email || '';
        document.getElementById('profileCurrentPassword').value = '';
        document.getElementById('profileNewPassword').value = '';
        document.getElementById('profileNewPasswordConfirm').value = '';
        this.updatePasswordStrengthUI('');

        const roleBadge = document.getElementById('profileRoleBadge');
        roleBadge.textContent = user.role || '-';
        roleBadge.className = 'role-badge mt-2 d-inline-block ' +
            (user.role === 'Administrador de programación' ? 'role-badge-blue' : (user.role === 'Administrador' ? 'role-badge-red' : 'role-badge-gray'));

        const topSellerId = this.getTopSellerThisMonth();
        document.getElementById('profileStarBadge').classList.toggle('d-none', !(topSellerId && user.id === topSellerId));

        const memberSince = document.getElementById('profileMemberSince');
        memberSince.textContent = user.createdAt ? 'Miembro desde ' + new Date(user.createdAt).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

        this.renderProfilePermissions(user);
    },

    renderProfilePermissions(user) {
        document.getElementById('profileRoleName').textContent = user.role || '-';

        const areasList = document.getElementById('profileAreasList');
        areasList.innerHTML = Permissions.AREA_KEYS.map(key => {
            const status = Permissions.getEffectiveAreaStatus(user, key);
            const info = status === 'full'
                ? { icon: 'bi-check-circle-fill text-success', text: 'Acceso completo' }
                : status === 'soon'
                    ? { icon: 'bi-clock-fill text-warning', text: 'Próximamente' }
                    : { icon: 'bi-x-circle-fill text-danger', text: 'Sin acceso' };
            return `
                <div class="profile-perm-row">
                    <span>${this.escapeHtml(Permissions.AREA_LABELS[key])}</span>
                    <span class="text-nowrap"><i class="bi ${info.icon} me-1"></i>${info.text}</span>
                </div>
            `;
        }).join('');

        const capsList = document.getElementById('profileCapsList');
        capsList.innerHTML = Permissions.CAPABILITY_KEYS.map(key => {
            const granted = Permissions.getEffectiveCapability(user, key);
            return `
                <div class="profile-perm-row">
                    <span>${this.escapeHtml(Permissions.CAPABILITY_LABELS[key])}</span>
                    <span class="text-nowrap">${granted ? '<i class="bi bi-check-circle-fill text-success"></i>' : '<i class="bi bi-x-circle-fill text-danger"></i>'}</span>
                </div>
            `;
        }).join('');
    },

    async saveProfile() {
        const fullName = document.getElementById('profileFullName').value.trim();
        const username = document.getElementById('profileUsername').value.trim();
        const email = document.getElementById('profileEmail').value.trim();
        const currentPassword = document.getElementById('profileCurrentPassword').value;
        const newPassword = document.getElementById('profileNewPassword').value;
        const newPasswordConfirm = document.getElementById('profileNewPasswordConfirm').value;

        if (!fullName || !username || !email) {
            App.showToast('Por favor completa tu nombre, usuario y correo', 'error');
            return;
        }

        const user = Auth.getCurrentUser();
        // Se valida contra la copia más fresca posible (no la de la sesión, que pudo
        // quedar vieja si la contraseña se cambió desde otro dispositivo).
        const freshUser = DataStore.getUsers().find(u => u.id === user.id) || user;

        if (username !== user.username) {
            const existing = DataStore.findUserByUsername(username);
            if (existing && existing.id !== user.id) {
                App.showToast('Ese nombre de usuario ya está en uso', 'error');
                return;
            }
        }

        const updateData = { fullName, username, email };

        if (newPassword || newPasswordConfirm || currentPassword) {
            if (!currentPassword) {
                App.showToast('Ingresa tu contraseña actual para poder cambiarla', 'error');
                return;
            }
            if (currentPassword !== freshUser.password) {
                App.showToast('La contraseña actual no es correcta', 'error');
                return;
            }
            if (!newPassword || newPassword.length < 6) {
                App.showToast('La nueva contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }
            if (newPassword !== newPasswordConfirm) {
                App.showToast('Las contraseñas nuevas no coinciden', 'error');
                return;
            }
            updateData.password = newPassword;
        }

        const ok = await Auth.updateProfile(updateData);
        if (ok) {
            document.getElementById('sidebarUserName').textContent = Auth.currentUser.fullName;
            document.getElementById('sidebarUserRole').textContent = Auth.currentUser.role;
            document.getElementById('userAvatar').textContent = (Auth.currentUser.fullName || 'U').charAt(0).toUpperCase();
            this.renderUsersTable();
            await this.logHistory('Perfil actualizado', `El usuario "${user.username}" actualizó su perfil`);
            App.showToast('Perfil actualizado exitosamente', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
            if (modal) modal.hide();
        } else {
            App.showToast('No se pudo actualizar el perfil', 'error');
        }
    },

    // ===== ACTUALIZACIONES =====
    renderUpdatesPage() {
        const dateBadge = document.getElementById('updatesVersionDate');
        if (dateBadge) {
            const d = new Date(APP_VERSION_DATE + 'T00:00:00');
            dateBadge.textContent = d.toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });
        }
    },

    // ===== SOPORTE TÉCNICO =====
    setupSupportModal() {
        const versionLabel = document.getElementById('supportVersionLabel');
        if (versionLabel) versionLabel.textContent = APP_VERSION;

        document.getElementById('sendSupportProblemBtn').addEventListener('click', () => this.sendSupportProblem());
    },

    // Abre el cliente de correo del usuario con un mensaje pre-escrito a soporte técnico
    sendSupportProblem() {
        const textarea = document.getElementById('supportProblemText');
        const text = textarea.value.trim();
        if (!text) {
            App.showToast('Por favor describe tu problema antes de enviar', 'error');
            return;
        }

        const user = Auth.getCurrentUser();
        const userLabel = user ? `${user.fullName} (usuario: ${user.username})` : 'Usuario no identificado';
        const subject = 'Soporte Técnico - XTREME MOBILE - ' + (user ? user.fullName : 'Usuario');
        const body = `Usuario: ${userLabel}\nFecha: ${new Date().toLocaleString('es-PR')}\n\nMensaje:\n${text}`;
        const mailtoUrl = `mailto:soporte-tecnico@angeltechsolutions.dev?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        window.location.href = mailtoUrl;
        App.showToast('Se abrió tu correo con el mensaje listo para enviar', 'success');
        textarea.value = '';
    },

    copySupportEmail(email, btnEl) {
        const restoreIcon = () => {
            if (btnEl) btnEl.innerHTML = '<i class="bi bi-clipboard"></i>';
        };
        const onCopied = () => {
            if (btnEl) btnEl.innerHTML = '<i class="bi bi-check-lg"></i>';
            App.showToast('Correo copiado al portapapeles', 'success');
            setTimeout(restoreIcon, 1500);
        };
        navigator.clipboard.writeText(email).then(onCopied).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = email;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            onCopied();
        });
    },

    showToast(message, type = 'success') {
        const toastEl = document.getElementById('toastNotification');
        const toastMessage = document.getElementById('toastMessage');
        
        toastEl.classList.remove('success', 'error');
        toastEl.classList.add(type);
        toastMessage.textContent = message;

        if (this.toastInstance) {
            this.toastInstance.dispose();
        }

        this.toastInstance = new bootstrap.Toast(toastEl, {
            autohide: true,
            delay: 3000
        });
        this.toastInstance.show();
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
