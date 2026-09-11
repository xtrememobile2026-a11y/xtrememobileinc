-- ============================================
-- XTREME MOBILE - Supabase Database Setup
-- Ejecuta este SQL en el SQL Editor de Supabase
-- ============================================

-- Eliminar tablas si existen (para reinicio limpio)
DROP TABLE IF EXISTS history CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS schedule CASCADE;
DROP TABLE IF EXISTS supplies CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- TABLA: users
-- ============================================
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Vendedor',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete users" ON users FOR DELETE USING (true);

-- ============================================
-- TABLA: products
-- ============================================
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    model TEXT NOT NULL,
    imei TEXT DEFAULT '',
    color TEXT DEFAULT '',
    storage TEXT DEFAULT '',
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Nuevo',
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_model ON products(model);
CREATE INDEX idx_products_status ON products(status);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update products" ON products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete products" ON products FOR DELETE USING (true);

-- ============================================
-- TABLA: sales
-- ============================================
CREATE TABLE sales (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    product_model TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    customer_name TEXT DEFAULT '',
    customer_phone TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX idx_sales_product_id ON sales(product_id);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read sales" ON sales FOR SELECT USING (true);
CREATE POLICY "Allow public insert sales" ON sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update sales" ON sales FOR UPDATE USING (true);
CREATE POLICY "Allow public delete sales" ON sales FOR DELETE USING (true);

-- ============================================
-- TABLA: supplies
-- ============================================
CREATE TABLE supplies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'Unidades',
    notes TEXT DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supplies_category ON supplies(category);
CREATE INDEX idx_supplies_name ON supplies(name);

ALTER TABLE supplies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read supplies" ON supplies FOR SELECT USING (true);
CREATE POLICY "Allow public insert supplies" ON supplies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update supplies" ON supplies FOR UPDATE USING (true);
CREATE POLICY "Allow public delete supplies" ON supplies FOR DELETE USING (true);

-- ============================================
-- TABLA: schedule
-- ============================================
CREATE TABLE schedule (
    id TEXT PRIMARY KEY,
    employee_name TEXT NOT NULL,
    day TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Vendedor',
    notes TEXT DEFAULT '',
    date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX idx_schedule_date ON schedule(date);
CREATE INDEX idx_schedule_employee ON schedule(employee_name);

ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read schedule" ON schedule FOR SELECT USING (true);
CREATE POLICY "Allow public insert schedule" ON schedule FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update schedule" ON schedule FOR UPDATE USING (true);
CREATE POLICY "Allow public delete schedule" ON schedule FOR DELETE USING (true);

-- ============================================
-- TABLA: history
-- ============================================
CREATE TABLE history (
    id TEXT PRIMARY KEY,
    date_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT DEFAULT ''
);

CREATE INDEX idx_history_date_time ON history(date_time DESC);
CREATE INDEX idx_history_user ON history(user_name);

ALTER TABLE history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read history" ON history FOR SELECT USING (true);
CREATE POLICY "Allow public insert history" ON history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update history" ON history FOR UPDATE USING (true);
CREATE POLICY "Allow public delete history" ON history FOR DELETE USING (true);

-- ============================================
-- INSERTAR DATOS INICIALES - USUARIOS
-- ============================================
INSERT INTO users (id, full_name, username, password, email, role, created_at) VALUES
('usr_001', 'Jessenia', 'Jessenia', 'admin123', 'admin@xtremmobile.com', 'Administrador', '2026-07-30T17:01:44.011Z'),
('usr_1785440210347', 'ZORIMAR ORTIZ OTERO', 'Zory', 'zory123', 'zory@xtrememobile.com', 'Vendedor', '2026-07-30T19:36:50.347Z'),
('usr_1785445587996', 'Chetzaly', 'Cheche', 'che123', 'chetaly@xtrememobile.com', 'Inventario', '2026-07-30T21:06:27.996Z'),
('usr_angel', 'ANGEL A. COLON NEGRON', 'Angel', 'angel123', 'angel@xtremmobile.com', 'Administrador de programación', '2026-08-08T20:53:29.633Z');

-- ============================================
-- INSERTAR DATOS INICIALES - PRODUCTOS
-- ============================================
INSERT INTO products (id, category, model, imei, color, storage, price, stock, min_stock, status, entry_date, created_at) VALUES
('prod_001', 'ANDROID', 'Samsung Galaxy S24 Ultra', '357986123456789', 'Titanio Negro', '512GB', 8999.00, 5, 0, 'Nuevo', '2025-01-15', '2025-01-15T08:00:00.000Z'),
('prod_002', 'ANDROID', 'Samsung Galaxy A55', '357986987654321', 'Azul Hielo', '256GB', 3299.00, 8, 0, 'Nuevo', '2025-01-20', '2025-01-20T09:30:00.000Z'),
('prod_003', 'ANDROID', 'Xiaomi Redmi Note 13 Pro', '864392123456788', 'Verde Esmeralda', '256GB', 2199.00, 12, 0, 'Nuevo', '2025-02-01', '2025-02-01T10:00:00.000Z'),
('prod_004', 'ANDROID', 'Motorola Edge 50 Pro', '351234567891234', 'Negro Lunar', '256GB', 4599.00, 3, 0, 'Nuevo', '2025-02-05', '2025-02-05T11:15:00.000Z'),
('prod_005', 'IPHONE', 'iPhone 16 Pro Max', '356789123456788', 'Titanio Natural', '256GB', 12999.00, 4, 0, 'Nuevo', '2025-01-10', '2025-01-10T08:30:00.000Z'),
('prod_006', 'IPHONE', 'iPhone 16 Pro', '356789987654322', 'Titanio Azul', '128GB', 10999.00, 6, 0, 'Nuevo', '2025-01-12', '2025-01-12T09:00:00.000Z'),
('prod_007', 'IPHONE', 'iPhone 15', '356789456123789', 'Rosa', '128GB', 7999.00, 7, 0, 'Nuevo', '2025-01-25', '2025-01-25T10:45:00.000Z'),
('prod_008', 'IPHONE', 'iPhone 14 Plus', '356789321654987', 'Amarillo', '128GB', 6499.00, 3, 0, 'Seminuevo', '2024-12-15', '2024-12-15T10:00:00.000Z'),
('prod_009', 'INTERNET', 'Router Tp-Link WiFi 6', '', 'Negro', '', 599.00, 15, 0, 'Nuevo', '2025-01-18', '2025-01-18T08:00:00.000Z'),
('prod_010', 'INTERNET', 'Módem Huawei 4G LTE', '866394052837461', 'Blanco', '', 899.00, 10, 0, 'Nuevo', '2025-01-22', '2025-01-22T09:00:00.000Z'),
('prod_011', 'INTERNET', 'Amplificador WiFi Mesh', '', 'Blanco', '', 399.00, 20, 0, 'Nuevo', '2025-02-03', '2025-02-03T10:30:00.000Z'),
('prod_012', 'GALAXY WATCH', 'Galaxy Watch 6 Classic', '358987654321012', 'Plata', '16GB', 2999.00, 6, 0, 'Nuevo', '2025-01-16', '2025-01-16T08:15:00.000Z'),
('prod_013', 'GALAXY WATCH', 'Galaxy Watch FE', '358987123456789', 'Negro', '16GB', 1899.00, 9, 0, 'Nuevo', '2025-01-28', '2025-01-28T11:00:00.000Z'),
('prod_014', 'GALAXY WATCH', 'Galaxy Watch 6', '358987789456123', 'Oro Rosa', '16GB', 2399.00, 4, 0, 'Seminuevo', '2024-12-20', '2024-12-20T09:30:00.000Z'),
('prod_015', 'APPLE WATCH', 'Apple Watch Ultra 2', '358123456789012', 'Titanio', '64GB', 8999.00, 2, 0, 'Nuevo', '2025-01-08', '2025-01-08T08:00:00.000Z'),
('prod_016', 'APPLE WATCH', 'Apple Watch Series 9', '358123987654321', 'Medianoche', '64GB', 4999.00, 5, 0, 'Nuevo', '2025-01-14', '2025-01-14T09:45:00.000Z'),
('prod_017', 'APPLE WATCH', 'Apple Watch SE 2', '358123456987654', 'Estelar', '32GB', 3299.00, 8, 0, 'Nuevo', '2025-02-02', '2025-02-02T10:15:00.000Z'),
('prod_018', 'AUDIFONOS', 'AirPods Pro 2 USB-C', '', 'Blanco', '', 1599.00, 12, 0, 'Nuevo', '2025-01-19', '2025-01-19T08:30:00.000Z'),
('prod_019', 'AUDIFONOS', 'Galaxy Buds3 Pro', '', 'Plata', '', 1399.00, 10, 0, 'Nuevo', '2025-01-26', '2025-01-26T09:15:00.000Z'),
('prod_020', 'AUDIFONOS', 'JBL Tune 760NC', '', 'Negro', '', 899.00, 14, 0, 'Nuevo', '2025-02-04', '2025-02-04T11:30:00.000Z'),
('prod_021', 'AUDIFONOS', 'Audífonos Huawei FreeBuds Pro 3', '', 'Plata', '', 1199.00, 7, 0, 'Nuevo', '2025-02-06', '2025-02-06T10:00:00.000Z'),
('prod_022', 'TELEFONOS DEL GOBIERNO', 'Teléfono Gobierno Básico', '357987123456789', 'Negro', '8GB', 0, 50, 0, 'Nuevo', '2025-01-05', '2025-01-05T08:00:00.000Z'),
('prod_023', 'TELEFONOS DEL GOBIERNO', 'Teléfono Gobierno Avanzado', '357987987654321', 'Azul Marino', '16GB', 0, 30, 0, 'Nuevo', '2025-01-15', '2025-01-15T08:00:00.000Z'),
('prod_024', 'ANDROID', 'Samsung Galaxy Z Fold6', '357986112233445', 'Gris Oscuro', '512GB', 15999.00, 2, 0, 'Nuevo', '2025-02-08', '2025-02-08T09:00:00.000Z'),
('prod_025', 'IPHONE', 'iPhone 16', '356789789123456', 'Azul', '128GB', 8999.00, 5, 0, 'Nuevo', '2025-02-10', '2025-02-10T10:30:00.000Z'),
('prod_026', 'ACCESORIOS', 'Cargador Rápido 25W USB-C', '', 'Blanco', '', 199.00, 30, 2, 'Nuevo', '2025-01-20', '2025-01-20T08:00:00.000Z'),
('prod_027', 'ACCESORIOS', 'Cargador Inalámbrico Samsung 15W', '', 'Negro', '', 399.00, 15, 2, 'Nuevo', '2025-01-22', '2025-01-22T08:30:00.000Z'),
('prod_028', 'ACCESORIOS', 'Cargador MagSafe Apple 25W', '', 'Blanco', '', 599.00, 10, 2, 'Nuevo', '2025-01-25', '2025-01-25T09:00:00.000Z'),
('prod_029', 'ACCESORIOS', 'Cargador de Carro USB-C 45W', '', 'Negro', '', 149.00, 25, 2, 'Nuevo', '2025-01-28', '2025-01-28T09:30:00.000Z'),
('prod_030', 'ACCESORIOS', 'Template de Vidrio Templado Galaxy S24', '', 'Transparente', '', 79.00, 40, 2, 'Nuevo', '2025-02-01', '2025-02-01T10:00:00.000Z'),
('prod_031', 'ACCESORIOS', 'Template de Vidrio Templado iPhone 16 Pro', '', 'Transparente', '', 99.00, 35, 2, 'Nuevo', '2025-02-02', '2025-02-02T10:30:00.000Z'),
('prod_032', 'ACCESORIOS', 'Protector de Cámara Galaxy S24 Ultra', '', 'Negro', '', 89.00, 20, 2, 'Nuevo', '2025-02-03', '2025-02-03T11:00:00.000Z'),
('prod_033', 'ACCESORIOS', 'Protector de Cámara iPhone 16 Pro Max', '', 'Titanio', '', 109.00, 18, 2, 'Nuevo', '2025-02-04', '2025-02-04T11:30:00.000Z'),
('prod_034', 'ACCESORIOS', 'Chip SIM Claro Prepago', '', '', '', 25.00, 100, 2, 'Nuevo', '2025-01-10', '2025-01-10T08:00:00.000Z'),
('prod_035', 'ACCESORIOS', 'Chip SIM Claro Postpago', '', '', '', 0, 80, 2, 'Nuevo', '2025-01-10', '2025-01-10T08:00:00.000Z'),
('prod_036', 'ACCESORIOS', 'eSIM Claro Activación', '', '', '', 0, 999, 2, 'Nuevo', '2025-01-15', '2025-01-15T08:00:00.000Z'),
('prod_037', 'ACCESORIOS', 'Case Silicona Galaxy S24 Ultra', '', 'Negro', '', 129.00, 22, 2, 'Nuevo', '2025-02-05', '2025-02-05T12:00:00.000Z'),
('prod_038', 'ACCESORIOS', 'Case Silicona iPhone 16 Pro Max', '', 'Azul Marino', '', 149.00, 18, 2, 'Nuevo', '2025-02-06', '2025-02-06T12:30:00.000Z'),
('prod_039', 'ACCESORIOS', 'Cable USB-C a USB-C 2M', '', 'Negro', '', 89.00, 50, 2, 'Nuevo', '2025-02-07', '2025-02-07T13:00:00.000Z'),
('prod_040', 'ACCESORIOS', 'Adaptador USB-C a Jack 3.5mm', '', 'Negro', '', 59.00, 30, 2, 'Nuevo', '2025-02-08', '2025-02-08T13:30:00.000Z'),
('prod_041', 'ACCESORIOS', 'Template iPhone 14 Plus', '', '', '', 8.91, 1, 2, 'Nuevo', '2026-01-10', '2026-01-10T08:00:00.000Z'),
('prod_042', 'ACCESORIOS', 'Template iPhone 14 Pro', '', '', '', 8.91, 3, 2, 'Nuevo', '2026-01-10', '2026-01-10T08:00:00.000Z'),
('prod_043', 'ACCESORIOS', 'Template iPhone 14 Pro Max', '', '', '', 8.91, 2, 2, 'Nuevo', '2026-01-10', '2026-01-10T08:00:00.000Z'),
('prod_044', 'ACCESORIOS', 'Template iPhone 12', '', '', '', 8.91, 1, 2, 'Nuevo', '2026-01-10', '2026-01-10T08:00:00.000Z'),
('prod_045', 'ACCESORIOS', 'Template iPhone 13 Pro / iPhone 13', '', '', '', 8.91, 1, 2, 'Nuevo', '2026-01-10', '2026-01-10T08:00:00.000Z'),
('prod_046', 'ACCESORIOS', 'Template iPhone 11', '', '', '', 8.91, 1, 2, 'Nuevo', '2026-01-10', '2026-01-10T08:00:00.000Z'),
('prod_047', 'ACCESORIOS', 'Template iPhone 11 Pro', '', '', '', 8.91, 1, 2, 'Nuevo', '2026-01-10', '2026-01-10T08:00:00.000Z'),
('prod_048', 'ACCESORIOS', 'Template iPhone 7 / iPhone 8', '', '', '', 8.91, 1, 2, 'Nuevo', '2026-01-10', '2026-01-10T08:00:00.000Z'),
('prod_049', 'ACCESORIOS', 'Template iPhone 17 Air', '', '', '', 8.91, 1, 2, 'Nuevo', '2026-01-10', '2026-01-10T08:00:00.000Z'),
('prod_050', 'ACCESORIOS', 'Template iPhone 16 Plus', '', '', '', 8.91, 1, 2, 'Nuevo', '2026-01-10', '2026-01-10T08:00:00.000Z'),
('prod_051', 'ACCESORIOS', 'Template iPhone 13 Pro Max', '', '', '', 8.91, 1, 2, 'Nuevo', '2026-01-10', '2026-01-10T08:00:00.000Z'),
('prod_052', 'ACCESORIOS', 'Template iPhone 16E', '', '', '', 8.91, 3, 2, 'Nuevo', '2026-01-10', '2026-01-10T08:00:00.000Z'),
('prod_053', 'ACCESORIOS', 'Template iPhone 17 Pro', '', '', '', 8.91, 2, 2, 'Nuevo', '2026-01-10', '2026-01-10T08:00:00.000Z'),
('prod_054', 'ACCESORIOS', 'Template iPhone 16 Pro / 17 / 17 Pro', '', '', '', 8.91, 2, 2, 'Nuevo', '2026-01-10', '2026-01-10T08:00:00.000Z'),
('prod_055', 'ACCESORIOS', 'Template iPhone 15 / iPhone 16', '', '', '', 8.91, 1, 2, 'Nuevo', '2026-01-10', '2026-01-10T08:00:00.000Z'),
('prod_056', 'ACCESORIOS', 'Template iPhone 16', '', '', '', 8.91, 1, 2, 'Nuevo', '2026-01-10', '2026-01-10T08:00:00.000Z');

-- ============================================
-- INSERTAR DATOS INICIALES - VENTAS
-- ============================================
INSERT INTO sales (id, product_id, product_model, quantity, unit_price, total, customer_name, customer_phone, notes, created_at) VALUES
('sal_001', 'prod_005', 'iPhone 16 Pro Max', 1, 12999.00, 12999.00, 'Cliente Ejemplo', '5555-5555', 'Venta mostrador', NOW()),
('sal_002', 'prod_001', 'Samsung Galaxy S24 Ultra', 2, 8999.00, 17998.00, 'Juan Perez', '4444-4444', 'Venta con tarjeta', NOW());

-- ============================================
-- INSERTAR DATOS INICIALES - SUMINISTROS
-- ============================================
INSERT INTO supplies (id, name, category, quantity, min_stock, unit, notes, updated_at) VALUES
('sup_001', 'Papel Incomm (Resma)', 'Papelería', 10, 3, 'Resmas', '', NOW()),
('sup_002', 'Papel ATH (Resma)', 'Papelería', 8, 3, 'Resmas', '', NOW()),
('sup_003', 'Papel Carta (Resma)', 'Papelería', 15, 5, 'Resmas', 'Papel largo para impresora', NOW()),
('sup_004', 'Papel Oficio (Resma)', 'Papelería', 6, 3, 'Resmas', 'Papel corto/tamaño oficio', NOW()),
('sup_005', 'Papel Tamaño Carta', 'Papelería', 12, 4, 'Resmas', 'Papel largo 8.5x11"', NOW()),
('sup_006', 'Papel Tamaño Oficio', 'Papelería', 5, 2, 'Resmas', 'Papel corto 8.5x14"', NOW()),
('sup_007', 'Tinta para Impresora - Negro', 'Tinta', 4, 2, 'Cartuchos', 'HP/Tinta negra', NOW()),
('sup_008', 'Tinta para Impresora - Color', 'Tinta', 3, 2, 'Cartuchos', 'HP/Tinta color (CMYK)', NOW()),
('sup_009', 'Toner para Impresora', 'Tinta', 2, 1, 'Unidades', 'Toner láser negro', NOW()),
('sup_010', 'Grapas para Engrapadora (Caja)', 'Oficina', 12, 5, 'Cajas', 'Grapas estándar 26/6', NOW()),
('sup_011', 'Grapas Grandes para Engrapadora (Caja)', 'Oficina', 6, 3, 'Cajas', 'Grapas 23/13 para documentos gruesos', NOW()),
('sup_012', 'Clips (Caja)', 'Oficina', 15, 5, 'Cajas', 'Clips estándar', NOW()),
('sup_013', 'Clips Mariposa (Caja)', 'Oficina', 8, 3, 'Cajas', 'Clips binder/tarjetero', NOW()),
('sup_014', 'Folders Colgantes (Paquete)', 'Oficina', 20, 10, 'Paquetes', 'Folders manila colgantes', NOW()),
('sup_015', 'Folders Manila (Paquete)', 'Oficina', 25, 10, 'Paquetes', 'Folders tamaño carta', NOW()),
('sup_016', 'Post-it Notas (Paquete)', 'Papelería', 10, 4, 'Paquetes', '', NOW()),
('sup_017', 'Bolígrafos (Caja)', 'Papelería', 20, 5, 'Cajas', 'Bolígrafos azul/negro/rojo', NOW()),
('sup_018', 'Lapiceros (Caja)', 'Papelería', 15, 5, 'Cajas', 'Lápices #2 estándar', NOW()),
('sup_019', 'Cinta Adhesiva (Unidad)', 'Oficina', 10, 4, 'Unidades', 'Cinta transparente', NOW()),
('sup_020', 'Engrapadora (Unidad)', 'Equipo', 3, 1, 'Unidades', 'Engrapadora de escritorio', NOW());

-- ============================================
-- INSERTAR DATOS INICIALES - HORARIOS
-- ============================================
INSERT INTO schedule (id, employee_name, day, start_time, end_time, role, notes, date) VALUES
('sch_001', 'Juan Pérez', 'Lunes', '08:00', '17:00', 'Vendedor', '', '2026-01-05'),
('sch_002', 'María López', 'Lunes', '09:00', '18:00', 'Vendedor', '', '2026-01-05'),
('sch_003', 'Carlos García', 'Martes', '08:00', '17:00', 'Técnico', '', '2026-01-06'),
('sch_004', 'Ana Martínez', 'Miércoles', '10:00', '19:00', 'Vendedor', '', '2026-01-07'),
('sch_005', 'Luis Rodríguez', 'Jueves', '08:00', '17:00', 'Inventario', '', '2026-01-08'),
('sch_006', 'Sofía Ramírez', 'Viernes', '09:00', '18:00', 'Vendedor', '', '2026-01-09');

-- ============================================
-- INSERTAR DATOS INICIALES - HISTORIAL
-- ============================================
INSERT INTO history (id, date_time, user_name, action, detail) VALUES
('hist_001', '2026-01-10T08:00:00.000Z', 'Jessenia', 'Login', 'Inicio de sesión exitoso'),
('hist_002', '2026-01-10T08:05:00.000Z', 'Jessenia', 'Producto Agregado', 'Se agregó iPhone 16 Pro Max'),
('hist_003', '2026-01-10T09:00:00.000Z', 'Zory', 'Venta Registrada', 'Venta de 1x iPhone 16 Pro Max');
