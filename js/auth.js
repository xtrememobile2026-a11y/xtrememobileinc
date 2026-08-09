/**
 * XTREM MOBILE - Authentication Module
 * Maneja login y gestión de sesión
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

    login(username, password) {
        const user = DataStore.findUser(username, password);
        if (user) {
            this.currentUser = user;
            localStorage.setItem('xtrem_session', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: 'Usuario o contraseña incorrectos' };
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

canManageUsers() {
        return this.isAdmin() || this.isSuperAdmin();
    },

    // Solo el superadministrador (Angel) ve las secciones restringidas
    canAccessRestricted() {
        return this.isSuperAdmin();
    },

    updateProfile(data) {
        if (this.currentUser) {
            const updated = DataStore.updateUser(this.currentUser.id, data);
            if (updated) {
                this.currentUser = updated;
                localStorage.setItem('xtrem_session', JSON.stringify(updated));
                return true;
            }
        }
        return false;
    }
};
