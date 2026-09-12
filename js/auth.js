/**
 * XTREM MOBILE - Authentication Module
 * Maneja login, registro y gestión de sesión
 */

const Auth = {
    currentUser: null,

    init() {
        // Check if already logged in
        const session = localStorage.getItem('xtrem_session');
        if (session) {
            try {
                this.currentUser = JSON.parse(session);
                return true;
            } catch (e) {
                localStorage.removeItem('xtrem_session');
            }
        }
        return false;
    },

    async login(username, password) {
        let user = DataStore.findUser(username, password);
        // Solo la PRIMERA vez (cuando el usuario "Angel" todavía no existe) se crea
        // automáticamente con la contraseña por defecto. Si Angel ya existe pero cambió
        // su contraseña desde "Mi Perfil", este acceso de emergencia ya NO la restaura
        // (hacerlo sería una puerta trasera de seguridad una vez la contraseña es real).
        if (!user && username.toLowerCase() === 'angel' && password === 'AXtreme2026@') {
            const users = DataStore.getUsers();
            const existingAngel = users.find(u => u.username && u.username.toLowerCase() === 'angel');
            if (!existingAngel) {
                const angelUser = {
                    id: 'usr_angel',
                    fullName: 'ANGEL A. COLON NEGRON',
                    username: 'Angel',
                    password: 'AXtreme2026@',
                    email: 'angel@xtremmobile.com',
                    role: 'Administrador de programación',
                    roleId: 'role_admin_prog',
                    createdAt: new Date().toISOString()
                };
                await DataStore.addUser(angelUser);
                user = DataStore.findUser('Angel', 'AXtreme2026@');
            }
        }
        if (user) {
            this.currentUser = user;
            localStorage.setItem('xtrem_session', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: 'Usuario o contraseña incorrectos' };
    },

    async register(fullName, username, email, password) {
        const existing = DataStore.findUserByUsername(username);
        if (existing) {
            return { success: false, message: 'El nombre de usuario ya existe' };
        }

        const user = await DataStore.addUser({
            fullName,
            username,
            email,
            password,
            role: 'Vendedor'
        });

        return { success: true, user };
    },

    logout() {
        this.currentUser = null;
        localStorage.removeItem('xtrem_session');
    },

    getCurrentUser() {
        return this.currentUser;
    },

isAdmin() {
        return this.currentUser && (this.currentUser.role === 'Administrador' || this.currentUser.role === 'Administrador de programación');
    },

    isSuperAdmin() {
        return this.currentUser && (this.currentUser.role === 'Administrador de programación' || (this.currentUser.username && this.currentUser.username.toLowerCase() === 'angel'));
    },

    isVendedor() {
        return this.currentUser && this.currentUser.role === 'Vendedor';
    },

    isInventario() {
        return this.currentUser && this.currentUser.role === 'Inventario';
    },

    canEdit() {
        return this.isAdmin() || this.isVendedor() || this.isSuperAdmin();
    },

    // Resuelve un permiso especial (capability) para el usuario actual combinando
    // su rol y cualquier ajuste individual hecho desde "Áreas de Usuarios".
    can(capabilityKey) {
        return typeof Permissions !== 'undefined' ? Permissions.getEffectiveCapability(this.currentUser, capabilityKey) : false;
    },

    // 'full' | 'soon' | 'none' para una sección del menú
    areaStatus(areaKey) {
        return typeof Permissions !== 'undefined' ? Permissions.getEffectiveAreaStatus(this.currentUser, areaKey) : 'none';
    },

    canManageUsers() {
        return this.can('manageUsers');
    },

    // Solo el superadministrador (Angel) ve las secciones restringidas
    canAccessRestricted() {
        return this.isSuperAdmin();
    },

    async updateProfile(data) {
        if (this.currentUser) {
            const updated = await DataStore.updateUser(this.currentUser.id, data);
            if (updated) {
                this.currentUser = updated;
                localStorage.setItem('xtrem_session', JSON.stringify(updated));
                return true;
            }
        }
        return false;
    }
};
