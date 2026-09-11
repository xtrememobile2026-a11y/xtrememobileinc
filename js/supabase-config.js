/**
 * XTREM MOBILE - Supabase Configuration
 * Configuración para conectar con Supabase
 */

const SUPABASE_CONFIG = {
    url: 'https://vlmyqzzinzdufpqxolhp.supabase.co',
    key: 'sb_publishable_swTT6_oKtwjpogxXQBUGAA_O0EsIpJm'
};

// Configuración de tablas
const TABLES = {
    users: 'users',
    products: 'products',
    sales: 'sales',
    supplies: 'supplies',
    schedule: 'schedule',
    history: 'history',
    roles: 'roles',
    cashCounts: 'cash_counts',
    purchaseRequests: 'purchase_requests'
};

// Función para inicializar Supabase
async function initSupabase() {
    try {
        const { createClient } = supabase;
        const supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        return supabaseClient;
    } catch (error) {
        console.error('Error inicializando Supabase:', error);
        return null;
    }
}

// Convierte camelCase a snake_case para las columnas de Supabase
function camelToSnake(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(camelToSnake);
    const result = {};
    for (const key of Object.keys(obj)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        result[snakeKey] = obj[key];
    }
    return result;
}

// Convierte snake_case a camelCase para el código JS
function snakeToCamel(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(snakeToCamel);
    const result = {};
    for (const key of Object.keys(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = obj[key];
    }
    return result;
}
