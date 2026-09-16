# Ticket: [TKT-WAR-018] Saneamiento de Flujos, Cierre de CRUDs y Trazabilidad Integral en Ficha Técnica

**Autor / Rama**: feature/2026-09-16-ajustes-finales-taller-compras  
**Módulos Afectados**: [Sidebar / Navegación | Taller (Mecánicos y OTs) | Compras (Proveedores e Inventario) | Catálogo de Flota | Ficha Técnica | Inspección de Patio]  
**Tipo de Cambio**: [Refactor UX/UI | Cierre de Dead Ends | Herramientas de Gestión CRUD | Trazabilidad E2E]  

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO (Se reutilizan las tablas existentes `responsables_taller`, `ordenes_trabajo`, `inspecciones_patio`, `proveedores` y `unidades`)
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO (Estricta inmutabilidad de PKs históricas)
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración CodeIgniter 4?**: NO (Todas las columnas necesarias `tipo`, `rol`, `activo`, `estado`, `diagnostico` ya existen en el esquema)
- [x] **Detalle de cambios DDL**: Ninguno. 100% retrocompatible.

---

### 2. IMPACTO EN BACKEND (API CI4)
- **Endpoints Existentes y Mejorados**:
  - `PATCH /api/v1/taller/responsables/(:num)`: Actualizar datos de mecánico (nombre, tipo, rol y activo).
  - `DELETE /api/v1/taller/responsables/(:num)`: Baja lógica de mecánicos (`activo = 0`).
  - `PATCH /api/v1/taller/reparaciones/(:num)`: Actualización de diagnóstico y cancelación de OT (`estado: 'Cancelada'`).
  - `GET /api/v1/unidades/(:num)/ficha`: Payload enriquecido con órdenes de trabajo oficiales e inspecciones de patio vinculadas.
  - `GET /api/v1/compras/proveedores`: Directorio completo de proveedores con términos de crédito.
- **Controladores / Políticas Shield**:
  - `OrdenesTrabajoController.php`, `ComprasController.php`, `FichaService.php` bajo roles RBAC `taller`, `compras` y `admin`.
- **Compatibilidad con Contrato Existente (`doc 05`)**:
  - 100% retrocompatible; solo se agregan rutas RESTful estándar.

---

### 3. IMPACTO EN FRONTEND (REACT SPA)
- **Fase 1: Navegación y Duplicidades**:
  - `AppSidebar.tsx`: Integración visible de `/catalogo` en el menú principal; eliminación de enlaces duplicados y badges fijos no reactivos.
  - `routes.tsx`: Eliminación de ruta tipográfica `/compras/yonkee`.
  - `Catalogo.tsx`: Remoción de la pestaña redundante de "Almacén", centralizando todo el control de stock en `ComprasInventario.tsx`.
- **Fase 2: Cierre de CRUDs**:
  - `TallerPersonal.tsx`: Modal de edición de mecánico y acción de baja lógica / reactivación. Reemplazo del texto fijo de acreditación por estatus real.
  - `TallerOrdenes.tsx`: Modal de cancelación de OT con motivo justificado y edición de diagnóstico para OTs activas.
  - `ComprasProveedores.tsx` (o pestaña integrada): Directorio maestro de proveedores con edición de contactos y condiciones comerciales.
- **Fase 3: Trazabilidad Integral en Ficha Técnica**:
  - `Ficha.tsx`: Distinción adaptativa de Cajas/Remolques vs Tractores (ocultando diésel para cajas y destacando rodado tándem 11-18 y formato Nº 478); inclusión de pestaña de Inspecciones de Patio e hipervínculos a los formatos oficiales PDF.
  - `inspeccionStorage.ts` / `TallerOrdenes.tsx`: Cierre de ciclo Patio ➔ Taller marcando la inspección como resuelta al liberar la unidad.

---

### 4. CHECKLIST PREVIO A PULL REQUEST
- [ ] Código verificado en local con backend CI4 en puerto 8085.
- [ ] Cero llamadas residuales o URLs duras.
- [ ] Sin romper tipado TypeScript (`npm run typecheck`).
- [ ] Sin errores de linter ni empaquetado (`npm run build`).
