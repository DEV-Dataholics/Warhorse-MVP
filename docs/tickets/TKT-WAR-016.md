# Ticket: [TKT-WAR-016] Vista de Consulta y Seguimiento de Estatus de Pedidos de Taller

**Autor / Rama**: TAVO-REVIEW7-21  
**Módulos Afectados**: [Taller / Mantenimiento | Compras / Suministros | AppSidebar | Rutas]  
**Tipo de Cambio**: [Feature UI | Nueva Vista Operativa | Trazabilidad de Requisiciones]  
**Estado**: [Planificado / Especificado - Listo para Implementación]

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración CodeIgniter 4?**: NO
- [x] **Detalle de cambios DDL**: Ninguno. La vista consume los registros de requisiciones ya existentes y vinculados a órdenes de trabajo.

---

### 2. IMPACTO EN BACKEND (API CI4)
- **Endpoints a Utilizar**:
  - `GET /api/v1/compras/requisiciones`: Ya habilitado para roles `['taller', 'compras', 'admin']` con filtros por estado y paginación. Devuelve trazabilidad completa: unidad destino, orden de trabajo, estatus, creado por, aprobado por, fechas, proveedor y costos.
  - `GET /api/v1/requisiciones/{id}/foto`: Autorizado para visualización de fotos de muestra subidas por el mecánico.
- **Controladores / Políticas Shield**:
  - Filtro `rbac:taller,compras,admin` vigente. No se requieren cambios en el backend.

---

### 3. ESPECIFICACIÓN DE FRONTEND (REACT SPA)
- **Necesidad Operativa**:
  El usuario de taller emite pedidos de refacciones (compras externas, stock nuevo o piezas usadas de Yonke $0), pero actualmente no dispone de una vista dedicada para consultar el avance o estatus de sus pedidos en tiempo real. Esto genera incertidumbre sobre cuándo llegará una refacción para continuar la reparación del tracto.
- **Solución Diseñada**:
  1. **Nueva Vista `apps/web/src/pages/taller/TallerPedidos.tsx`**:
     - **Ruta**: `/taller/pedidos` (restringida a roles `['taller', 'admin']`).
     - **Modo Tabla**: Vista densa con columnas de Folio, OT y Unidad destino, Descripción y Núm. Parte, Origen (Stock, Compra, Yonke Morado), Urgencia y Estatus actual de Compras.
     - **Modo Fichas**: Tarjetas modulares de seguimiento con stepper del ciclo de vida (`Solicitado` ➔ `En Cotización` ➔ `Comprado / OC` ➔ `En Tránsito` ➔ `Recibido en Taller`).
     - **Ficha Técnica Detallada (Modal)**: Desglose completo de la requisición con proveedor, costo, fotos y botón de salto a la OT.
  2. **Navegación en `AppSidebar.tsx` y `routes.tsx`**:
     - Acceso directo bajo el *Módulo Taller*: *"Estatus de Pedidos"* con badge `"Tracking"`.
     - Enlace cruzado desde la cabecera de `TallerRefacciones.tsx`.

---

### 4. CHECKLIST PARA SIGUIENTE SESIÓN
- [ ] Crear componente `TallerPedidos.tsx` con soporte dual (Tabla / Fichas).
- [ ] Integrar modal de Ficha Técnica Detallada.
- [ ] Registrar ruta en `routes.tsx` y enlace en `AppSidebar.tsx`.
- [ ] Validar navegación y sincronización en vivo con usuario taller.
- [ ] Ejecutar `npm run typecheck` y `npx eslint`.
