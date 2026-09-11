/**
 * XTREM MOBILE - Módulo "Áreas de Usuarios"
 * Página exclusiva del superadministrador (Angel) para gestionar roles y
 * el acceso individual de cada usuario a las distintas áreas del sistema.
 */

const RolesAdmin = {
    selectedUserId: null,
    selectedRoleId: null,

    init() {
        document.getElementById('areasUserSelect').addEventListener('change', (e) => this.selectUser(e.target.value));
        document.getElementById('saveAreasUserBtn').addEventListener('click', () => this.saveUserOverrides());

        document.getElementById('addRoleBtn').addEventListener('click', () => this.newRole());
        document.getElementById('saveRoleBtn').addEventListener('click', () => this.saveRole());
        document.getElementById('deleteRoleBtn').addEventListener('click', () => this.deleteRole());

        this.populateUserSelect();
        this.renderRolesList();
    },

    onPageShow() {
        this.populateUserSelect();
        this.renderRolesList();
    },

    // ===== USUARIOS Y ACCESOS =====
    populateUserSelect() {
        const select = document.getElementById('areasUserSelect');
        const users = DataStore.getUsers();
        const current = select.value;
        select.innerHTML = '<option value="">Seleccionar usuario...</option>' +
            users.map(u => `<option value="${u.id}">${this.esc(u.fullName)} (${this.esc(u.username)})</option>`).join('');

        if (current && users.find(u => u.id === current)) {
            select.value = current;
        } else {
            document.getElementById('areasUserPanel').classList.add('d-none');
        }
    },

    selectUser(userId) {
        this.selectedUserId = userId || null;
        const panel = document.getElementById('areasUserPanel');
        if (!userId) {
            panel.classList.add('d-none');
            return;
        }
        panel.classList.remove('d-none');

        const user = DataStore.getUsers().find(u => u.id === userId);
        if (!user) return;

        const isAngel = user.id === 'usr_angel' || (user.username && user.username.toLowerCase() === 'angel');

        const roleSelect = document.getElementById('areasUserRoleSelect');
        const roles = Permissions.getRoles();
        roleSelect.innerHTML = roles.map(r => `<option value="${r.id}">${this.esc(r.name)}</option>`).join('');
        roleSelect.value = user.roleId || 'role_vendedor';
        roleSelect.disabled = isAngel;

        this.renderAreasGrid('areasUserAreasGrid', user.areaOverrides || {}, { mode: 'user', disabled: isAngel });
        this.renderCapsGrid('areasUserCapsGrid', user.capabilityOverrides || {}, { mode: 'user', disabled: isAngel });

        const saveBtn = document.getElementById('saveAreasUserBtn');
        saveBtn.disabled = isAngel;
        saveBtn.title = isAngel ? 'Angel siempre tiene acceso total y no se puede modificar' : '';
    },

    async saveUserOverrides() {
        const userId = this.selectedUserId;
        if (!userId) return;
        const user = DataStore.getUsers().find(u => u.id === userId);
        if (!user) return;

        const roleId = document.getElementById('areasUserRoleSelect').value;
        const roleObj = Permissions.getRoleById(roleId);

        const areaOverrides = {};
        document.querySelectorAll('#areasUserAreasGrid .permissions-area-select').forEach(sel => {
            if (sel.value !== 'role') areaOverrides[sel.dataset.area] = sel.value;
        });

        const capabilityOverrides = {};
        document.querySelectorAll('#areasUserCapsGrid .permissions-cap-select').forEach(sel => {
            if (sel.value === 'yes') capabilityOverrides[sel.dataset.cap] = true;
            else if (sel.value === 'no') capabilityOverrides[sel.dataset.cap] = false;
        });

        await DataStore.updateUser(userId, {
            roleId,
            role: roleObj ? roleObj.name : user.role,
            areaOverrides,
            capabilityOverrides
        });

        await App.logHistory('Permisos actualizados', `Se actualizaron los permisos de "${user.fullName}" (rol: ${roleObj ? roleObj.name : user.role})`);
        App.showToast('Permisos guardados exitosamente', 'success');

        // Si el usuario editado tiene la sesión activa en este navegador, refrescar su menú
        const current = Auth.getCurrentUser();
        if (current && current.id === userId) {
            const updated = DataStore.getUsers().find(u => u.id === userId);
            Auth.currentUser = updated;
            localStorage.setItem('xtrem_session', JSON.stringify(updated));
            App.applyMenuPermissions();
        }

        App.renderUsersTable();
        this.populateUserSelect();
        document.getElementById('areasUserSelect').value = userId;
    },

    // ===== GESTIÓN DE ROLES =====
    renderRolesList() {
        const container = document.getElementById('rolesListContainer');
        const roles = Permissions.getRoles();
        container.innerHTML = roles.map(r => `
            <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ${r.id === this.selectedRoleId ? 'active' : ''}" onclick="RolesAdmin.selectRole('${r.id}')">
                <span>${this.esc(r.name)}</span>
                ${r.isSystem ? '<span class="badge bg-secondary">Sistema</span>' : ''}
            </button>
        `).join('');
    },

    newRole() {
        this.selectedRoleId = null;
        document.getElementById('rolesEditorPanel').classList.remove('d-none');
        document.getElementById('rolesEditorEmpty').classList.add('d-none');
        document.getElementById('roleNameInput').value = '';
        document.getElementById('roleNameInput').disabled = false;
        document.getElementById('deleteRoleBtn').classList.add('d-none');
        this.renderAreasGrid('roleAreasGrid', {}, { mode: 'role' });
        this.renderCapsGrid('roleCapsGrid', {}, { mode: 'role' });
        this.renderRolesList();
    },

    selectRole(roleId) {
        this.selectedRoleId = roleId;
        const role = Permissions.getRoleById(roleId);
        if (!role) return;

        document.getElementById('rolesEditorPanel').classList.remove('d-none');
        document.getElementById('rolesEditorEmpty').classList.add('d-none');
        document.getElementById('roleNameInput').value = role.name;
        document.getElementById('roleNameInput').disabled = !!role.isSystem;
        document.getElementById('deleteRoleBtn').classList.toggle('d-none', !!role.isSystem || !role.deletable);

        const isSuperAdminRole = role.id === 'role_admin_prog';
        document.getElementById('saveRoleBtn').classList.toggle('d-none', isSuperAdminRole);

        this.renderAreasGrid('roleAreasGrid', role.areas || {}, { mode: 'role', disabled: isSuperAdminRole });
        this.renderCapsGrid('roleCapsGrid', role.capabilities || {}, { mode: 'role', disabled: isSuperAdminRole });

        this.renderRolesList();
    },

    async saveRole() {
        const name = document.getElementById('roleNameInput').value.trim();
        if (!name) {
            App.showToast('Ingresa un nombre para el rol', 'error');
            return;
        }

        const areas = {};
        document.querySelectorAll('#roleAreasGrid .permissions-area-select').forEach(sel => {
            areas[sel.dataset.area] = sel.value;
        });
        const capabilities = {};
        document.querySelectorAll('#roleCapsGrid .permissions-cap-checkbox').forEach(chk => {
            capabilities[chk.dataset.cap] = chk.checked;
        });

        if (this.selectedRoleId) {
            const role = Permissions.getRoleById(this.selectedRoleId);
            if (role && role.id === 'role_admin_prog') {
                App.showToast('El rol de Administrador de programación no se puede editar', 'error');
                return;
            }
            await DataStore.updateRole(this.selectedRoleId, { name, areas, capabilities });
            await App.logHistory('Rol actualizado', `Se actualizó el rol "${name}"`);
            App.showToast('Rol actualizado exitosamente', 'success');
        } else {
            const newRole = await DataStore.addRole({ name, areas, capabilities });
            this.selectedRoleId = newRole.id;
            await App.logHistory('Nuevo rol', `Se creó el rol "${name}"`);
            App.showToast('Rol creado exitosamente', 'success');
        }

        this.renderRolesList();
        if (this.selectedUserId) this.selectUser(this.selectedUserId);
    },

    async deleteRole() {
        if (!this.selectedRoleId) return;
        const role = Permissions.getRoleById(this.selectedRoleId);
        if (!role || role.isSystem) return;

        document.getElementById('deleteModalMessage').textContent = `¿Estás seguro de eliminar el rol "${role.name}"? Los usuarios que lo tengan pasarán a "Vendedor".`;
        document.getElementById('confirmDeleteBtn').onclick = async () => {
            await DataStore.deleteRole(this.selectedRoleId);
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
            await App.logHistory('Rol eliminado', `Se eliminó el rol "${role.name}"`);
            App.showToast('Rol eliminado exitosamente', 'success');
            this.selectedRoleId = null;
            document.getElementById('rolesEditorPanel').classList.add('d-none');
            document.getElementById('rolesEditorEmpty').classList.remove('d-none');
            this.renderRolesList();
            this.populateUserSelect();
            App.renderUsersTable();
        };
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    },

    // ===== HELPERS DE RENDERIZADO DE GRIDS =====
    renderAreasGrid(containerId, values, options) {
        options = options || {};
        const mode = options.mode || 'role';
        const container = document.getElementById(containerId);
        container.innerHTML = Permissions.AREA_KEYS.map(key => {
            const current = values[key] || (mode === 'user' ? 'role' : 'none');
            const opts = mode === 'user'
                ? [['role', 'Heredar del rol'], ['full', 'Acceso completo'], ['soon', 'Próximamente'], ['none', 'Sin acceso']]
                : [['full', 'Acceso completo'], ['soon', 'Próximamente'], ['none', 'Sin acceso']];
            return `
                <div class="permissions-row">
                    <span class="permissions-row-label">${this.esc(Permissions.AREA_LABELS[key])}</span>
                    <select class="form-select form-select-sm permissions-area-select" data-area="${key}" ${options.disabled ? 'disabled' : ''}>
                        ${opts.map(([v, l]) => `<option value="${v}" ${current === v ? 'selected' : ''}>${l}</option>`).join('')}
                    </select>
                </div>
            `;
        }).join('');
    },

    renderCapsGrid(containerId, values, options) {
        options = options || {};
        const mode = options.mode || 'role';
        const container = document.getElementById(containerId);
        container.innerHTML = Permissions.CAPABILITY_KEYS.map(key => {
            if (mode === 'user') {
                const current = values[key] === true ? 'yes' : (values[key] === false ? 'no' : 'inherit');
                return `
                    <div class="permissions-row">
                        <span class="permissions-row-label">${this.esc(Permissions.CAPABILITY_LABELS[key])}</span>
                        <select class="form-select form-select-sm permissions-cap-select" data-cap="${key}" ${options.disabled ? 'disabled' : ''}>
                            <option value="inherit" ${current === 'inherit' ? 'selected' : ''}>Heredar del rol</option>
                            <option value="yes" ${current === 'yes' ? 'selected' : ''}>Sí</option>
                            <option value="no" ${current === 'no' ? 'selected' : ''}>No</option>
                        </select>
                    </div>
                `;
            }
            const checked = !!values[key];
            return `
                <div class="permissions-row">
                    <span class="permissions-row-label">${this.esc(Permissions.CAPABILITY_LABELS[key])}</span>
                    <div class="form-check form-switch">
                        <input class="form-check-input permissions-cap-checkbox" type="checkbox" data-cap="${key}" ${checked ? 'checked' : ''} ${options.disabled ? 'disabled' : ''}>
                    </div>
                </div>
            `;
        }).join('');
    },

    esc(text) {
        const div = document.createElement('div');
        div.textContent = text == null ? '' : String(text);
        return div.innerHTML;
    }
};
