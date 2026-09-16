# Ticket: [TKT-WAR-015] Desacoplamiento del Pedido de Refacciones de la OT y Nueva Experiencia de Requisición eCommerce para Taller

**Autor / Rama**: TAVO-REVIEW7-21  
**Módulos Afectados**: [Taller / Mantenimiento | Compras / Suministros | Almacén | AppSidebar | Rutas]  
**Tipo de Cambio**: [Feature UI | Refactor UX/UI | Flujo eCommerce Interno | Trazabilidad de OTs]  

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración CodeIgniter 4?**: NO
- [x] **Detalle de cambios DDL**: Ninguno. Se utiliza la columna `orden_trabajo_id` ya existente y soportada en la tabla `requisiciones` y en el servicio backend `RequisicionesController.php`.

---

### 2. IMPACTO EN BACKEND (API CI4)
- **Endpoints Existentes Utilizados**:
  - `POST /api/v1/requisiciones`: Creación de requisiciones de compra y solicitudes de salida vinculadas con `orden_trabajo_id`, `origen`, `descripcion_pieza`, `cantidad`, `numero_parte` y soporte multi-foto.
  - `GET /api/v1/almacen/articulos`: Catálogo de piezas en almacén para autocompletado en vivo.
  - `PATCH /api/v1/compras/requisiciones/{id}/estado`: Transición de estados y confirmación de despacho.
- **Controladores / Políticas Shield**:
  - Acceso garantizado para rol `taller` y `admin`.
- **Compatibilidad con Contrato Existente (`doc 05`)**: 100% retrocompatible.

---

### 3. IMPACTO EN FRONTEND (REACT SPA)
- **Problema Detectado**:
  En el formulario de Reporte del Mecánico / Apertura de OT (`TallerNuevaOT.tsx`), la Sección 4 obligaba a pedir refacciones en el momento inicial de ingreso del tractor cuando aún no se conoce con certeza el despiece técnico necesario. Esto generaba fricción operativa y solicitudes imprecisas.
- **Solución Implementada**:
  1. **Desacoplamiento en `TallerNuevaOT.tsx`**:
     - La Sección 4 se enfoca estrictamente en tiempos (fechas inicio/fin) y descripción técnica de labores mecánicas.
     - Se retira el asistente de catálogo y la tabla de orígenes de piezas prematura, sustituyéndolos por un banner ergonómico que guía a la solicitud de refacciones una vez diagnosticada la falla.
  2. **Nueva Vista `apps/web/src/pages/taller/TallerRefacciones.tsx`**:
     - Experiencia dedicada tipo *eCommerce* para mecánicos y jefes de taller (`/taller/refacciones`).
     - Selector obligatorio de OT Activa con soporte para precarga vía query param `?ot_id=...`.
     - Buscador inteligente con autocompletado contra el catálogo de almacén (`articulosAlmacen`).
     - Detección automática: si está en catálogo sin stock (desabasto), pasa a compra sin exigir fotografía; si es una pieza nueva no catalogada, exige número de parte, descripción y fotografía obligatoria (hasta 3 fotos).
     - Alerta reactiva de existencias en Almacén Yonke ($0).
  3. **Navegación en `AppSidebar.tsx` y `routes.tsx`**:
     - Nuevo acceso *"Pedido de Refacciones"* bajo el menú de Taller.
     - Ruta `/taller/refacciones` protegida para roles `['taller', 'admin']`.
  4. **Atajos desde `TallerOrdenes.tsx` y `OrdenTrabajoModal.tsx`**:
     - Botón directo *"Solicitar Refacciones"* que enlaza de inmediato la OT a la nueva vista.
   5. **Identidad Visual y Lógica de Almacén Yonke**:
      - El Almacén Yonke se trata como una **categoría de inventario** de stock físico pero no nuevo (piezas reutilizadas/desmontadas de unidades donantes).
      - Respeto irrestricto al sistema visual WarHorse: **El color para Yonke es SIEMPRE MORADO** (`#A855F7` / `#9333EA` / `bg-purple-950/40 text-purple-300 border-purple-500/50`).
      - Filtro rápido en el asistente: `[Todos]`, `[📦 Stock Nuevo]`, `[🟣 Yonke (Stock Usado)]`.
      - Banner morado de pieza de stock usada, badge `🟣 YONKE (STOCK USADO)` en el typeahead y en el carrito con costo $0.
      - Homologación en `ComprasCarrito.tsx` y `ComprasInventario.tsx`.
      - Permisos RBAC en `Routes.php`: se incluyó el rol `taller` en `GET /api/v1/almacen/articulos` (`rbac:taller,compras,admin`).
   6. **Confirmación en `ComprasCola.tsx`**:
      - Visualización de partidas de stock con badge *"Surtido de Almacén"* y piezas de Yonke con badge morado *"♻️ Pieza Yonke ($0)"*, con botón para confirmar entrega física.
   7. **Homologación en `ComprasCarrito.tsx`**:
      - Actualización de la sección de agregar partidas con autocompletado y distinción visual morada de Yonke.
   8. **Optimización Ergonómica de la Tarjeta OT Activa (`TallerRefacciones.tsx`)**:
      - Se retiró el folio redundante (`OT-00002`) del recuadro superior derecho de resumen, ya que se encuentra visible en el selector principal.
      - Se limpió el prefijo de inspección en el diagnóstico (ej. `[Inspección Patio INS-2026-67214 - Operador Juan Morales]:`), dejando únicamente la descripción técnica de la falla para máxima legibilidad.

---

### 4. CHECKLIST PREVIO A PULL REQUEST
- [x] Flujo verificado en navegador con subagent (capturas y video WebP guardados).
- [x] Sin llamadas residuales ni endpoints alucinados.
- [x] TypeScript estricto en verde (`npm run typecheck` exit code 0).
- [x] Linter limpio en los archivos modificados (`npx eslint` exit code 0).
- [x] Respeto total al color morado de marca para piezas de categoría Yonke.
- [x] Trazabilidad completa confirmada con OTs activas.
