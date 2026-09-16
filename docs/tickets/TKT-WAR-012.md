# Ticket: [TKT-WAR-012] Homologación y Cruce Definitivo de Inventario General y Control Mensual de Almacén

**Autor / Rama**: TAVO-REVIEW7-21  
**Módulos Afectados**: [Compras / Almacén | ComprasInventario | Kardex Mensual | Catálogo de Piezas]  
**Tipo de Cambio**: [Feature | UX/UI | Integración de Datos Reales | Schema Alignment]  

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: SÍ (Campos no destructivos opcionales en `catalogo_piezas` y tabla opcional/almacenamiento de movimientos)
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración CodeIgniter 4?**: Opcional (migración no destructiva para tabla `movimientos_inventario` y campos `proveedor_habitual`, `departamento_destino` en `catalogo_piezas` o almacenamiento híbrido con IndexedDB/localStorage de respaldo para cero fricción).
- [x] **Detalle de cambios DDL**: 
  - Nuevas columnas opcionales en `catalogo_piezas`: `proveedor_habitual` VARCHAR(120) NULL, `departamento_destino` VARCHAR(80) NULL.
  - Tabla no destructiva `movimientos_almacen` (id, articulo_id, tipo_transaccion, cantidad, balance_resultante, fecha, solicitante, departamento, autorizado_por, comentarios, created_at).

### 2. IMPACTO EN BACKEND (API CI4)
- **Endpoints Nuevos / Modificados**:
  - `GET /api/v1/almacen/articulos`: Extender payload con proveedor habitual y departamento si existen.
  - `GET /api/v1/almacen/movimientos`: Historial de transacciones de inventario con filtros por mes/año y departamento.
  - `POST /api/v1/almacen/movimientos`: Registro formal de entrada, salida o ajuste con actualización atómica de balance.
  - Soporte resiliente con fallback a almacenamiento local/cache reactivo para disponibilidad offline continua.
- **Políticas Shield / RBAC**: Rol `compras`, `taller` y `admin`.
- **Compatibilidad con Contrato Existente**: 100% retrocompatible con la apertura de OTs y requisiciones.

### 3. IMPACTO EN FRONTEND (REACT SPA)
- **Problema Detectado**:
  El área de compras y almacén utiliza una plantilla mensual en Excel/CSV (`Control_de_Inventario_Mensual_2026 - ENERO 2026.csv`) con un flujo de 12 columnas: `#`, `Numero de Parte#`, `Descripcion de Parte`, `Proveedor`, `Tipo de Transaccion (ENTRADA/SALIDA/AJUSTE)`, `Cantidad`, `Balance`, `Fecha`, `Solicitante`, `Departamento` (Taller Cajas / Taller Tractos / etc.), `Autorizado por:` y `Comentarios`.
  El sistema WarHorse actual solo contaba con una tabla estática de artículos y un ajuste numérico directo de `stock_actual`, careciendo de la bitácora mensual de transacciones (Kardex), la identificación de proveedores por pieza, la asignación de solicitantes/departamento y la trazabilidad de balance.
- **Solución Propuesta ("El Formato de Inventario Definitivo")**:
  1. **Doble Vista Tabular**:
     - **Pestaña A: Catálogo y Existencias en Tiempo Real**: Lista de SKUs con stock actual (balance), stock mín/máx, precios de referencia, valorización de inventario, proveedor habitual y departamento de destino. Acciones rápidas para registrar movimiento, consultar Kardex y pedir reabastecimiento a compras.
     - **Pestaña B: Control de Inventario Mensual (Kardex)**: Réplica interactiva fiel a su archivo CSV con las 12 columnas exactas, badges cromáticos según tipo de transacción (🟢 ENTRADA, 🔴 SALIDA, 🔵 AJUSTE ENTRADA, 🟡 AJUSTE SALIDA), selector de periodo mensual y filtros por departamento (Taller Tractos, Taller Cajas, Tráfico, RH).
  2. **Herramientas de Importación y Exportación Oficial**:
     - **Exportar CSV Mensual**: Genera el archivo en el formato idéntico al que ellos usan para auditoría o compartición.
     - **Importar CSV de Movimientos**: Permite arrastrar o cargar su archivo mensual CSV para alimentar y sincronizar automáticamente tanto el catálogo como las transacciones históricas.
  3. **Modal de Movimiento Enriquecido**:
     - Permite registrar entradas, salidas y ajustes capturando: Artículo, Cantidad, Tipo, Proveedor, Solicitante (mecánico o unidad), Departamento y Autorizado por.
  4. **Población con Datos Reales de Warhorse**:
     - Pre-cargar las refacciones y proveedores reales más frecuentes del archivo (Apymsa, Diesel Parts, Cemaco, Tarango, Promare, Trasejusa, Semco, etc.) para que el sistema refleje la realidad operativa de Warhorse México.

### 4. CHECKLIST PREVIO A PULL REQUEST
- [ ] Creación de esquema y tipos TypeScript para movimientos de inventario y Kardex (`inventarioSchema.ts`).
- [ ] Implementación de la vista dual (Existencias + Kardex Mensual) en `ComprasInventario.tsx`.
- [ ] Modal de registro de transacciones con los 12 atributos del formato físico/CSV.
- [ ] Utilidades de exportación e importación directa de CSV compatible.
- [ ] Validación de compilación (`npx tsc --noEmit`) sin errores.
- [ ] Verificación en navegador y reporte de walkthrough.
