# Ticket: [TKT-WAR-014] Unificación de Navegación en Administración y Reportes (Eliminación de Redundancia Dashboard Ejecutivo / Salud de Flota)

**Autor / Rama**: TAVO-REVIEW7-21  
**Módulos Afectados**: [Administración & Reportes | AppSidebar | Rutas de Navegación | Dashboard Ejecutivo]  
**Tipo de Cambio**: [UX/UI Refactor | Optimización de Navegación | Limpieza de Deuda Técnica]

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración CodeIgniter 4?**: NO
- [x] **Detalle de cambios DDL**: Ninguno. Cambio 100% de capa frontend.

---

### 2. IMPACTO EN BACKEND (API CI4)
- **Endpoints Nuevos / Modificados**: Ninguno. Ambos accesos consumían los mismos endpoints (`GET /api/v1/unidades`).
- **Controladores / Políticas Shield**: Sin modificaciones. Se mantiene RBAC para rol `admin` y rol directivo.
- **Compatibilidad con Contrato Existente (`doc 05`)**: 100% compatible.

---

### 3. IMPACTO EN FRONTEND (REACT SPA)
- **Problema Detectado**:
  En el menú lateral (`AppSidebar.tsx`), la sección de *Administración & Reportes* contenía dos ítems consecutivos: *"Dashboard Ejecutivo"* (`/dashboard`) y *"Salud de la Flota"* (`/admin/salud-flota`). Ambos conducían exactamente a la misma pantalla (`AdminDashboard.tsx`), la cual ya integra de forma nativa tanto los KPIs de TCO y disponibilidad como el semáforo interactivo de los 5 estados de salud de las unidades. Esto generaba duplicidad visual, desorientación en el usuario final y sobrecarga cognitiva.
- **Solución Implementada**:
  1. **`apps/web/src/components/layout/AppSidebar.tsx`**:
     - Se retiró el ítem redundante *"Salud de la Flota"*.
     - Se consolidó el menú en 3 opciones claras y no redundantes:
       1. **Dashboard Ejecutivo** (`/dashboard`)
       2. **Reportes Maestros** (`/admin/reportes`)
       3. **Usuarios y Auditoría** (`/admin/usuarios`)
  2. **`apps/web/src/routes.tsx`**:
     - Se configuró la ruta `/admin/salud-flota` para redirigir transparentemente a `/dashboard` mediante `<Navigate to="/dashboard" replace />`, preservando compatibilidad con enlaces históricos o marcadores de usuario.

---

### 4. CHECKLIST PREVIO A PULL REQUEST
- [x] Unificación de ítems en `AppSidebar.tsx`.
- [x] Redirección retrocompatible configurada en `routes.tsx`.
- [x] Verificación de compilación TypeScript (`npm run typecheck` exit 0).
- [x] Comprobación de navegación fluida y sin rebotes en dev server.
