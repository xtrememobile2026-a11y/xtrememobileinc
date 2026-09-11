-- ============================================
-- XTREME MOBILE - Schema Supabase
-- ============================================

-- Tabla: users
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'Vendedor',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla: products
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    model TEXT NOT NULL,
    imei TEXT,
    color TEXT,
    storage TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Nuevo',
    entry_date TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla: supplies
CREATE TABLE IF NOT EXISTS public.supplies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'Unidades',
    min_stock INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla: schedule
CREATE TABLE IF NOT EXISTS public.schedule (
    id TEXT PRIMARY KEY,
    employee_name TEXT NOT NULL,
    date TEXT,
    day TEXT,
    start_time TEXT NOT NULL DEFAULT '08:00',
    end_time TEXT NOT NULL DEFAULT '17:00',
    role TEXT DEFAULT 'Vendedor',
    notes TEXT
);

-- Tabla: history
CREATE TABLE IF NOT EXISTS public.history (
    id TEXT PRIMARY KEY,
    user_name TEXT,
    action TEXT,
    detail TEXT,
    date_time TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla: sales
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    product_model TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    customer_name TEXT,
    customer_phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_supplies_category ON public.supplies(category);
CREATE INDEX IF NOT EXISTS idx_schedule_date ON public.schedule(date);
CREATE INDEX IF NOT EXISTS idx_history_date_time ON public.history(date_time);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);

-- ============================================
-- MIGRACIÓN v2: Roles/Permisos, Cuadre de Caja,
-- Costo del equipo, carrito de ventas (ticket) y nota de recibo.
-- Ejecutar este bloque en el SQL Editor de Supabase para actualizar
-- una base de datos creada con la versión anterior de este esquema.
-- ============================================

-- Costo del equipo (visible solo para roles con el permiso "viewCost")
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost NUMERIC(10,2);

-- Carrito de ventas: varias líneas de venta comparten un mismo ticket_id,
-- más el nombre del vendedor y la nota de recibo escrita al momento de vender.
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS seller_name TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS seller_id TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS ticket_id TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS receipt_note TEXT;
CREATE INDEX IF NOT EXISTS idx_sales_ticket_id ON public.sales(ticket_id);

-- Sistema de permisos: rol asignado + ajustes individuales por usuario
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS area_overrides JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS capability_overrides JSONB DEFAULT '{}'::jsonb;

-- Tabla: roles (definidos por defecto y los que cree el Administrador de programación)
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT false,
    deletable BOOLEAN NOT NULL DEFAULT true,
    areas JSONB NOT NULL DEFAULT '{}'::jsonb,
    capabilities JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Tabla: cash_counts (Cuadre de Caja)
CREATE TABLE IF NOT EXISTS public.cash_counts (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    denominations JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_counted NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_expected NUMERIC(10,2) NOT NULL DEFAULT 0,
    difference NUMERIC(10,2) NOT NULL DEFAULT 0,
    note TEXT,
    user_id TEXT,
    user_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cash_counts_date ON public.cash_counts(date);

-- ============================================
-- MIGRACIÓN v3: Sección "Compras" (reabastecimiento)
-- ============================================
CREATE TABLE IF NOT EXISTS public.purchase_requests (
    id TEXT PRIMARY KEY,
    product_type TEXT NOT NULL DEFAULT 'inventario',
    product_id TEXT,
    name TEXT NOT NULL,
    category TEXT,
    color TEXT,
    detail TEXT,
    ordered BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_product_id ON public.purchase_requests(product_id);
