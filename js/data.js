/**
 * XTREM MOBILE - Data Store
 * Maneja toda la persistencia de datos en LocalStorage
 */

const DataStore = {
    // ===== DEFAULT DATA =====
    init() {
if (!localStorage.getItem('xtrem_users')) {
            const defaultUsers = [
{
                    id: 'usr_angel',
                    fullName: 'ANGEL A. COLON NEGRON',
                    username: 'Angel',
                    password: 'angel123',
                    email: 'angel@xtremmobile.com',
                    role: 'Administrador de programación',
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('xtrem_users', JSON.stringify(defaultUsers));
        } else {
            // Ensure Angel super admin exists even if users already existed
            this.ensureAngelUser();
        }

        if (!localStorage.getItem('xtrem_products')) {
            const defaultProducts = [
                {
                    id: 'prod_001',
                    category: 'ANDROID',
                    model: 'Samsung Galaxy S24 Ultra',
                    imei: '357986123456789',
                    color: 'Titanio Negro',
                    storage: '512GB',
                    price: 8999.00,
                    stock: 5,
                    status: 'Nuevo',
                    entryDate: '2025-01-15',
                    createdAt: '2025-01-15T08:00:00.000Z'
                },
                {
                    id: 'prod_002',
                    category: 'ANDROID',
                    model: 'Samsung Galaxy A55',
                    imei: '357986987654321',
                    color: 'Azul Hielo',
                    storage: '256GB',
                    price: 3299.00,
                    stock: 8,
                    status: 'Nuevo',
                    entryDate: '2025-01-20',
                    createdAt: '2025-01-20T09:30:00.000Z'
                },
                {
                    id: 'prod_003',
                    category: 'ANDROID',
                    model: 'Xiaomi Redmi Note 13 Pro',
                    imei: '864392123456788',
                    color: 'Verde Esmeralda',
                    storage: '256GB',
                    price: 2199.00,
                    stock: 12,
                    status: 'Nuevo',
                    entryDate: '2025-02-01',
                    createdAt: '2025-02-01T10:00:00.000Z'
                },
                {
                    id: 'prod_004',
                    category: 'ANDROID',
                    model: 'Motorola Edge 50 Pro',
                    imei: '351234567891234',
                    color: 'Negro Lunar',
                    storage: '256GB',
                    price: 4599.00,
                    stock: 3,
                    status: 'Nuevo',
                    entryDate: '2025-02-05',
                    createdAt: '2025-02-05T11:15:00.000Z'
                },
                {
                    id: 'prod_005',
                    category: 'IPHONE',
                    model: 'iPhone 16 Pro Max',
                    imei: '356789123456788',
                    color: 'Titanio Natural',
                    storage: '256GB',
                    price: 12999.00,
                    stock: 4,
                    status: 'Nuevo',
                    entryDate: '2025-01-10',
                    createdAt: '2025-01-10T08:30:00.000Z'
                },
                {
                    id: 'prod_006',
                    category: 'IPHONE',
                    model: 'iPhone 16 Pro',
                    imei: '356789987654322',
                    color: 'Titanio Azul',
                    storage: '128GB',
                    price: 10999.00,
                    stock: 6,
                    status: 'Nuevo',
                    entryDate: '2025-01-12',
                    createdAt: '2025-01-12T09:00:00.000Z'
                },
                {
                    id: 'prod_007',
                    category: 'IPHONE',
                    model: 'iPhone 15',
                    imei: '356789456123789',
                    color: 'Rosa',
                    storage: '128GB',
                    price: 7999.00,
                    stock: 7,
                    status: 'Nuevo',
                    entryDate: '2025-01-25',
                    createdAt: '2025-01-25T10:45:00.000Z'
                },
                {
                    id: 'prod_008',
                    category: 'IPHONE',
                    model: 'iPhone 14 Plus',
                    imei: '356789321654987',
                    color: 'Amarillo',
                    storage: '128GB',
                    price: 6499.00,
                    stock: 3,
                    status: 'Seminuevo',
                    entryDate: '2024-12-15',
                    createdAt: '2024-12-15T10:00:00.000Z'
                },
                {
                    id: 'prod_009',
                    category: 'INTERNET',
                    model: 'Router Tp-Link WiFi 6',
                    imei: '',
                    color: 'Negro',
                    storage: '',
                    price: 599.00,
                    stock: 15,
                    status: 'Nuevo',
                    entryDate: '2025-01-18',
                    createdAt: '2025-01-18T08:00:00.000Z'
                },
                {
                    id: 'prod_010',
                    category: 'INTERNET',
                    model: 'Módem Huawei 4G LTE',
                    imei: '866394052837461',
                    color: 'Blanco',
                    storage: '',
                    price: 899.00,
                    stock: 10,
                    status: 'Nuevo',
                    entryDate: '2025-01-22',
                    createdAt: '2025-01-22T09:00:00.000Z'
                },
                {
                    id: 'prod_011',
                    category: 'INTERNET',
                    model: 'Amplificador WiFi Mesh',
                    imei: '',
                    color: 'Blanco',
                    storage: '',
                    price: 399.00,
                    stock: 20,
                    status: 'Nuevo',
                    entryDate: '2025-02-03',
                    createdAt: '2025-02-03T10:30:00.000Z'
                },
                {
                    id: 'prod_012',
                    category: 'GALAXY WATCH',
                    model: 'Galaxy Watch 6 Classic',
                    imei: '358987654321012',
                    color: 'Plata',
                    storage: '16GB',
                    price: 2999.00,
                    stock: 6,
                    status: 'Nuevo',
                    entryDate: '2025-01-16',
                    createdAt: '2025-01-16T08:15:00.000Z'
                },
                {
                    id: 'prod_013',
                    category: 'GALAXY WATCH',
                    model: 'Galaxy Watch FE',
                    imei: '358987123456789',
                    color: 'Negro',
                    storage: '16GB',
                    price: 1899.00,
                    stock: 9,
                    status: 'Nuevo',
                    entryDate: '2025-01-28',
                    createdAt: '2025-01-28T11:00:00.000Z'
                },
                {
                    id: 'prod_014',
                    category: 'GALAXY WATCH',
                    model: 'Galaxy Watch 6',
                    imei: '358987789456123',
                    color: 'Oro Rosa',
                    storage: '16GB',
                    price: 2399.00,
                    stock: 4,
                    status: 'Seminuevo',
                    entryDate: '2024-12-20',
                    createdAt: '2024-12-20T09:30:00.000Z'
                },
                {
                    id: 'prod_015',
                    category: 'APPLE WATCH',
                    model: 'Apple Watch Ultra 2',
                    imei: '358123456789012',
                    color: 'Titanio',
                    storage: '64GB',
                    price: 8999.00,
                    stock: 2,
                    status: 'Nuevo',
                    entryDate: '2025-01-08',
                    createdAt: '2025-01-08T08:00:00.000Z'
                },
                {
                    id: 'prod_016',
                    category: 'APPLE WATCH',
                    model: 'Apple Watch Series 9',
                    imei: '358123987654321',
                    color: 'Medianoche',
                    storage: '64GB',
                    price: 4999.00,
                    stock: 5,
                    status: 'Nuevo',
                    entryDate: '2025-01-14',
                    createdAt: '2025-01-14T09:45:00.000Z'
                },
                {
                    id: 'prod_017',
                    category: 'APPLE WATCH',
                    model: 'Apple Watch SE 2',
                    imei: '358123456987654',
                    color: 'Estelar',
                    storage: '32GB',
                    price: 3299.00,
                    stock: 8,
                    status: 'Nuevo',
                    entryDate: '2025-02-02',
                    createdAt: '2025-02-02T10:15:00.000Z'
                },
                {
                    id: 'prod_018',
                    category: 'AUDIFONOS',
                    model: 'AirPods Pro 2 USB-C',
                    imei: '',
                    color: 'Blanco',
                    storage: '',
                    price: 1599.00,
                    stock: 12,
                    status: 'Nuevo',
                    entryDate: '2025-01-19',
                    createdAt: '2025-01-19T08:30:00.000Z'
                },
                {
                    id: 'prod_019',
                    category: 'AUDIFONOS',
                    model: 'Galaxy Buds3 Pro',
                    imei: '',
                    color: 'Plata',
                    storage: '',
                    price: 1399.00,
                    stock: 10,
                    status: 'Nuevo',
                    entryDate: '2025-01-26',
                    createdAt: '2025-01-26T09:15:00.000Z'
                },
                {
                    id: 'prod_020',
                    category: 'AUDIFONOS',
                    model: 'JBL Tune 760NC',
                    imei: '',
                    color: 'Negro',
                    storage: '',
                    price: 899.00,
                    stock: 14,
                    status: 'Nuevo',
                    entryDate: '2025-02-04',
                    createdAt: '2025-02-04T11:30:00.000Z'
                },
                {
                    id: 'prod_021',
                    category: 'AUDIFONOS',
                    model: 'Audífonos Huawei FreeBuds Pro 3',
                    imei: '',
                    color: 'Plata',
                    storage: '',
                    price: 1199.00,
                    stock: 7,
                    status: 'Nuevo',
                    entryDate: '2025-02-06',
                    createdAt: '2025-02-06T10:00:00.000Z'
                },
                {
                    id: 'prod_022',
                    category: 'TELEFONOS DEL GOBIERNO',
                    model: 'Teléfono Gobierno Básico',
                    imei: '357987123456789',
                    color: 'Negro',
                    storage: '8GB',
                    price: 0,
                    stock: 50,
                    status: 'Nuevo',
                    entryDate: '2025-01-05',
                    createdAt: '2025-01-05T08:00:00.000Z'
                },
                {
                    id: 'prod_023',
                    category: 'TELEFONOS DEL GOBIERNO',
                    model: 'Teléfono Gobierno Avanzado',
                    imei: '357987987654321',
                    color: 'Azul Marino',
                    storage: '16GB',
                    price: 0,
                    stock: 30,
                    status: 'Nuevo',
                    entryDate: '2025-01-15',
                    createdAt: '2025-01-15T08:00:00.000Z'
                },
                {
                    id: 'prod_024',
                    category: 'ANDROID',
                    model: 'Samsung Galaxy Z Fold6',
                    imei: '357986112233445',
                    color: 'Gris Oscuro',
                    storage: '512GB',
                    price: 15999.00,
                    stock: 2,
                    status: 'Nuevo',
                    entryDate: '2025-02-08',
                    createdAt: '2025-02-08T09:00:00.000Z'
                },
                {
                    id: 'prod_025',
                    category: 'IPHONE',
                    model: 'iPhone 16',
                    imei: '356789789123456',
                    color: 'Azul',
                    storage: '128GB',
                    price: 8999.00,
                    stock: 5,
                    status: 'Nuevo',
                    entryDate: '2025-02-10',
                    createdAt: '2025-02-10T10:30:00.000Z'
                },
                // ===== ACCESORIOS =====
                {
                    id: 'prod_026',
                    category: 'ACCESORIOS',
                    model: 'Cargador Rápido 25W USB-C',
                    imei: '',
                    color: 'Blanco',
                    storage: '',
                    price: 199.00,
                    stock: 30,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2025-01-20',
                    createdAt: '2025-01-20T08:00:00.000Z'
                },
                {
                    id: 'prod_027',
                    category: 'ACCESORIOS',
                    model: 'Cargador Inalámbrico Samsung 15W',
                    imei: '',
                    color: 'Negro',
                    storage: '',
                    price: 399.00,
                    stock: 15,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2025-01-22',
                    createdAt: '2025-01-22T08:30:00.000Z'
                },
                {
                    id: 'prod_028',
                    category: 'ACCESORIOS',
                    model: 'Cargador MagSafe Apple 25W',
                    imei: '',
                    color: 'Blanco',
                    storage: '',
                    price: 599.00,
                    stock: 10,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2025-01-25',
                    createdAt: '2025-01-25T09:00:00.000Z'
                },
                {
                    id: 'prod_029',
                    category: 'ACCESORIOS',
                    model: 'Cargador de Carro USB-C 45W',
                    imei: '',
                    color: 'Negro',
                    storage: '',
                    price: 149.00,
                    stock: 25,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2025-01-28',
                    createdAt: '2025-01-28T09:30:00.000Z'
                },
                {
                    id: 'prod_030',
                    category: 'ACCESORIOS',
                    model: 'Template de Vidrio Templado Galaxy S24',
                    imei: '',
                    color: 'Transparente',
                    storage: '',
                    price: 79.00,
                    stock: 40,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2025-02-01',
                    createdAt: '2025-02-01T10:00:00.000Z'
                },
                {
                    id: 'prod_031',
                    category: 'ACCESORIOS',
                    model: 'Template de Vidrio Templado iPhone 16 Pro',
                    imei: '',
                    color: 'Transparente',
                    storage: '',
                    price: 99.00,
                    stock: 35,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2025-02-02',
                    createdAt: '2025-02-02T10:30:00.000Z'
                },
                {
                    id: 'prod_032',
                    category: 'ACCESORIOS',
                    model: 'Protector de Cámara Galaxy S24 Ultra',
                    imei: '',
                    color: 'Negro',
                    storage: '',
                    price: 89.00,
                    stock: 20,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2025-02-03',
                    createdAt: '2025-02-03T11:00:00.000Z'
                },
                {
                    id: 'prod_033',
                    category: 'ACCESORIOS',
                    model: 'Protector de Cámara iPhone 16 Pro Max',
                    imei: '',
                    color: 'Titanio',
                    storage: '',
                    price: 109.00,
                    stock: 18,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2025-02-04',
                    createdAt: '2025-02-04T11:30:00.000Z'
                },
                {
                    id: 'prod_034',
                    category: 'ACCESORIOS',
                    model: 'Chip SIM Claro Prepago',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 25.00,
                    stock: 100,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2025-01-10',
                    createdAt: '2025-01-10T08:00:00.000Z'
                },
                {
                    id: 'prod_035',
                    category: 'ACCESORIOS',
                    model: 'Chip SIM Claro Postpago',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 0,
                    stock: 80,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2025-01-10',
                    createdAt: '2025-01-10T08:00:00.000Z'
                },
                {
                    id: 'prod_036',
                    category: 'ACCESORIOS',
                    model: 'eSIM Claro Activación',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 0,
                    stock: 999,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2025-01-15',
                    createdAt: '2025-01-15T08:00:00.000Z'
                },
                {
                    id: 'prod_037',
                    category: 'ACCESORIOS',
                    model: 'Case Silicona Galaxy S24 Ultra',
                    imei: '',
                    color: 'Negro',
                    storage: '',
                    price: 129.00,
                    stock: 22,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2025-02-05',
                    createdAt: '2025-02-05T12:00:00.000Z'
                },
                {
                    id: 'prod_038',
                    category: 'ACCESORIOS',
                    model: 'Case Silicona iPhone 16 Pro Max',
                    imei: '',
                    color: 'Azul Marino',
                    storage: '',
                    price: 149.00,
                    stock: 18,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2025-02-06',
                    createdAt: '2025-02-06T12:30:00.000Z'
                },
                {
                    id: 'prod_039',
                    category: 'ACCESORIOS',
                    model: 'Cable USB-C a USB-C 2M',
                    imei: '',
                    color: 'Negro',
                    storage: '',
                    price: 89.00,
                    stock: 50,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2025-02-07',
                    createdAt: '2025-02-07T13:00:00.000Z'
                },
                {
                    id: 'prod_040',
                    category: 'ACCESORIOS',
                    model: 'Adaptador USB-C a Jack 3.5mm',
                    imei: '',
                    color: 'Negro',
                    storage: '',
                    price: 59.00,
                    stock: 30,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2025-02-08',
                    createdAt: '2025-02-08T13:30:00.000Z'
                },
                // ===== TEMPLATES IPHONE =====
                {
                    id: 'prod_041',
                    category: 'ACCESORIOS',
                    model: 'Template iPhone 14 Plus',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 8.91,
                    stock: 1,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2026-01-10',
                    createdAt: '2026-01-10T08:00:00.000Z'
                },
                {
                    id: 'prod_042',
                    category: 'ACCESORIOS',
                    model: 'Template iPhone 14 Pro',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 8.91,
                    stock: 3,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2026-01-10',
                    createdAt: '2026-01-10T08:00:00.000Z'
                },
                {
                    id: 'prod_043',
                    category: 'ACCESORIOS',
                    model: 'Template iPhone 14 Pro Max',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 8.91,
                    stock: 2,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2026-01-10',
                    createdAt: '2026-01-10T08:00:00.000Z'
                },
                {
                    id: 'prod_044',
                    category: 'ACCESORIOS',
                    model: 'Template iPhone 12',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 8.91,
                    stock: 1,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2026-01-10',
                    createdAt: '2026-01-10T08:00:00.000Z'
                },
                {
                    id: 'prod_045',
                    category: 'ACCESORIOS',
                    model: 'Template iPhone 13 Pro / iPhone 13',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 8.91,
                    stock: 1,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2026-01-10',
                    createdAt: '2026-01-10T08:00:00.000Z'
                },
                {
                    id: 'prod_046',
                    category: 'ACCESORIOS',
                    model: 'Template iPhone 11',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 8.91,
                    stock: 1,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2026-01-10',
                    createdAt: '2026-01-10T08:00:00.000Z'
                },
                {
                    id: 'prod_047',
                    category: 'ACCESORIOS',
                    model: 'Template iPhone 11 Pro',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 8.91,
                    stock: 1,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2026-01-10',
                    createdAt: '2026-01-10T08:00:00.000Z'
                },
                {
                    id: 'prod_048',
                    category: 'ACCESORIOS',
                    model: 'Template iPhone 7 / iPhone 8',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 8.91,
                    stock: 1,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2026-01-10',
                    createdAt: '2026-01-10T08:00:00.000Z'
                },
                {
                    id: 'prod_049',
                    category: 'ACCESORIOS',
                    model: 'Template iPhone 17 Air',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 8.91,
                    stock: 1,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2026-01-10',
                    createdAt: '2026-01-10T08:00:00.000Z'
                },
                {
                    id: 'prod_050',
                    category: 'ACCESORIOS',
                    model: 'Template iPhone 16 Plus',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 8.91,
                    stock: 1,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2026-01-10',
                    createdAt: '2026-01-10T08:00:00.000Z'
                },
                {
                    id: 'prod_051',
                    category: 'ACCESORIOS',
                    model: 'Template iPhone 13 Pro Max',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 8.91,
                    stock: 1,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2026-01-10',
                    createdAt: '2026-01-10T08:00:00.000Z'
                },
                {
                    id: 'prod_052',
                    category: 'ACCESORIOS',
                    model: 'Template iPhone 16E',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 8.91,
                    stock: 3,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2026-01-10',
                    createdAt: '2026-01-10T08:00:00.000Z'
                },
                {
                    id: 'prod_053',
                    category: 'ACCESORIOS',
                    model: 'Template iPhone 17 Pro',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 8.91,
                    stock: 2,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2026-01-10',
                    createdAt: '2026-01-10T08:00:00.000Z'
                },
                {
                    id: 'prod_054',
                    category: 'ACCESORIOS',
                    model: 'Template iPhone 16 Pro / 17 / 17 Pro',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 8.91,
                    stock: 2,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2026-01-10',
                    createdAt: '2026-01-10T08:00:00.000Z'
                },
                {
                    id: 'prod_055',
                    category: 'ACCESORIOS',
                    model: 'Template iPhone 15 / iPhone 16',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 8.91,
                    stock: 1,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2026-01-10',
                    createdAt: '2026-01-10T08:00:00.000Z'
                },
                {
                    id: 'prod_056',
                    category: 'ACCESORIOS',
                    model: 'Template iPhone 16',
                    imei: '',
                    color: '',
                    storage: '',
                    price: 8.91,
                    stock: 1,
                    minStock: 2,
                    status: 'Nuevo',
                    entryDate: '2026-01-10',
                    createdAt: '2026-01-10T08:00:00.000Z'
                }
            ];
            localStorage.setItem('xtrem_products', JSON.stringify(defaultProducts));
        }

        if (!localStorage.getItem('xtrem_sales')) {
            localStorage.setItem('xtrem_sales', JSON.stringify([]));
        }

        if (!localStorage.getItem('xtrem_supplies')) {
            const defaultSupplies = [
                { id: 'sup_001', name: 'Papel Incomm (Resma)', category: 'Papelería', quantity: 10, minStock: 3, unit: 'Resmas', notes: '', updatedAt: new Date().toISOString() },
                { id: 'sup_002', name: 'Papel ATH (Resma)', category: 'Papelería', quantity: 8, minStock: 3, unit: 'Resmas', notes: '', updatedAt: new Date().toISOString() },
                { id: 'sup_003', name: 'Papel Carta (Resma)', category: 'Papelería', quantity: 15, minStock: 5, unit: 'Resmas', notes: 'Papel largo para impresora', updatedAt: new Date().toISOString() },
                { id: 'sup_004', name: 'Papel Oficio (Resma)', category: 'Papelería', quantity: 6, minStock: 3, unit: 'Resmas', notes: 'Papel corto/tamaño oficio', updatedAt: new Date().toISOString() },
                { id: 'sup_005', name: 'Papel Tamaño Carta', category: 'Papelería', quantity: 12, minStock: 4, unit: 'Resmas', notes: 'Papel largo 8.5x11"', updatedAt: new Date().toISOString() },
                { id: 'sup_006', name: 'Papel Tamaño Oficio', category: 'Papelería', quantity: 5, minStock: 2, unit: 'Resmas', notes: 'Papel corto 8.5x14"', updatedAt: new Date().toISOString() },
                { id: 'sup_007', name: 'Tinta para Impresora - Negro', category: 'Tinta', quantity: 4, minStock: 2, unit: 'Cartuchos', notes: 'HP/Tinta negra', updatedAt: new Date().toISOString() },
                { id: 'sup_008', name: 'Tinta para Impresora - Color', category: 'Tinta', quantity: 3, minStock: 2, unit: 'Cartuchos', notes: 'HP/Tinta color (CMYK)', updatedAt: new Date().toISOString() },
                { id: 'sup_009', name: 'Toner para Impresora', category: 'Tinta', quantity: 2, minStock: 1, unit: 'Unidades', notes: 'Toner láser negro', updatedAt: new Date().toISOString() },
                { id: 'sup_010', name: 'Grapas para Engrapadora (Caja)', category: 'Oficina', quantity: 12, minStock: 5, unit: 'Cajas', notes: 'Grapas estándar 26/6', updatedAt: new Date().toISOString() },
                { id: 'sup_011', name: 'Grapas Grandes para Engrapadora (Caja)', category: 'Oficina', quantity: 6, minStock: 3, unit: 'Cajas', notes: 'Grapas 23/13 para documentos gruesos', updatedAt: new Date().toISOString() },
                { id: 'sup_012', name: 'Clips (Caja)', category: 'Oficina', quantity: 15, minStock: 5, unit: 'Cajas', notes: 'Clips estándar', updatedAt: new Date().toISOString() },
                { id: 'sup_013', name: 'Clips Mariposa (Caja)', category: 'Oficina', quantity: 8, minStock: 3, unit: 'Cajas', notes: 'Clips binder/tarjetero', updatedAt: new Date().toISOString() },
                { id: 'sup_014', name: 'Folders Colgantes (Paquete)', category: 'Oficina', quantity: 20, minStock: 10, unit: 'Paquetes', notes: 'Folders manila colgantes', updatedAt: new Date().toISOString() },
                { id: 'sup_015', name: 'Folders Manila (Paquete)', category: 'Oficina', quantity: 25, minStock: 10, unit: 'Paquetes', notes: 'Folders tamaño carta', updatedAt: new Date().toISOString() },
                { id: 'sup_016', name: 'Post-it Notas (Paquete)', category: 'Papelería', quantity: 10, minStock: 4, unit: 'Paquetes', notes: '', updatedAt: new Date().toISOString() },
                { id: 'sup_017', name: 'Bolígrafos (Caja)', category: 'Papelería', quantity: 20, minStock: 5, unit: 'Cajas', notes: 'Bolígrafos azul/negro/rojo', updatedAt: new Date().toISOString() },
                { id: 'sup_018', name: 'Lapiceros (Caja)', category: 'Papelería', quantity: 15, minStock: 5, unit: 'Cajas', notes: 'Lápices #2 estándar', updatedAt: new Date().toISOString() },
                { id: 'sup_019', name: 'Cinta Adhesiva (Unidad)', category: 'Oficina', quantity: 10, minStock: 4, unit: 'Unidades', notes: 'Cinta transparente', updatedAt: new Date().toISOString() },
                { id: 'sup_020', name: 'Engrapadora (Unidad)', category: 'Equipo', quantity: 3, minStock: 1, unit: 'Unidades', notes: 'Engrapadora de escritorio', updatedAt: new Date().toISOString() }
            ];
            localStorage.setItem('xtrem_supplies', JSON.stringify(defaultSupplies));
        }

        if (!localStorage.getItem('xtrem_schedule')) {
            const defaultSchedule = [
                { id: 'sch_001', employeeName: 'Juan Pérez', day: 'Lunes', startTime: '08:00', endTime: '17:00', role: 'Vendedor', notes: '' },
                { id: 'sch_002', employeeName: 'María López', day: 'Lunes', startTime: '09:00', endTime: '18:00', role: 'Vendedor', notes: '' },
                { id: 'sch_003', employeeName: 'Carlos García', day: 'Martes', startTime: '08:00', endTime: '17:00', role: 'Técnico', notes: '' },
                { id: 'sch_004', employeeName: 'Ana Martínez', day: 'Miércoles', startTime: '10:00', endTime: '19:00', role: 'Vendedor', notes: '' },
                { id: 'sch_005', employeeName: 'Luis Rodríguez', day: 'Jueves', startTime: '08:00', endTime: '17:00', role: 'Inventario', notes: '' },
                { id: 'sch_006', employeeName: 'Sofía Ramírez', day: 'Viernes', startTime: '09:00', endTime: '18:00', role: 'Vendedor', notes: '' }
            ];
            localStorage.setItem('xtrem_schedule', JSON.stringify(defaultSchedule));
        }

        if (!localStorage.getItem('xtrem_history')) {
            const defaultHistory = [];
            localStorage.setItem('xtrem_history', JSON.stringify(defaultHistory));
        }
    },

// ===== USERS =====
    getUsers() {
        return JSON.parse(localStorage.getItem('xtrem_users')) || [];
    },

    saveUsers(users) {
        localStorage.setItem('xtrem_users', JSON.stringify(users));
    },

// Asegura que el usuario superadministrador "Angel" exista siempre.
    // No es destructivo: NO elimina a otros usuarios. Solo garantiza que Angel
    // esté presente con el rol correcto de "Administrador de programación".
    ensureAngelUser() {
        let users = this.getUsers();
        // Buscar a Angel por su id (más robusto) o por username (insensible a mayúsculas)
        let angelExists = users.find(u => u.id === 'usr_angel') || users.find(u => u.username && u.username.toLowerCase() === 'angel');
        if (!angelExists) {
            users.push({
                id: 'usr_angel',
                fullName: 'ANGEL A. COLON NEGRON',
                username: 'Angel',
                password: 'angel123',
                email: 'angel@xtremmobile.com',
                role: 'Administrador de programación',
                createdAt: new Date().toISOString()
            });
        } else if (angelExists.role !== 'Administrador de programación') {
            // Asegurar que Angel siempre tenga el rol de superadministrador
            angelExists.role = 'Administrador de programación';
            angelExists.fullName = 'ANGEL A. COLON NEGRON';
            angelExists.username = 'Angel';
        }

        this.saveUsers(users);
    },

    findUser(username, password) {
        const users = this.getUsers();
        return users.find(u => u.username === username && u.password === password) || null;
    },

    findUserByUsername(username) {
        const users = this.getUsers();
        return users.find(u => u.username === username) || null;
    },

    addUser(user) {
        const users = this.getUsers();
        user.id = 'usr_' + Date.now();
        user.createdAt = new Date().toISOString();
        users.push(user);
        this.saveUsers(users);
        return user;
    },

    updateUser(id, updatedData) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updatedData };
            this.saveUsers(users);
            return users[index];
        }
        return null;
    },

    deleteUser(id) {
        // Evita eliminar al superadministrador (Angel) por seguridad.
        if (id === 'usr_angel') {
            return false;
        }
        let users = this.getUsers();
        // Elimina únicamente el usuario cuyo id coincide exactamente.
        // Se guarda el nuevo arreglo SOLO si realmente eliminó un usuario.
        const before = users.length;
        users = users.filter(u => u.id !== id);
        if (users.length !== before) {
            this.saveUsers(users);
            return true;
        }
        return false;
    },

    // ===== PRODUCTS =====
    getProducts() {
        const products = JSON.parse(localStorage.getItem('xtrem_products')) || [];
        // Ordenar alfabéticamente por modelo (sin distinguir mayúsculas/minúsculas)
        return products.sort((a, b) => {
            const modelA = (a.model || '').toLowerCase();
            const modelB = (b.model || '').toLowerCase();
            return modelA.localeCompare(modelB, 'es');
        });
    },

    saveProducts(products) {
        localStorage.setItem('xtrem_products', JSON.stringify(products));
    },

    addProduct(product) {
        const products = JSON.parse(localStorage.getItem('xtrem_products')) || [];
        product.id = 'prod_' + Date.now();
        product.createdAt = new Date().toISOString();
        product.entryDate = product.entryDate || new Date().toISOString().split('T')[0];
        products.push(product);
        // Insertar en orden alfabético por modelo
        products.sort((a, b) => {
            const modelA = (a.model || '').toLowerCase();
            const modelB = (b.model || '').toLowerCase();
            return modelA.localeCompare(modelB, 'es');
        });
        this.saveProducts(products);
        return product;
    },

    updateProduct(id, updatedData) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updatedData };
            this.saveProducts(products);
            return products[index];
        }
        return null;
    },

    deleteProduct(id) {
        let products = this.getProducts();
        products = products.filter(p => p.id !== id);
        this.saveProducts(products);
    },

    getProductById(id) {
        const products = this.getProducts();
        return products.find(p => p.id === id) || null;
    },

    // ===== SALES =====
    getSales() {
        return JSON.parse(localStorage.getItem('xtrem_sales')) || [];
    },

    saveSales(sales) {
        localStorage.setItem('xtrem_sales', JSON.stringify(sales));
    },

    addSale(sale) {
        const sales = this.getSales();
        sale.id = 'sal_' + Date.now();
        sale.createdAt = new Date().toISOString();
        sales.push(sale);
        this.saveSales(sales);
        return sale;
    },

    // ===== CATEGORIES =====
    getCategories() {
        return [
            'ANDROID',
            'IPHONE',
            'INTERNET',
            'GALAXY WATCH',
            'APPLE WATCH',
            'AUDIFONOS',
            'ACCESORIOS',
            'TELEFONOS DEL GOBIERNO'
        ];
    },

    // ===== STATS =====
    getStats() {
        const products = this.getProducts();
        const categories = this.getCategories();
        
        const totalProducts = products.length;
        const totalStock = products.reduce((sum, p) => sum + (parseInt(p.stock) || 0), 0);
        const totalValue = products.reduce((sum, p) => sum + ((parseFloat(p.price) || 0) * (parseInt(p.stock) || 0)), 0);
        const activeCategories = new Set(products.map(p => p.category)).size;
        const averageStock = totalProducts > 0 ? Math.round(totalStock / totalProducts) : 0;

        // Products by category
        const categoryCount = {};
        categories.forEach(cat => {
            categoryCount[cat] = products.filter(p => p.category === cat).length;
        });

        // Products by status
        const statusCount = {
            'Nuevo': products.filter(p => p.status === 'Nuevo').length,
            'Seminuevo': products.filter(p => p.status === 'Seminuevo').length,
            'Usado': products.filter(p => p.status === 'Usado').length
        };

        // Most sold (top stock)
        const topProducts = [...products].sort((a, b) => (parseInt(b.stock) || 0) - (parseInt(a.stock) || 0)).slice(0, 5);

        // Recent products
        const recentProducts = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

        return {
            totalProducts,
            totalStock,
            totalValue,
            activeCategories,
            averageStock,
            categoryCount,
            statusCount,
            topProducts,
            recentProducts
        };
    },

    // ===== SUPPLIES (Inventario General/Oficina) =====
    getSupplies() {
        return JSON.parse(localStorage.getItem('xtrem_supplies')) || [];
    },

    saveSupplies(supplies) {
        localStorage.setItem('xtrem_supplies', JSON.stringify(supplies));
    },

    addSupply(supply) {
        const supplies = this.getSupplies();
        supply.id = 'sup_' + Date.now();
        supply.updatedAt = new Date().toISOString();
        supplies.push(supply);
        this.saveSupplies(supplies);
        return supply;
    },

    updateSupply(id, updatedData) {
        const supplies = this.getSupplies();
        const index = supplies.findIndex(s => s.id === id);
        if (index !== -1) {
            updatedData.updatedAt = new Date().toISOString();
            supplies[index] = { ...supplies[index], ...updatedData };
            this.saveSupplies(supplies);
            return supplies[index];
        }
        return null;
    },

    deleteSupply(id) {
        let supplies = this.getSupplies();
        supplies = supplies.filter(s => s.id !== id);
        this.saveSupplies(supplies);
    },

    // ===== SCHEDULE (Horarios) =====
    getSchedule() {
        const schedule = JSON.parse(localStorage.getItem('xtrem_schedule')) || [];
        let migrated = false;
        const dayMap = {'Lunes':1,'Martes':2,'Miércoles':3,'Jueves':4,'Viernes':5,'Sábado':6,'Domingo':0};
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();

        schedule.forEach(s => {
            if (!s.date && s.day && dayMap[s.day] !== undefined) {
                const targetDow = dayMap[s.day];
                const firstDay = new Date(y, m, 1);
                let startDate = 1 + ((targetDow - (firstDay.getDay() + 6) % 7 + 7) % 7);
                if (startDate > 28) startDate -= 7;
                const mm = String(m + 1).padStart(2, '0');
                const dd = String(startDate).padStart(2, '0');
                s.date = `${y}-${mm}-${dd}`;
                migrated = true;
            }
        });

        if (migrated) {
            this.saveSchedule(schedule);
        }

        return schedule;
    },

    seedSundayClosures() {
        const schedule = this.getSchedule();
        const existingDates = new Set(schedule.map(s => s.date));
        const year = 2026;
        const sundays = [];

        for (let month = 0; month < 12; month++) {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                if (date.getDay() === 0) {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    if (!existingDates.has(dateStr)) {
                        sundays.push({
                            id: `sch_sunday_${dateStr}`,
                            employeeName: 'Cerrado',
                            date: dateStr,
                            day: 'Domingo',
                            startTime: '08:00',
                            endTime: '18:00',
                            role: 'Administrador',
                            notes: 'Cerrado los domingos'
                        });
                    }
                }
            }
        }

        if (sundays.length > 0) {
            schedule.push(...sundays);
            this.saveSchedule(schedule);
        }
    },

    seedAccessoryTemplates() {
        const products = this.getProducts();
        const templateIds = new Set(['prod_041','prod_042','prod_043','prod_044','prod_045','prod_046','prod_047','prod_048','prod_049','prod_050','prod_051','prod_052','prod_053','prod_054','prod_055','prod_056']);
        const templates = [
            { id: 'prod_041', category: 'ACCESORIOS', model: 'Template iPhone 14 Plus', imei: '', color: '', storage: '', price: 8.91, stock: 1, minStock: 2, status: 'Nuevo', entryDate: '2026-01-10', createdAt: '2026-01-10T08:00:00.000Z' },
            { id: 'prod_042', category: 'ACCESORIOS', model: 'Template iPhone 14 Pro', imei: '', color: '', storage: '', price: 8.91, stock: 3, minStock: 2, status: 'Nuevo', entryDate: '2026-01-10', createdAt: '2026-01-10T08:00:00.000Z' },
            { id: 'prod_043', category: 'ACCESORIOS', model: 'Template iPhone 14 Pro Max', imei: '', color: '', storage: '', price: 8.91, stock: 2, minStock: 2, status: 'Nuevo', entryDate: '2026-01-10', createdAt: '2026-01-10T08:00:00.000Z' },
            { id: 'prod_044', category: 'ACCESORIOS', model: 'Template iPhone 12', imei: '', color: '', storage: '', price: 8.91, stock: 1, minStock: 2, status: 'Nuevo', entryDate: '2026-01-10', createdAt: '2026-01-10T08:00:00.000Z' },
            { id: 'prod_045', category: 'ACCESORIOS', model: 'Template iPhone 13 Pro / iPhone 13', imei: '', color: '', storage: '', price: 8.91, stock: 1, minStock: 2, status: 'Nuevo', entryDate: '2026-01-10', createdAt: '2026-01-10T08:00:00.000Z' },
            { id: 'prod_046', category: 'ACCESORIOS', model: 'Template iPhone 11', imei: '', color: '', storage: '', price: 8.91, stock: 1, minStock: 2, status: 'Nuevo', entryDate: '2026-01-10', createdAt: '2026-01-10T08:00:00.000Z' },
            { id: 'prod_047', category: 'ACCESORIOS', model: 'Template iPhone 11 Pro', imei: '', color: '', storage: '', price: 8.91, stock: 1, minStock: 2, status: 'Nuevo', entryDate: '2026-01-10', createdAt: '2026-01-10T08:00:00.000Z' },
            { id: 'prod_048', category: 'ACCESORIOS', model: 'Template iPhone 7 / iPhone 8', imei: '', color: '', storage: '', price: 8.91, stock: 1, minStock: 2, status: 'Nuevo', entryDate: '2026-01-10', createdAt: '2026-01-10T08:00:00.000Z' },
            { id: 'prod_049', category: 'ACCESORIOS', model: 'Template iPhone 17 Air', imei: '', color: '', storage: '', price: 8.91, stock: 1, minStock: 2, status: 'Nuevo', entryDate: '2026-01-10', createdAt: '2026-01-10T08:00:00.000Z' },
            { id: 'prod_050', category: 'ACCESORIOS', model: 'Template iPhone 16 Plus', imei: '', color: '', storage: '', price: 8.91, stock: 1, minStock: 2, status: 'Nuevo', entryDate: '2026-01-10', createdAt: '2026-01-10T08:00:00.000Z' },
            { id: 'prod_051', category: 'ACCESORIOS', model: 'Template iPhone 13 Pro Max', imei: '', color: '', storage: '', price: 8.91, stock: 1, minStock: 2, status: 'Nuevo', entryDate: '2026-01-10', createdAt: '2026-01-10T08:00:00.000Z' },
            { id: 'prod_052', category: 'ACCESORIOS', model: 'Template iPhone 16E', imei: '', color: '', storage: '', price: 8.91, stock: 3, minStock: 2, status: 'Nuevo', entryDate: '2026-01-10', createdAt: '2026-01-10T08:00:00.000Z' },
            { id: 'prod_053', category: 'ACCESORIOS', model: 'Template iPhone 17 Pro', imei: '', color: '', storage: '', price: 8.91, stock: 2, minStock: 2, status: 'Nuevo', entryDate: '2026-01-10', createdAt: '2026-01-10T08:00:00.000Z' },
            { id: 'prod_054', category: 'ACCESORIOS', model: 'Template iPhone 16 Pro / 17 / 17 Pro', imei: '', color: '', storage: '', price: 8.91, stock: 2, minStock: 2, status: 'Nuevo', entryDate: '2026-01-10', createdAt: '2026-01-10T08:00:00.000Z' },
            { id: 'prod_055', category: 'ACCESORIOS', model: 'Template iPhone 15 / iPhone 16', imei: '', color: '', storage: '', price: 8.91, stock: 1, minStock: 2, status: 'Nuevo', entryDate: '2026-01-10', createdAt: '2026-01-10T08:00:00.000Z' },
            { id: 'prod_056', category: 'ACCESORIOS', model: 'Template iPhone 16', imei: '', color: '', storage: '', price: 8.91, stock: 1, minStock: 2, status: 'Nuevo', entryDate: '2026-01-10', createdAt: '2026-01-10T08:00:00.000Z' }
        ];

        const seenIds = new Set();
        const deduped = [];
        for (const p of products) {
            if (p.category === 'ACCESORIOS' && !templateIds.has(p.id)) continue;
            if (seenIds.has(p.id)) continue;
            seenIds.add(p.id);
            deduped.push(p);
        }

        templates.forEach(t => {
            const idx = deduped.findIndex(p => p.id === t.id);
            if (idx !== -1) {
                deduped[idx] = { ...deduped[idx], ...t };
            } else {
                deduped.push(t);
            }
        });

        const originalCount = products.length;
        products.length = 0;
        products.push(...deduped);
        if (products.length !== originalCount) {
            this.saveProducts(products);
        }
    },

    saveSchedule(schedule) {
        localStorage.setItem('xtrem_schedule', JSON.stringify(schedule));
    },

    addScheduleEntry(entry) {
        const schedule = this.getSchedule();
        entry.id = 'sch_' + Date.now();
        schedule.push(entry);
        this.saveSchedule(schedule);
        return entry;
    },

    updateScheduleEntry(id, updatedData) {
        const schedule = this.getSchedule();
        const index = schedule.findIndex(s => s.id === id);
        if (index !== -1) {
            schedule[index] = { ...schedule[index], ...updatedData };
            this.saveSchedule(schedule);
            return schedule[index];
        }
        return null;
    },

    deleteScheduleEntry(id) {
        let schedule = this.getSchedule();
        schedule = schedule.filter(s => s.id !== id);
        this.saveSchedule(schedule);
    },

    // ===== HISTORY (Historial) =====
    getHistory() {
        return JSON.parse(localStorage.getItem('xtrem_history')) || [];
    },

    saveHistory(history) {
        localStorage.setItem('xtrem_history', JSON.stringify(history));
    },

    addHistoryEntry(entry) {
        const history = this.getHistory();
        entry.id = 'his_' + Date.now();
        entry.createdAt = new Date().toISOString();
        history.push(entry);
        this.saveHistory(history);
        return entry;
    },

    clearHistory() {
        localStorage.setItem('xtrem_history', JSON.stringify([]));
    }
};

// Initialize data store on script load
DataStore.init();
