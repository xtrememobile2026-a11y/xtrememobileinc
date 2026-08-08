# TODO - Tareas Pendientes

## Tarea Actual: Impresión de Recibos Profesionales ✅ IMPLEMENTADA
- [x] `index.html`: Agregar botones "Imprimir" en Inventario, Accesorios e Inventario General
- [x] `index.html`: Agregar contenedor `#printReceipt`
- [x] `css/styles.css`: Agregar estilos del recibo profesional y reglas `@media print`
- [x] `js/export.js`: Crear módulo `Receipt` con `printInventory()`, `printAccesories()`, `printSupplies()`
- [x] `js/export.js`: Conectar botones de impresión en `Export.init()`
- [x] `js/export.js`: Corregir marca a "XTREME MOBILE INC." con teléfono 787-205-2220
- [x] `js/app.js`: Mejorar PDF del Inventario General con encabezado profesional

## Tarea Nueva: Texto en Movimiento + Popup de Bienvenida + Tour Guiado ✅ IMPLEMENTADA
- [x] `index.html`: Agregar barra de ticker/noticiero con texto en movimiento
- [x] `css/styles.css`: Agregar estilos y animación del ticker
- [x] `index.html`: Agregar modal de bienvenida (¿Eres nuevo en el sistema?)
- [x] `index.html`: Agregar overlay del tour guiado
- [x] `js/app.js`: Disparar popup de bienvenida al entrar al panel en `showMainApp()`
- [x] `js/app.js`: Llamar `Tour.init()` en `App.init()`
- [x] `js/tour.js`: Crear módulo del tour guiado con pasos y spotlight
- [x] `css/styles.css`: Agregar estilos del modal de bienvenida y del tour
- [x] `index.html`: Incluir script `js/tour.js`

## Verificación Final ✅
- [x] Ticker se desplaza correctamente (animación `ticker-scroll` 30s)
- [x] Popup de bienvenida aparece al entrar al panel (`Tour.showWelcomeIfNew()`)
- [x] Tour guiado funciona paso a paso con botón "Siguiente" y spotlight
- [x] Texto del ticker incluye el recordatorio de ventas
