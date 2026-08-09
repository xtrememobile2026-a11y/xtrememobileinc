/**
 * XTREM MOBILE - Main Application Controller
 * Maneja la navegación, eventos globales y orquestación
 */

const App = {
    toastInstance: null,

    init() {
        // Loading screen
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
        }, 800);

        // This page requires an active session
        if (!Auth.init()) {
            window.location.href = 'login.html';
            return;
        }

        this.setupAuthEvents();
        this.setupNavigation();
        this.setupClock();
        Tour.init();
        this.showMainApp();
    },

    setupAuthEvents() {
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            const user = Auth.getCurrentUser();
            if (user) {
                this.logHistory('Cierre de sesión', `El usuario "${user.fullName}" cerró sesión`);
            }
            Auth.logout();
            window.location.href = 'login.html';
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
        // Secciones restringidas (Accesorios / Inventario General): solo el superadministrador
        // (Angel) puede abrirlas. Para el resto, mostrar aviso de "Próximamente".
        const restrictedPages = ['accesorios', 'inventario-general'];
        if (restrictedPages.includes(page) && !Auth.canAccessRestricted()) {
            const user = Auth.getCurrentUser();
            const name = user ? user.fullName : 'usuario';
            const title = page === 'accesorios' ? 'Accesorios' : 'Inventario General';
            App.showToast(`La sección "${title}" estará disponible próximamente para ${name}. Â¡Gracias por tu paciencia!`, 'error');
            return;
        }

        // If trying to access usuarios and not admin, require admin password
        if (page === 'usuarios' && !Auth.isAdmin()) {
            this.pendingPage = page;
            document.getElementById('adminPassMessage').textContent = 'Ingrese la contraseña de administrador para acceder a la sección de Usuarios.';
            document.getElementById('adminPassError').classList.add('d-none');
            document.getElementById('adminPassInput').value = '';
            const modal = new bootstrap.Modal(document.getElementById('adminPassModal'));
            modal.show();
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
        if (page === 'horarios') {
            this.renderScheduleCalendar();
        } else if (page === 'historial') {
            this.renderHistoryTable();
        } else if (page === 'inventario') {
            Inventory.renderTable();
        } else if (page === 'ventas') {
            Sales.render();
        } else if (page === 'devoluciones') {
            Returns.renderTable();
        } else if (page === 'accesorios') {
            Inventory.renderAccesoriesTable();
        } else if (page === 'dashboard') {
            Dashboard.update();
        }

        // Update sidebar active state
        document.querySelectorAll('.sidebar .nav-link[data-page]').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            inventario: 'Inventario de Celulares',
            ventas: 'Ventas',
            devoluciones: 'Devoluciones',
            accesorios: 'Accesorios',
            'inventario-general': 'Inventario General',
            horarios: 'Horarios de Empleados',
            historial: 'Historial de Actividad',
            usuarios: 'Usuarios del Sistema'
        };
        document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';
    },

    showMainApp() {
        const user = Auth.getCurrentUser();
        if (user) {
            document.getElementById('sidebarUserName').textContent = user.fullName;
            document.getElementById('sidebarUserRole').textContent = user.role;
            document.getElementById('userAvatar').textContent = user.fullName.charAt(0).toUpperCase();
        }

        // Aplicar permisos del menú según el rol (restricciones para ciertas secciones)
        this.applyMenuPermissions();
        
        // Initialize modules
        this.initModules();
        this.navigateTo('dashboard');

        // Show welcome popup for new users
        Tour.showWelcomeIfNew();
    },

// Todos los usuarios ven todas las secciones del menú. Solo el superadministrador
    // (Angel) puede abrirlas; el resto verá la etiqueta "Próx." y un aviso al hacer clic.
    applyMenuPermissions() {
        const canAccess = Auth.canAccessRestricted();
        document.querySelectorAll('.restricted-link').forEach(li => {
            li.style.display = '';
            const badge = li.querySelector('.soon-badge');
            if (badge) {
                badge.style.display = canAccess ? 'none' : '';
                badge.textContent = canAccess ? '' : 'Próx.';
            }
        });
    },

    initModules() {
        Dashboard.init();
        Inventory.init();
        Sales.init();
        Returns.init();
        DataStore.seedAccessoryTemplates();
        Export.init();
        this.setupUsers();
        this.setupSupplies();
        this.setupSchedule();
        this.setupHistory();
        Inventory.setupAccesories();
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

    setupUsers() {
        // Add user button
        document.getElementById('addUserBtn').addEventListener('click', () => {
            document.getElementById('userModalTitle').innerHTML = '<i class="bi bi-person-plus me-2"></i>Nuevo Usuario';
            document.getElementById('userForm').reset();
            document.getElementById('userId').value = '';
            document.getElementById('userPassword').required = true;
            document.querySelector('#userModal .text-muted').style.display = 'none';
            const modal = new bootstrap.Modal(document.getElementById('userModal'));
            modal.show();
        });

        // Save user
        document.getElementById('saveUserBtn').addEventListener('click', () => {
            const id = document.getElementById('userId').value;
            const data = {
                fullName: document.getElementById('userFullName').value.trim(),
                username: document.getElementById('userUsername').value.trim(),
                email: document.getElementById('userEmail').value.trim(),
                password: document.getElementById('userPassword').value,
                role: document.getElementById('userRole').value
            };

            if (!data.fullName || !data.username || !data.email) {
                App.showToast('Por favor complete todos los campos obligatorios', 'error');
                return;
            }

            if (id) {
                // Edit mode
                const existingUser = DataStore.getUsers().find(u => u.id === id);
                // El rol "Administrador de programación" es EXCLUSIVO de ANGEL A. COLON NEGRON
                if (existingUser && (existingUser.id === 'usr_angel' || existingUser.username.toLowerCase() === 'angel')) {
                    data.role = 'Administrador de programación';
                    data.fullName = 'ANGEL A. COLON NEGRON';
                }
                const updateData = { fullName: data.fullName, username: data.username, email: data.email, role: data.role };
                if (data.password) updateData.password = data.password;
                DataStore.updateUser(id, updateData);
                this.logHistory('Edición de usuario', `Se editó el usuario "${data.username}" (nombre: ${data.fullName}, correo: ${data.email}, rol: ${data.role})`);

                // If editing own user, update the session immediately
                const currentUser = Auth.getCurrentUser();
                if (currentUser && currentUser.id === id) {
                    const updatedUser = DataStore.getUsers().find(u => u.id === id);
                    if (updatedUser) {
                        Auth.currentUser = updatedUser;
                        localStorage.setItem('xtrem_session', JSON.stringify(updatedUser));
                        // Update sidebar info
                        document.getElementById('sidebarUserName').textContent = updatedUser.fullName;
                        document.getElementById('sidebarUserRole').textContent = updatedUser.role;
                        document.getElementById('userAvatar').textContent = updatedUser.fullName.charAt(0).toUpperCase();
                        // Re-apply permissions based on new role
                        Inventory.applyRolePermissions();
                        Inventory.renderTable();
                    }
                }

                App.showToast('Usuario actualizado exitosamente', 'success');
            } else {
                // New user
                if (!data.password || data.password.length < 6) {
                    App.showToast('La contraseña debe tener al menos 6 caracteres', 'error');
                    return;
                }
                const existing = DataStore.findUserByUsername(data.username);
                if (existing) {
                    App.showToast('El nombre de usuario ya existe', 'error');
                    return;
                }
                DataStore.addUser(data);
                this.logHistory('Nuevo usuario', `Se creó el usuario "${data.username}" con nombre "${data.fullName}", correo "${data.email}" y rol "${data.role}"`);
                App.showToast('Usuario agregado exitosamente', 'success');
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
            modal.hide();
            this.renderUsersTable();
        });

        // Initial render
        this.renderUsersTable();
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

        tbody.innerHTML = users.map((u, idx) => {
            const date = new Date(u.createdAt).toLocaleDateString('es-GT');
            return `
                <tr>
                    <td class="fw-bold">${idx + 1}</td>
                    <td>${this.escapeHtml(u.fullName)}</td>
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
        document.getElementById('userRole').value = user.role;
        document.querySelector('#userModal .text-muted').style.display = 'block';

        const modal = new bootstrap.Modal(document.getElementById('userModal'));
        modal.show();
    },

deleteUser(id) {
        // Superadministrador (Angel) no puede ser eliminado nunca.
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
            `Â¿Estás seguro de eliminar al usuario "${user.fullName}"?`;
        document.getElementById('confirmDeleteBtn').onclick = () => {
            // DataStore.deleteUser solo elimina el id exacto y retorna true si lo hizo.
            const deleted = DataStore.deleteUser(id);
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
            if (deleted) {
                this.logHistory('Eliminación de usuario', `Se eliminó al usuario "${user.username}" (${user.fullName})`);
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
    setupSupplies() {
        // Add supply button
        document.getElementById('addSupplyBtn').addEventListener('click', () => {
            document.getElementById('supplyModalTitle').innerHTML = '<i class="bi bi-boxes me-2"></i>Agregar Suministro';
            document.getElementById('supplyForm').reset();
            document.getElementById('supplyId').value = '';
            const modal = new bootstrap.Modal(document.getElementById('supplyModal'));
            modal.show();
        });

        // Save supply
        document.getElementById('saveSupplyBtn').addEventListener('click', () => {
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
                DataStore.updateSupply(id, data);
                this.logHistory('Edición de suministro', `Se editó el suministro "${data.name}" (categoría: ${data.category}, cantidad: ${data.quantity})`);
                App.showToast('Suministro actualizado exitosamente', 'success');
            } else {
                DataStore.addSupply(data);
                this.logHistory('Nuevo suministro', `Se agregó el suministro "${data.name}" (categoría: ${data.category}, cantidad: ${data.quantity})`);
                App.showToast('Suministro agregado exitosamente', 'success');
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById('supplyModal'));
            modal.hide();
            this.renderSuppliesTable();
        });

        // Search and filter events
        document.getElementById('searchSupplies').addEventListener('input', () => this.renderSuppliesTable());
        document.getElementById('filterSuppliesCategory').addEventListener('change', () => this.renderSuppliesTable());
        document.getElementById('filterSuppliesStatus').addEventListener('change', () => this.renderSuppliesTable());

        // Export supplies PDF
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

            // Header profesional
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

            // Metadata
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
            const isLow = s.quantity <= s.minStock;
            const date = s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('es-GT') : '-';
            return `
                <tr>
                    <td class="fw-bold">${i + 1}</td>
                    <td>${this.escapeHtml(s.name)}</td>
                    <td><span class="badge bg-secondary">${this.escapeHtml(s.category)}</span></td>
                    <td class="fw-bold ${isLow ? 'text-danger' : 'text-success'}">${s.quantity}</td>
                    <td>${this.escapeHtml(s.unit || 'Unidades')}</td>
                    <td>${s.minStock || 0}</td>
                    <td>${isLow ? '<span class="badge bg-danger">Stock Bajo</span>' : '<span class="badge bg-success">OK</span>'}</td>
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
        document.getElementById('deleteModalMessage').textContent = `Â¿Estás seguro de eliminar "${supply.name}"?`;
        document.getElementById('confirmDeleteBtn').onclick = () => {
            DataStore.deleteSupply(id);
            this.logHistory('Eliminación de suministro', `Se eliminó el suministro "${supply.name}"`);
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
            App.showToast('Suministro eliminado exitosamente', 'success');
            this.renderSuppliesTable();
        };
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    },

    // ===== SCHEDULE =====
    setupSchedule() {
        document.getElementById('addScheduleBtn').addEventListener('click', () => {
            document.getElementById('scheduleModalTitle').innerHTML = '<i class="bi bi-calendar-plus me-2"></i>Agregar Horario';
            document.getElementById('scheduleForm').reset();
            document.getElementById('scheduleId').value = '';
            document.getElementById('scheduleDate').value = '';
            const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
            modal.show();
        });

        document.getElementById('saveScheduleBtn').addEventListener('click', () => {
            const id = document.getElementById('scheduleId').value;
            const dateValue = document.getElementById('scheduleDate').value;
            const dayName = dateValue ? (() => {
                const d = new Date(dateValue + 'T00:00:00');
                const names = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
                return names[(d.getDay() + 6) % 7];
            })() : '';

            const data = {
                employeeName: document.getElementById('scheduleEmployee').value.trim(),
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
                DataStore.updateScheduleEntry(id, data);
                this.logHistory('Edición de horario', `Se editó el horario de "${data.employeeName}" (${data.date}, ${data.startTime}-${data.endTime}, rol: ${data.role})`);
                App.showToast('Horario actualizado exitosamente', 'success');
            } else {
                DataStore.addScheduleEntry(data);
                this.logHistory('Nuevo horario', `Se agregó el horario de "${data.employeeName}" (${data.date}, ${data.startTime}-${data.endTime}, rol: ${data.role})`);
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

        DataStore.seedSundayClosures();
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
                    html += `<small class="text-muted d-block text-center" style="font-size:0.7rem">â€”</small>`;
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
                html += `<small class="text-muted d-block text-center" style="font-size:0.7rem">â€”</small>`;
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
        document.getElementById('scheduleEmployee').value = entry.employeeName;
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
            `Â¿Estás seguro de eliminar el horario de "${entry.employeeName}" (${entry.date || entry.day})?`;
        document.getElementById('confirmDeleteBtn').onclick = () => {
            DataStore.deleteScheduleEntry(id);
            this.logHistory('Eliminación de horario', `Se eliminó el horario de "${entry.employeeName}" (${entry.date || entry.day})`);
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
            App.showToast('Horario eliminado exitosamente', 'success');
            this.renderScheduleCalendar();
        };
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    },

    // ===== HISTORY =====
    setupHistory() {
        document.getElementById('searchHistory').addEventListener('input', () => this.renderHistoryTable());
        document.getElementById('filterHistoryFrom').addEventListener('change', () => this.renderHistoryTable());
        document.getElementById('filterHistoryTo').addEventListener('change', () => this.renderHistoryTable());
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            DataStore.clearHistory();
            this.renderHistoryTable();
            App.showToast('Historial limpiado exitosamente', 'success');
        });

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

    logHistory(action, detail) {
        const user = Auth.getCurrentUser();
        DataStore.addHistoryEntry({
            user: user ? user.fullName : 'Sistema',
            action: action,
            detail: detail
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

