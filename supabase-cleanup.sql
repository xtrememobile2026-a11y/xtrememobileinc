-- ============================================
-- Limpiar duplicados en Supabase
-- Ejecuta este SQL en el SQL Editor de Supabase
-- ============================================

-- Eliminar duplicados manteniendo el registro más antiguo de cada ID
DELETE FROM products p1
WHERE p1.ctid NOT IN (
    SELECT MIN(p2.ctid)
    FROM products p2
    GROUP BY p2.id
);

DELETE FROM users u1
WHERE u1.ctid NOT IN (
    SELECT MIN(u2.ctid)
    FROM users u2
    GROUP BY u2.id
);

DELETE FROM sales s1
WHERE s1.ctid NOT IN (
    SELECT MIN(s2.ctid)
    FROM sales s2
    GROUP BY s2.id
);

DELETE FROM supplies sup1
WHERE sup1.ctid NOT IN (
    SELECT MIN(sup2.ctid)
    FROM supplies sup2
    GROUP BY sup2.id
);

DELETE FROM schedule sch1
WHERE sch1.ctid NOT IN (
    SELECT MIN(sch2.ctid)
    FROM schedule sch2
    GROUP BY sch2.id
);

DELETE FROM history h1
WHERE h1.ctid NOT IN (
    SELECT MIN(h2.ctid)
    FROM history h2
    GROUP BY h2.id
);
