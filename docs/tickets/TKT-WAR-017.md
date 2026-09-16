# Ticket: [TKT-WAR-017] Digitalización e Integración del Formato Oficial de Inspección de Entrada y Salida de Remolques de Taller (Nº 478)

**Autor / Rama**: feature/2026-09-16-ajustes-finales-taller-compras  
**Módulos Afectados**: [Taller / Mantenimiento | Patio / Recepción | Inventario / Compras | Ficha Técnica]  
**Tipo de Cambio**: [Feature UI | UX/UI Industrial | Digitalización de Formato Físico | Integración Fullstack]  

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO (Se respetan estrictamente todos los tipos de datos, `id_unidad` e `id` numéricos)
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración CodeIgniter 4?**: NO (La tabla `ordenes_trabajo` almacena `materiales` y `archivos_evidencia` como JSON flexible, y la tabla `unidades` ya soporta `tipo = 'Caja'` y `'Thermo'`)
- [x] **Detalle de cambios DDL**: Ninguno. Compatibilidad 100% retrocompatible con MySQL local y servidor remoto.

---

### 2. IMPACTO EN BACKEND (API CI4)
- **Endpoints Existentes Utilizados**:
  - `POST /api/v1/taller/reparaciones`: Recibe la orden de trabajo con el payload enriquecido de la inspección física de remolque en `materiales` y `diagnostico`.
  - `GET /api/v1/unidades`: Consulta de unidades filtrando por tipo `Caja` y `Thermo`.
  - `GET /api/v1/taller/responsables`: Catálogo de mecánicos, permitiendo filtrar especialistas de cajas (`tipo: 'Caja'`).
  - `POST /api/v1/requisiciones`: Enlace de requisiciones de compra para materiales/refacciones de la caja vinculadas a la OT (`orden_trabajo_id`).
- **Controladores / Políticas Shield**:
  - `OrdenesTrabajoController.php` y `RequisicionesController.php` con RBAC `taller` y `admin`. Cero modificaciones de backend requeridas.
- **Compatibilidad con Contrato Existente (`doc 05`)**:
  - 100% retrocompatible.

---

### 3. IMPACTO EN FRONTEND (REACT SPA)
- **Problema Detectado**:
  El equipo de taller cuenta con un formato físico oficial preimpreso para remolques (**"INSPECCION DE ENTRADA Y SALIDA DE REMOLQUES DE TALLER" - Folio Nº 478**) con 18 puntos de inspección (Luces, Arnés, Patines, Masas, Balatas, Suspensión, Piso, etc.), 8 neumáticos tandem numerados del 11 al 18, clasificación de equipo (Caja Seca, Refrigerado, Plataforma) y lista manuscrita de materiales utilizados.
  La vista de "Nueva Orden de Trabajo" solo contemplaba el formato de tractores (Nº 0801 con 32 artículos de motor/quinta rueda), dejando a las cajas sin soporte especializado.
- **Solución Implementada**:
  1. **Selector Maestro en `TallerNuevaOT.tsx`**:
     - `[ 🚛 TRACTOR | 📦 REMOLQUE / CAJA ]`.
     - Al alternar, el formulario conmuta entre el formato de Tractor (Nº 0801) y el formato de Remolque (Nº 478).
  2. **Checklist Oficial de Remolque (18 Puntos)**:
     - Tabla interactiva con checkboxes `OK` y `Necesita Reparación`.
  3. **Matriz de 8 Neumáticos de Remolque (11 al 18)**:
     - Posiciones oficiales tandem del remolque con marcado ágil de estado.
  4. **Captura Híbrida de Materiales**:
     - Búsqueda y autocompletado en catálogo de almacén (con enlace a compras si requiere requisición) y captura libre de insumos menores (tornillos, cintas, silicón), impactando la Ficha de la caja.
  5. **Articulación Patio ➔ Taller**:
     - Filtrado inteligente de alertas de Patio según la pestaña activa (cajas pendientes en modo Remolque, tractos en modo Tractor) con precarga automática de datos y marcado de puntos a reparar al dar clic en "Atender".
  6. **Modal Oficial Imprimible 1:1 (`OrdenRemolqueModal.tsx`)**:
     - Réplica digital del formato impreso Nº 478 con estética industrial, folio rojo y capacidad de exportación a PDF / impresión física.

---

### 4. CHECKLIST PREVIO A PULL REQUEST
- [x] Código verificado en local con backend CI4 en puerto 8085 y base de datos `warhorse_db`.
- [x] Cero llamadas residuales a servidores externos o IPs locales no parametrizadas.
- [x] Sin romper tipado TypeScript (`npm run typecheck`).
- [x] Sin errores de linter ni de empaquetado (`npm run build`).
