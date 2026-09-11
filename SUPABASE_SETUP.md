# Configuración de Supabase

## Pasos para conectar XTREM MOBILE con Supabase:

### 1. Crear cuenta en Supabase
- Ir a https://supabase.com
- Crear una cuenta nueva
- Crear un nuevo proyecto

### 2. Obtener credenciales
- En el proyecto, ir a **Settings** → **API**
- Copiar la **Project URL** y la **anon key**

### 3. Configurar el proyecto
Editar el archivo `js/supabase-config.js` y reemplazar:

```javascript
const SUPABASE_CONFIG = {
    url: 'TU_SUPABASE_URL_AQUI',        // Reemplazar con tu Project URL
    key: 'TU_SUPABASE_ANON_KEY_AQUI'    // Reemplazar con tu anon key
};
```

### 4. Crear tablas en Supabase
Ejecutar estos SQLs en el **SQL Editor** de Supabase:

```sql
-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Vendedor',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    model TEXT NOT NULL,
    imei TEXT,
    color TEXT,
    storage TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Nuevo',
    entry_date TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    quantity INTEGER DEFAULT 1,
    total DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de suministros
CREATE TABLE IF NOT EXISTS supplies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    unit TEXT,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de horarios
CREATE TABLE IF NOT EXISTS schedule (
    id TEXT PRIMARY KEY,
    employee_name TEXT NOT NULL,
    date TEXT,
    day TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    role TEXT,
    notes TEXT
);

-- Tabla de historial
CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Migrar datos existentes
Una vez configurado Supabase, los datos se sincronizarán automáticamente.
Para migrar los datos actuales de localStorage a Supabase, ejecutar en la consola del navegador:

```javascript
if (typeof SupabaseService !== 'undefined') {
    SupabaseService.migrateAllData().then(result => {
        alert(result ? 'Migración completada' : 'Error en migración');
    });
}
```

### 6. Verificar conexión
- Recargar la página
- Abrir la consola del navegador
- Debería aparecer: "Supabase conectado - Datos sincronizados con la nube"

## Notas importantes:
- Si Supabase no está configurado, la app funciona normalmente con localStorage
- Los datos se guardan en localStorage y se sincronizan con Supabase cuando está disponible
- Para desarrollo local, se puede usar Supabase Local
