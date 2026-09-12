/**
 * XTREM MOBILE - Supabase Service
 * Servicio para interactuar con Supabase
 */

const SupabaseService = {
    client: null,
    _synced: false,

    async init() {
        if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === 'TU_SUPABASE_URL_AQUI') {
            console.warn('Supabase no configurado. Usando localStorage.');
            return false;
        }

        try {
            const { createClient } = supabase;
            this.client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
            console.log('Supabase conectado exitosamente');
            
            if (!this._synced) {
                await this.syncFromSupabase();
                this._synced = true;
            }
            
            return true;
        } catch (error) {
            console.error('Error conectando a Supabase:', error);
            return false;
        }
    },

    isConnected() {
        return this.client !== null;
    },
    async syncFromSupabase() {
        if (!this.isConnected()) return;
        
        try {
            const [users, products, sales, supplies, schedule, history, roles, cashCounts, purchaseRequests] = await Promise.all([
                this.client.from(TABLES.users).select('*'),
                this.client.from(TABLES.products).select('*'),
                this.client.from(TABLES.sales).select('*'),
                this.client.from(TABLES.supplies).select('*'),
                this.client.from(TABLES.schedule).select('*'),
                this.client.from(TABLES.history).select('*'),
                this.client.from(TABLES.roles).select('*'),
                this.client.from(TABLES.cashCounts).select('*'),
                this.client.from(TABLES.purchaseRequests).select('*')
            ]);

            const deduplicate = (items, key = 'id') => {
                const seen = new Set();
                return items.filter(item => {
                    const id = item[key];
                    if (seen.has(id)) return false;
                    seen.add(id);
                    return true;
                });
            };

            // Combina lo que dice Supabase (fuente de verdad) con lo que hay guardado
            // localmente, SIN perder nunca un registro recién creado que todavía no
            // terminó de subir. Un registro local que Supabase ya no tiene se conserva
            // mientras sea "reciente" (todavía podría estar subiendo); pasado ese tiempo,
            // se asume que fue borrado desde otro dispositivo y se descarta, para que los
            // borrados también se reflejen con el tiempo. Se usa para TODAS las colecciones.
            const RECENT_GRACE_MS = 30000;

            // No todas las colecciones guardan una fecha de creación propia (horarios y
            // roles no la tienen). Como respaldo, casi todos los IDs llevan Date.now()
            // incorporado (ej. "sch_1735689600000"), así que se usa eso para saber qué
            // tan reciente es un registro cuando no hay otra fecha disponible.
            const getItemTimestamp = (item) => {
                if (item.createdAt) {
                    const t = new Date(item.createdAt).getTime();
                    if (!isNaN(t)) return t;
                }
                if (item.updatedAt) {
                    const t = new Date(item.updatedAt).getTime();
                    if (!isNaN(t)) return t;
                }
                if (item.id) {
                    const match = String(item.id).match(/(\d{10,})/);
                    if (match) return parseInt(match[1], 10);
                }
                return 0;
            };

            const mergeSmart = (localKey, cloudItems) => {
                const local = JSON.parse(localStorage.getItem(localKey) || '[]');
                const cloudMap = new Map();
                (cloudItems || []).forEach(item => cloudMap.set(item.id, item));

                const result = Array.from(cloudMap.values());
                const seen = new Set(cloudMap.keys());
                const now = Date.now();

                local.forEach(item => {
                    if (seen.has(item.id)) return;
                    const ts = getItemTimestamp(item);
                    const isRecent = ts && (now - ts) < RECENT_GRACE_MS;
                    if (isRecent) result.push(item);
                });

                return result;
            };

            const localUsers = JSON.parse(localStorage.getItem('xtrem_users') || '[]');
            const hasLocalUsersWithCredentials = localUsers.some(u => u.username && u.password);

            if (!users.error && users.data) {
                const validUsers = snakeToCamel(users.data).filter(u => u.username && u.password && u.fullName);
                if (validUsers.length > 0) {
                    localStorage.setItem('xtrem_users', JSON.stringify(mergeSmart('xtrem_users', deduplicate(validUsers))));
                } else if (!hasLocalUsersWithCredentials) {
                    const defaultUsers = [
                        {
                            id: 'usr_001',
                            fullName: 'Jessenia',
                            username: 'Jessenia',
                            password: 'admin123',
                            email: 'admin@xtremmobile.com',
                            role: 'Administrador',
                            createdAt: '2026-07-30T17:01:44.011Z'
                        },
                        {
                            id: 'usr_angel',
                            fullName: 'ANGEL A. COLON NEGRON',
                            username: 'Angel',
                            password: 'AXtreme2026@',
                            email: 'angel@xtremmobile.com',
                            role: 'Administrador de programación',
                            createdAt: '2026-08-08T20:53:29.633Z'
                        }
                    ];
                    localStorage.setItem('xtrem_users', JSON.stringify(defaultUsers));
                }
            }

            if (!products.error && products.data) {
                localStorage.setItem('xtrem_products', JSON.stringify(mergeSmart('xtrem_products', deduplicate(snakeToCamel(products.data)))));
            }
            if (!sales.error && sales.data) {
                const mappedSales = sales.data.map(s => ({
                    id: s.id,
                    productId: s.product_id,
                    productName: s.product_model,
                    quantity: s.quantity,
                    price: s.unit_price,
                    total: s.total,
                    customer: s.customer_name,
                    notes: s.notes,
                    seller: s.seller_name || null,
                    sellerId: s.seller_id || null,
                    category: s.category || '',
                    ticketId: s.ticket_id || null,
                    receiptNote: s.receipt_note || '',
                    createdAt: s.created_at
                }));
                localStorage.setItem('xtrem_sales', JSON.stringify(mergeSmart('xtrem_sales', deduplicate(mappedSales))));
            }
            if (!supplies.error && supplies.data) {
                localStorage.setItem('xtrem_supplies', JSON.stringify(mergeSmart('xtrem_supplies', deduplicate(snakeToCamel(supplies.data)))));
            }
            if (!schedule.error && schedule.data) {
                localStorage.setItem('xtrem_schedule', JSON.stringify(mergeSmart('xtrem_schedule', deduplicate(snakeToCamel(schedule.data)))));
            }
            if (!history.error && history.data) {
                const mappedHistory = history.data.map(h => ({
                    id: h.id,
                    user: h.user_name,
                    action: h.action,
                    detail: h.detail,
                    createdAt: h.date_time
                }));
                localStorage.setItem('xtrem_history', JSON.stringify(mergeSmart('xtrem_history', deduplicate(mappedHistory))));
            }
            if (!roles.error && roles.data) {
                localStorage.setItem('xtrem_roles', JSON.stringify(mergeSmart('xtrem_roles', deduplicate(snakeToCamel(roles.data)))));
            }
            if (!cashCounts.error && cashCounts.data) {
                localStorage.setItem('xtrem_cash_counts', JSON.stringify(mergeSmart('xtrem_cash_counts', deduplicate(snakeToCamel(cashCounts.data)))));
            }
            if (!purchaseRequests.error && purchaseRequests.data) {
                localStorage.setItem('xtrem_purchase_requests', JSON.stringify(mergeSmart('xtrem_purchase_requests', deduplicate(snakeToCamel(purchaseRequests.data)))));
            }

            console.log('Datos sincronizados desde Supabase a localStorage');
        } catch (error) {
            console.error('Error sincronizando datos:', error);
        }
    },

    // ===== USERS =====
    async getUsers() {
        if (!this.isConnected()) return DataStore.getUsers();
        
        const { data, error } = await this.client
            .from(TABLES.users)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error obteniendo usuarios:', error);
            return DataStore.getUsers();
        }
        return data || [];
    },

    async addUser(user, _skipLocalFallback = false) {
        if (!this.isConnected()) return DataStore.addUser(user);
        
        const { data, error } = await this.client
            .from(TABLES.users)
            .upsert([user], { onConflict: 'id' })
            .select()
            .single();

        if (error) {
            console.error('Error agregando usuario:', error);
            if (!_skipLocalFallback) return DataStore.addUser(user);
            throw error;
        }
        return data;
    },

    async updateUser(id, updatedData, _skipLocalFallback = false) {
        if (!this.isConnected()) return DataStore.updateUser(id, updatedData);
        
        const { data, error } = await this.client
            .from(TABLES.users)
            .update(updatedData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error actualizando usuario:', error);
            if (!_skipLocalFallback) return DataStore.updateUser(id, updatedData);
            throw error;
        }
        return data;
    },

    async deleteUser(id, _skipLocalFallback = false) {
        if (!this.isConnected()) return DataStore.deleteUser(id);
        
        const { error } = await this.client
            .from(TABLES.users)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error eliminando usuario:', error);
            if (!_skipLocalFallback) return DataStore.deleteUser(id);
            throw error;
        }
        return true;
    },

    // ===== PRODUCTS =====
    async getProducts() {
        if (!this.isConnected()) return DataStore.getProducts();
        
        const { data, error } = await this.client
            .from(TABLES.products)
            .select('*')
            .order('model', { ascending: true });

        if (error) {
            console.error('Error obteniendo productos:', error);
            return DataStore.getProducts();
        }
        return data || [];
    },

    async addProduct(product, _skipLocalFallback = false) {
        if (!this.isConnected()) return DataStore.addProduct(product);
        
        const { data, error } = await this.client
            .from(TABLES.products)
            .upsert([product], { onConflict: 'id' })
            .select()
            .single();

        if (error) {
            console.error('Error agregando producto:', error);
            if (!_skipLocalFallback) return DataStore.addProduct(product);
            throw error;
        }
        return data;
    },

    async updateProduct(id, updatedData, _skipLocalFallback = false) {
        if (!this.isConnected()) return DataStore.updateProduct(id, updatedData);
        
        const { data, error } = await this.client
            .from(TABLES.products)
            .update(updatedData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error actualizando producto:', error);
            if (!_skipLocalFallback) return DataStore.updateProduct(id, updatedData);
            throw error;
        }
        return data;
    },

    async deleteProduct(id, _skipLocalFallback = false) {
        if (!this.isConnected()) return DataStore.deleteProduct(id);
        
        const { error } = await this.client
            .from(TABLES.products)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error eliminando producto:', error);
            if (!_skipLocalFallback) return DataStore.deleteProduct(id);
            throw error;
        }
        return true;
    },

    // ===== SALES =====
    async getSales() {
        if (!this.isConnected()) return DataStore.getSales();
        
        const { data, error } = await this.client
            .from(TABLES.sales)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error obteniendo ventas:', error);
            return DataStore.getSales();
        }

        if (data && data.length > 0) {
            return data.map(s => ({
                id: s.id,
                productId: s.product_id,
                productName: s.product_model,
                quantity: s.quantity,
                price: s.unit_price,
                total: s.total,
                customer: s.customer_name,
                notes: s.notes,
                seller: s.seller_name || null,
                sellerId: s.seller_id || null,
                category: s.category || '',
                ticketId: s.ticket_id || null,
                receiptNote: s.receipt_note || '',
                createdAt: s.created_at
            }));
        }
        return data || [];
    },

    async addSale(sale, _skipLocalFallback = false) {
        if (!this.isConnected()) return DataStore.addSale(sale);

        const supabaseSale = {
            id: sale.id,
            product_id: sale.productId || sale.product_id,
            product_model: sale.productName || sale.product_name,
            quantity: sale.quantity,
            unit_price: sale.price || sale.unit_price,
            total: sale.total,
            customer_name: sale.customer || sale.customer_name,
            notes: sale.notes,
            seller_name: sale.seller || sale.seller_name,
            seller_id: sale.sellerId || sale.seller_id,
            category: sale.category,
            ticket_id: sale.ticketId || sale.ticket_id,
            receipt_note: sale.receiptNote || sale.receipt_note,
            created_at: sale.createdAt || sale.created_at
        };

        const { data, error } = await this.client
            .from(TABLES.sales)
            .upsert([supabaseSale], { onConflict: 'id' })
            .select()
            .single();

        if (error) {
            console.error('Error agregando venta:', error);
            if (!_skipLocalFallback) return DataStore.addSale(sale);
            throw error;
        }
        return data;
    },

    // ===== SUPPLIES =====
    async getSupplies() {
        if (!this.isConnected()) return DataStore.getSupplies();
        
        const { data, error } = await this.client
            .from(TABLES.supplies)
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error obteniendo suministros:', error);
            return DataStore.getSupplies();
        }
        return data || [];
    },

    async addSupply(supply, _skipLocalFallback = false) {
        if (!this.isConnected()) return DataStore.addSupply(supply);
        
        const { data, error } = await this.client
            .from(TABLES.supplies)
            .upsert([supply], { onConflict: 'id' })
            .select()
            .single();

        if (error) {
            console.error('Error agregando suministro:', error);
            if (!_skipLocalFallback) return DataStore.addSupply(supply);
            throw error;
        }
        return data;
    },

    async updateSupply(id, updatedData, _skipLocalFallback = false) {
        if (!this.isConnected()) return DataStore.updateSupply(id, updatedData);
        
        const { data, error } = await this.client
            .from(TABLES.supplies)
            .update(updatedData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error actualizando suministro:', error);
            if (!_skipLocalFallback) return DataStore.updateSupply(id, updatedData);
            throw error;
        }
        return data;
    },

    async deleteSupply(id, _skipLocalFallback = false) {
        if (!this.isConnected()) return DataStore.deleteSupply(id);
        
        const { error } = await this.client
            .from(TABLES.supplies)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error eliminando suministro:', error);
            if (!_skipLocalFallback) return DataStore.deleteSupply(id);
            throw error;
        }
        return true;
    },

    // ===== SCHEDULE =====
    async getSchedule() {
        if (!this.isConnected()) return DataStore.getSchedule();
        
        const { data, error } = await this.client
            .from(TABLES.schedule)
            .select('*')
            .order('date', { ascending: true });

        if (error) {
            console.error('Error obteniendo horarios:', error);
            return DataStore.getSchedule();
        }
        return data || [];
    },

    async addScheduleEntry(entry, _skipLocalFallback = false) {
        if (!this.isConnected()) return DataStore.addScheduleEntry(entry);
        
        const { data, error } = await this.client
            .from(TABLES.schedule)
            .upsert([entry], { onConflict: 'id' })
            .select()
            .single();

        if (error) {
            console.error('Error agregando horario:', error);
            if (!_skipLocalFallback) return DataStore.addScheduleEntry(entry);
            throw error;
        }
        return data;
    },

    async updateScheduleEntry(id, updatedData, _skipLocalFallback = false) {
        if (!this.isConnected()) return DataStore.updateScheduleEntry(id, updatedData);
        
        const { data, error } = await this.client
            .from(TABLES.schedule)
            .update(updatedData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error actualizando horario:', error);
            if (!_skipLocalFallback) return DataStore.updateScheduleEntry(id, updatedData);
            throw error;
        }
        return data;
    },

    async deleteScheduleEntry(id, _skipLocalFallback = false) {
        if (!this.isConnected()) return DataStore.deleteScheduleEntry(id);
        
        const { error } = await this.client
            .from(TABLES.schedule)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error eliminando horario:', error);
            if (!_skipLocalFallback) return DataStore.deleteScheduleEntry(id);
            throw error;
        }
        return true;
    },

    // ===== HISTORY =====
    async getHistory() {
        if (!this.isConnected()) return DataStore.getHistory();
        
        const { data, error } = await this.client
            .from(TABLES.history)
            .select('*')
            .order('date_time', { ascending: false });

        if (error) {
            console.error('Error obteniendo historial:', error);
            return DataStore.getHistory();
        }

        if (data && data.length > 0) {
            return data.map(h => ({
                id: h.id,
                user: h.user_name,
                action: h.action,
                detail: h.detail,
                createdAt: h.date_time
            }));
        }
        return data || [];
    },

    async addHistoryEntry(entry, _skipLocalFallback = false) {
        if (!this.isConnected()) return DataStore.addHistoryEntry(entry);
        
        const supabaseEntry = {
            id: entry.id,
            user_name: entry.user || entry.userName || entry.user_name,
            action: entry.action,
            detail: entry.detail,
            date_time: entry.createdAt || entry.created_at
        };

        const { data, error } = await this.client
            .from(TABLES.history)
            .upsert([supabaseEntry], { onConflict: 'id' })
            .select()
            .single();

        if (error) {
            console.error('Error agregando historial:', error);
            if (!_skipLocalFallback) return DataStore.addHistoryEntry(entry);
            throw error;
        }
        return data;
    },

    async clearHistory(_skipLocalFallback = false) {
        if (!this.isConnected()) return DataStore.clearHistory();

        const { error } = await this.client
            .from(TABLES.history)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
            console.error('Error limpiando historial:', error);
            if (!_skipLocalFallback) return DataStore.clearHistory();
            throw error;
        }
        return true;
    },

    async clearSales(_skipLocalFallback = false) {
        if (!this.isConnected()) return DataStore.clearSales();

        const { error } = await this.client
            .from(TABLES.sales)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
            console.error('Error limpiando historial de ventas:', error);
            if (!_skipLocalFallback) return DataStore.clearSales();
            throw error;
        }
        return true;
    },

    // ===== ROLES / PERMISOS =====
    async getRoles() {
        if (!this.isConnected()) return DataStore.getRoles();

        const { data, error } = await this.client.from(TABLES.roles).select('*');
        if (error) {
            console.error('Error obteniendo roles:', error);
            return DataStore.getRoles();
        }
        return snakeToCamel(data || []);
    },

    async saveRoles(roles, _skipLocalFallback = false) {
        if (!this.isConnected()) return;

        const { error } = await this.client
            .from(TABLES.roles)
            .upsert(camelToSnake(roles), { onConflict: 'id' });

        if (error) {
            console.error('Error guardando roles:', error);
            if (!_skipLocalFallback) return;
            throw error;
        }
    },

    async deleteRole(id) {
        if (!this.isConnected()) return;

        const { error } = await this.client.from(TABLES.roles).delete().eq('id', id);
        if (error) {
            console.error('Error eliminando rol en Supabase:', error);
        }
    },

    // ===== CUADRE DE CAJA =====
    async getCashCounts() {
        if (!this.isConnected()) return DataStore.getCashCounts();

        const { data, error } = await this.client
            .from(TABLES.cashCounts)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error obteniendo cuadres de caja:', error);
            return DataStore.getCashCounts();
        }
        return snakeToCamel(data || []);
    },

    async addCashCount(entry, _skipLocalFallback = false) {
        if (!this.isConnected()) return;

        const { error } = await this.client
            .from(TABLES.cashCounts)
            .upsert([camelToSnake(entry)], { onConflict: 'id' });

        if (error) {
            console.error('Error guardando cuadre de caja:', error);
            if (!_skipLocalFallback) return;
            throw error;
        }
    },

    async deleteCashCountRemote(id) {
        if (!this.isConnected()) return;
        const { error } = await this.client.from(TABLES.cashCounts).delete().eq('id', id);
        if (error) console.error('Error eliminando cuadre de caja en Supabase:', error);
    },

    // ===== COMPRAS (solicitudes de reabastecimiento) =====
    async getPurchaseRequests() {
        if (!this.isConnected()) return DataStore.getPurchaseRequests();

        const { data, error } = await this.client.from(TABLES.purchaseRequests).select('*');
        if (error) {
            console.error('Error obteniendo solicitudes de compra:', error);
            return DataStore.getPurchaseRequests();
        }
        return snakeToCamel(data || []);
    },

    async savePurchaseRequests(list, _skipLocalFallback = false) {
        if (!this.isConnected()) return;

        const { error } = await this.client
            .from(TABLES.purchaseRequests)
            .upsert(camelToSnake(list), { onConflict: 'id' });

        if (error) {
            console.error('Error guardando solicitudes de compra:', error);
            if (!_skipLocalFallback) return;
            throw error;
        }
    },

    async deletePurchaseRequestRemote(id) {
        if (!this.isConnected()) return;
        const { error } = await this.client.from(TABLES.purchaseRequests).delete().eq('id', id);
        if (error) console.error('Error eliminando solicitud de compra en Supabase:', error);
    },

    // ===== MIGRACIÓN =====
    // Sube (upsert) TODO lo que hay guardado localmente a Supabase. Se usa tanto para
    // la migración manual como para el reintento automático cada 10 segundos, así que
    // cualquier escritura que en su momento haya fallado (por ejemplo, por RLS activado)
    // se vuelve a intentar sola hasta que logre subir. Devuelve qué tablas fallaron.
    async migrateAllData() {
        if (!this.isConnected()) {
            console.warn('Supabase no conectado. No se puede migrar.');
            return { ok: false, failed: ['sin conexión'] };
        }

        const failed = [];
        const details = [];
        const upsertSafe = async (table, rows) => {
            if (!rows || rows.length === 0) return;
            const { error } = await this.client.from(table).upsert(rows, { onConflict: 'id' });
            if (error) {
                console.error(`Error subiendo datos a "${table}":`, error);
                failed.push(table);
                details.push(`${table}: ${error.message || error.code || 'error desconocido'}`);
            }
        };

        try {
            await upsertSafe(TABLES.users, camelToSnake(DataStore.getUsers()));
            await upsertSafe(TABLES.products, camelToSnake(DataStore.getProducts()));
            await upsertSafe(TABLES.supplies, camelToSnake(DataStore.getSupplies()));
            await upsertSafe(TABLES.schedule, camelToSnake(DataStore.getSchedule()));

            const history = DataStore.getHistory();
            await upsertSafe(TABLES.history, history.map(h => ({
                id: h.id,
                user_name: h.user,
                action: h.action,
                detail: h.detail,
                date_time: h.createdAt
            })));

            const sales = DataStore.getSales();
            await upsertSafe(TABLES.sales, sales.map(s => ({
                id: s.id,
                product_id: s.productId,
                product_model: s.productName,
                quantity: s.quantity,
                unit_price: s.price,
                total: s.total,
                customer_name: s.customer,
                notes: s.notes,
                seller_name: s.seller,
                seller_id: s.sellerId,
                category: s.category,
                ticket_id: s.ticketId,
                receipt_note: s.receiptNote,
                created_at: s.createdAt
            })));

            await upsertSafe(TABLES.roles, camelToSnake(DataStore.getRoles()));
            await upsertSafe(TABLES.cashCounts, camelToSnake(DataStore.getCashCounts()));
            await upsertSafe(TABLES.purchaseRequests, camelToSnake(DataStore.getPurchaseRequests()));

            const localCounts = {
                users: DataStore.getUsers().length,
                products: DataStore.getProducts().length,
                supplies: DataStore.getSupplies().length,
                schedule: DataStore.getSchedule().length,
                history: DataStore.getHistory().length,
                sales: DataStore.getSales().length,
                roles: DataStore.getRoles().length,
                cash_counts: DataStore.getCashCounts().length,
                purchase_requests: DataStore.getPurchaseRequests().length
            };

            if (failed.length > 0) {
                console.warn('Migración completada con errores en:', failed, details);
            } else {
                console.log('Migración completada exitosamente. Filas locales:', localCounts);
            }
            return { ok: failed.length === 0, failed, details, localCounts };
        } catch (error) {
            console.error('Error en migración:', error);
            return { ok: false, failed: ['error inesperado'], details: [String(error)], localCounts: null };
        }
    }
};
