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

            // Combina lo que ya había en localStorage con lo que llegó de Supabase, en vez
            // de reemplazar por completo. Así, un registro que se guardó localmente pero que
            // todavía no logró subirse a Supabase (por ejemplo porque faltan columnas nuevas
            // hasta correr la migración del esquema) nunca desaparece por una sincronización.
            // Se usa solo para colecciones sin operación de "eliminar" (ventas, cuadres de caja).
            const mergeKeepingLocal = (localKey, cloudItems) => {
                const local = JSON.parse(localStorage.getItem(localKey) || '[]');
                const map = new Map();
                (cloudItems || []).forEach(item => map.set(item.id, item));
                local.forEach(item => map.set(item.id, item));
                return Array.from(map.values());
            };

            const localUsers = JSON.parse(localStorage.getItem('xtrem_users') || '[]');
            const hasLocalUsersWithCredentials = localUsers.some(u => u.username && u.password);

            // isRecentlyWritten evita que una sincronización que llega justo después de un
            // cambio local (por ejemplo, alguien editando su perfil) lo pise por accidente
            // mientras esa escritura todavía está subiendo a Supabase.
            if (!users.error && users.data && !DataStore.isRecentlyWritten('xtrem_users')) {
                const validUsers = snakeToCamel(users.data).filter(u => u.username && u.password && u.fullName);
                if (validUsers.length > 0) {
                    localStorage.setItem('xtrem_users', JSON.stringify(deduplicate(validUsers)));
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
            
            if (!products.error && products.data && products.data.length > 0 && !DataStore.isRecentlyWritten('xtrem_products')) {
                localStorage.setItem('xtrem_products', JSON.stringify(deduplicate(snakeToCamel(products.data))));
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
                localStorage.setItem('xtrem_sales', JSON.stringify(mergeKeepingLocal('xtrem_sales', deduplicate(mappedSales))));
            }
            if (!supplies.error && supplies.data && supplies.data.length > 0 && !DataStore.isRecentlyWritten('xtrem_supplies')) {
                localStorage.setItem('xtrem_supplies', JSON.stringify(deduplicate(snakeToCamel(supplies.data))));
            }
            if (!schedule.error && schedule.data && schedule.data.length > 0 && !DataStore.isRecentlyWritten('xtrem_schedule')) {
                localStorage.setItem('xtrem_schedule', JSON.stringify(deduplicate(snakeToCamel(schedule.data))));
            }
            if (!history.error && history.data && history.data.length > 0 && !DataStore.isRecentlyWritten('xtrem_history')) {
                const mappedHistory = history.data.map(h => ({
                    id: h.id,
                    user: h.user_name,
                    action: h.action,
                    detail: h.detail,
                    createdAt: h.date_time
                }));
                localStorage.setItem('xtrem_history', JSON.stringify(deduplicate(mappedHistory)));
            }
            if (!roles.error && roles.data && roles.data.length > 0 && !DataStore.isRecentlyWritten('xtrem_roles')) {
                localStorage.setItem('xtrem_roles', JSON.stringify(deduplicate(snakeToCamel(roles.data))));
            }
            if (!cashCounts.error && cashCounts.data) {
                localStorage.setItem('xtrem_cash_counts', JSON.stringify(mergeKeepingLocal('xtrem_cash_counts', deduplicate(snakeToCamel(cashCounts.data)))));
            }
            if (!purchaseRequests.error && purchaseRequests.data) {
                localStorage.setItem('xtrem_purchase_requests', JSON.stringify(mergeKeepingLocal('xtrem_purchase_requests', deduplicate(snakeToCamel(purchaseRequests.data)))));
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
    async migrateAllData() {
        if (!this.isConnected()) {
            console.warn('Supabase no conectado. No se puede migrar.');
            return false;
        }

        try {
            const users = DataStore.getUsers();
            const products = DataStore.getProducts();
            const supplies = DataStore.getSupplies();
            const schedule = DataStore.getSchedule();
            const history = DataStore.getHistory();
            const sales = DataStore.getSales();
            const roles = DataStore.getRoles();
            const cashCounts = DataStore.getCashCounts();
            const purchaseRequests = DataStore.getPurchaseRequests();

            if (users.length > 0) {
                await this.client.from(TABLES.users).upsert(camelToSnake(users), { onConflict: 'id' });
            }
            if (products.length > 0) {
                await this.client.from(TABLES.products).upsert(camelToSnake(products), { onConflict: 'id' });
            }
            if (supplies.length > 0) {
                await this.client.from(TABLES.supplies).upsert(camelToSnake(supplies), { onConflict: 'id' });
            }
            if (schedule.length > 0) {
                await this.client.from(TABLES.schedule).upsert(camelToSnake(schedule), { onConflict: 'id' });
            }
            if (history.length > 0) {
                const historyForSupabase = history.map(h => ({
                    id: h.id,
                    user_name: h.user,
                    action: h.action,
                    detail: h.detail,
                    date_time: h.createdAt
                }));
                await this.client.from(TABLES.history).upsert(historyForSupabase, { onConflict: 'id' });
            }
            if (sales.length > 0) {
                const salesForSupabase = sales.map(s => ({
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
                }));
                await this.client.from(TABLES.sales).upsert(salesForSupabase, { onConflict: 'id' });
            }
            if (roles.length > 0) {
                await this.client.from(TABLES.roles).upsert(camelToSnake(roles), { onConflict: 'id' });
            }
            if (cashCounts.length > 0) {
                await this.client.from(TABLES.cashCounts).upsert(camelToSnake(cashCounts), { onConflict: 'id' });
            }
            if (purchaseRequests.length > 0) {
                await this.client.from(TABLES.purchaseRequests).upsert(camelToSnake(purchaseRequests), { onConflict: 'id' });
            }

            console.log('Migración completada exitosamente');
            return true;
        } catch (error) {
            console.error('Error en migración:', error);
            return false;
        }
    }
};
