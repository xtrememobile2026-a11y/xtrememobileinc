/**
 * XTREM MOBILE - Permissions Module
 * Resuelve el acceso a áreas del menú y a permisos especiales (capabilities) de cada
 * usuario, combinando su rol asignado (xtrem_roles) con ajustes individuales por
 * usuario (areaOverrides / capabilityOverrides). El superadministrador (Angel) siempre
 * tiene acceso total, sin importar lo que digan los roles, para que nunca pueda
 * auto-bloquearse desde la sección "Áreas de Usuarios".
 */

const Permissions = {
    AREA_KEYS: ['dashboard', 'inventario', 'accesorios', 'inventario-general', 'horarios', 'ventas', 'compras', 'historial', 'usuarios', 'sql-editor'],

    AREA_LABELS: {
        'dashboard': 'Dashboard',
        'inventario': 'Inventario',
        'accesorios': 'Accesorios',
        'inventario-general': 'Inventario General',
        'horarios': 'Horarios',
        'ventas': 'Ventas',
        'compras': 'Compras',
        'historial': 'Historial',
        'usuarios': 'Usuarios',
        'sql-editor': 'SQL Editor'
    },

    CAPABILITY_KEYS: ['manageUsers', 'changeRoles', 'editInventory', 'viewCost', 'manageSales', 'manageCuadre', 'viewCuadreHistory', 'clearHistory', 'sqlEditor'],

    CAPABILITY_LABELS: {
        manageUsers: 'Añadir y editar usuarios',
        changeRoles: 'Cambiar el rol de un usuario',
        editInventory: 'Editar inventario (agregar / editar / eliminar productos)',
        viewCost: 'Ver el costo del equipo',
        manageSales: 'Registrar ventas',
        manageCuadre: 'Hacer cuadre de caja',
        viewCuadreHistory: 'Ver historial de cuadres de caja',
        clearHistory: 'Limpiar el historial de actividad',
        sqlEditor: 'Usar el Editor SQL'
    },

    // Roles semilla del sistema. Replican el comportamiento que tenía el sistema
    // antes de existir "Áreas de Usuarios", para que nadie pierda acceso al migrar.
    DEFAULT_ROLES: [
        {
            id: 'role_admin_prog',
            name: 'Administrador de programación',
            isSystem: true,
            deletable: false,
            areas: {
                dashboard: 'full', inventario: 'full', accesorios: 'full', 'inventario-general': 'full',
                horarios: 'full', ventas: 'full', compras: 'full', historial: 'full', usuarios: 'full', 'sql-editor': 'full'
            },
            capabilities: {
                manageUsers: true, changeRoles: true, editInventory: true, viewCost: true,
                manageSales: true, manageCuadre: true, viewCuadreHistory: true, clearHistory: true, sqlEditor: true
            }
        },
        {
            id: 'role_administrador',
            name: 'Administrador',
            isSystem: true,
            deletable: false,
            areas: {
                dashboard: 'full', inventario: 'full', accesorios: 'none', 'inventario-general': 'none',
                horarios: 'full', ventas: 'full', compras: 'full', historial: 'full', usuarios: 'full', 'sql-editor': 'none'
            },
            capabilities: {
                manageUsers: true, changeRoles: true, editInventory: true, viewCost: true,
                manageSales: true, manageCuadre: true, viewCuadreHistory: true, clearHistory: true, sqlEditor: false
            }
        },
        {
            id: 'role_vendedor',
            name: 'Vendedor',
            isSystem: true,
            deletable: false,
            areas: {
                dashboard: 'full', inventario: 'full', accesorios: 'none', 'inventario-general': 'none',
                horarios: 'full', ventas: 'full', compras: 'none', historial: 'full', usuarios: 'none', 'sql-editor': 'none'
            },
            capabilities: {
                manageUsers: false, changeRoles: false, editInventory: true, viewCost: false,
                manageSales: true, manageCuadre: true, viewCuadreHistory: true, clearHistory: false, sqlEditor: false
            }
        },
        {
            id: 'role_inventario',
            name: 'Inventario',
            isSystem: true,
            deletable: false,
            areas: {
                dashboard: 'full', inventario: 'full', accesorios: 'none', 'inventario-general': 'none',
                horarios: 'full', ventas: 'full', compras: 'full', historial: 'full', usuarios: 'none', 'sql-editor': 'none'
            },
            capabilities: {
                manageUsers: false, changeRoles: false, editInventory: false, viewCost: false,
                manageSales: true, manageCuadre: false, viewCuadreHistory: false, clearHistory: false, sqlEditor: false
            }
        }
    ],

    getRoles() {
        return (typeof DataStore !== 'undefined' ? DataStore.getRoles() : []) || [];
    },

    getRoleById(id) {
        if (!id) return null;
        return this.getRoles().find(r => r.id === id) || null;
    },

    getRoleForUser(user) {
        if (!user) return null;
        if (user.roleId) {
            const byId = this.getRoleById(user.roleId);
            if (byId) return byId;
        }
        const byName = this.getRoles().find(r => (r.name || '').toLowerCase() === (user.role || '').toLowerCase());
        if (byName) return byName;
        return this.getRoleById('role_vendedor');
    },

    // Devuelve 'full' | 'soon' | 'none'
    getEffectiveAreaStatus(user, areaKey) {
        if (!user) return 'none';
        // "Actualizaciones" es una página informativa disponible para todos los usuarios,
        // no forma parte de la matriz de permisos configurable.
        if (areaKey === 'actualizaciones') return 'full';
        if (typeof Auth !== 'undefined' && Auth.isSuperAdmin && Auth.isSuperAdmin()) return 'full';
        const override = user.areaOverrides && user.areaOverrides[areaKey];
        if (override === 'full' || override === 'soon' || override === 'none') return override;
        const role = this.getRoleForUser(user);
        return (role && role.areas && role.areas[areaKey]) || 'none';
    },

    getEffectiveCapability(user, capKey) {
        if (!user) return false;
        if (typeof Auth !== 'undefined' && Auth.isSuperAdmin && Auth.isSuperAdmin()) return true;
        const override = user.capabilityOverrides && user.capabilityOverrides[capKey];
        if (override === true || override === false) return override;
        const role = this.getRoleForUser(user);
        return !!(role && role.capabilities && role.capabilities[capKey]);
    }
};
