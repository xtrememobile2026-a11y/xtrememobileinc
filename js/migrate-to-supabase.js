/**
 * XTREM MOBILE - Migración manual a Supabase
 * Este archivo YA NO se carga automáticamente en index.html (para no ejecutarse en
 * cada carga de página). Si alguna vez hace falta forzar una subida completa de todos
 * los datos locales a Supabase, abre la consola del navegador y ejecuta:
 *   migrateToSupabase()
 * (Necesitas haber cargado este archivo, por ejemplo pegando su contenido en la consola).
 */
async function migrateToSupabase() {
    console.log('Iniciando migración a Supabase...');

    if (typeof SupabaseService === 'undefined') {
        console.error('SupabaseService no está cargado');
        return false;
    }

    const connected = await SupabaseService.init();
    if (!connected) {
        console.error('No se pudo conectar a Supabase. Verifica la configuración en supabase-config.js');
        return false;
    }

    const result = await SupabaseService.migrateAllData();

    if (result) {
        console.log('✅ Migración completada exitosamente. Los datos ahora están en Supabase.');
    } else {
        console.error('❌ Error durante la migración. Revisa los mensajes anteriores.');
    }

    return result;
}
