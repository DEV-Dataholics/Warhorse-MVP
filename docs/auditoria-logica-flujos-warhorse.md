# Auditoría Lógica de Diseño de Sistema, Flujos y Experiencia de Usuario
### WarHorse México — Diagnóstico Operativo, Dead Ends, Faltantes de Gestión y Ruido Cognitivo

**Fecha de Auditoría**: 16 de Septiembre de 2026  
**Referencia Base**: [`docs/flujos-principales-usuario.md`](file:///c:/Users/gruiz/OneDrive/Documentos/warhorse-mvp/docs/flujos-principales-usuario.md)  
**Alcance**: Módulos de Patio, Taller (Tractos y Cajas), Compras, Inventario/Almacén y Ficha Técnica  
**Estándar de Evaluación**: Skill `expert-ux-ui`, Skill `vibe-coding-guard` y Reglas de Integridad Fullstack

---

## 1. Resumen Ejecutivo del Diagnóstico

WarHorse cuenta con una base funcional sólida, lógica de negocio avanzada y un diseño industrial de alto nivel. Sin embargo, al auditar los 5 flujos de extremo a extremo, se identificaron **4 categorías críticas de fricción operativa**:

1. **Dead Ends (Callejones sin salida)**: Flujos donde el dato nace pero queda desconectado a mitad del camino (ej. la inspección de patio no se entera de la liberación en taller; la OT no muestra el estatus de sus compras en tiempo real; y la Ficha Técnica no enlaza a los folios oficiales de inspección y OT).
2. **Faltantes de Gestión (CRUDs Incompletos)**: Tablas y entidades maestras donde el usuario puede "Crear" pero **no puede Editar, Desactivar o Eliminar** (Mecánicos, Proveedores, OTs erróneas).
3. **Vistas Duplicadas o Rutas Fantasma**: Pantallas paralelas que compiten por la misma función (ej. doble catálogo de almacén, rutas gemelas en diésel y compras).
4. **Ruido Cognitivo y Elementos de "Adorno"**: Etiquetas, badges estáticos y métricas fijas que aparentan interactividad o dinamismo pero no están conectadas a la realidad operativa, generando desconfianza en el usuario.

---

## 2. Hallazgos por Flujo Operativo

---

### FLUJO 1 & 2: Taller y Mantenimiento (Tractos Nº 0801 y Remolques Nº 478)

#### A. Callejones sin salida (Dead Ends)
* 🔴 **OT Huérfana de Compras**:
  Cuando el mecánico crea una requisición desde la OT (o desde `TallerRefacciones`), la orden en `TallerOrdenes.tsx` no muestra en qué estado va la pieza (*"En Cotización"*, *"Comprada"*, *"Llegó a Almacén"*). El mecánico está a ciegas y debe preguntar en persona al comprador o salir de su módulo para averiguarlo.
* 🔴 **Imposibilidad de Cancelar o Anular una OT**:
  Si un usuario abre una OT por error, por duplicidad o si la unidad finalmente se envió a viaje porque la falla no era crítica, **no existe botón ni estado de "Cancelar / Descartar OT"**. La orden queda eternamente como "Activa" inflando los indicadores de unidades paradas.
* 🔴 **Edición Bloqueada Post-Creación**:
  Una vez guardada la OT, no se puede corregir el diagnóstico, ni reasignar el mecánico responsable, ni agregar notas técnicas adicionales; solo se puede avanzar el estado o liberarla.

#### B. Faltantes de Herramientas de Gestión (CRUD)
* 🟡 **Catálogo de Mecánicos (`TallerPersonal.tsx`)**:
  - Permite crear nuevos mecánicos y generar gafete QR.
  - **FALTA**: No existe botón para **Editar** (cambiar de rol: Auxiliar a Mecánico A, o cambiar de Tracto a Caja).
  - **FALTA**: No existe opción para **Desactivar / Dar de baja** a un colaborador que renunció. El mecánico inactivo sigue apareciendo para siempre en la lista de responsables al abrir una OT.
* 🟡 **Puntos de Inspección Fijos en Código**:
  Los 18 puntos de remolque y los 32 de tractor están hardcodeados en esquemas TypeScript (`tallerSchema.ts`). Si el taller adquiere tolvas, pipas o nodrizas con puntos de inspección distintos, no hay un catálogo administrativo para configurarlos.

#### C. Ruido Cognitivo y Adornos
* 🟠 **Badge de "Estatus Técnico: Acreditado"**:
  En cada tarjeta de mecánico en `TallerPersonal.tsx`, aparece un indicador verde fijo *"Acreditado"*. Es un texto decorativo que no proviene de ninguna tabla de certificaciones o cursos del personal.
* 🟠 **Columna "Salud Flota" en la Tabla de OTs**:
  Calcula valores como *"Activo 100%"* o *"En Taller 0%"* con lógica local en React que no empata con la matriz oficial del servidor.

---

### FLUJO 3: Inspección de Patio (El Semáforo Operativo)

#### A. Callejones sin salida (Dead Ends)
* 🔴 **Desconexión Patio ➔ Taller ➔ Patio**:
  El operador o supervisor de patio genera una inspección con semáforo Rojo. En Taller se atiende y se libera la unidad. **Pero en `PatioHistorial.tsx`, la inspección original permanece con estatus de anomalía abierta**. El operador nunca ve si su reporte fue resuelto o ignorado, rompiendo la confianza en el sistema.
* 🔴 **Almacenamiento Local Aislado**:
  Las inspecciones de patio residen prioritariamente en `IndexedDB` local para permitir trabajo sin internet. Aunque existe sincronización básica, si un supervisor entra desde otra máquina de oficina, no siempre ve el historial completo capturado en la tableta de patio si no se forzó el guardado en backend.

#### B. Faltantes de Gestión
* 🟡 **Imposibilidad de Corregir Capturas Erróneas**:
  Si el inspector tecleó por error un odómetro disparatado (ej. 1,000,000 km en lugar de 100,000 km) o seleccionó la unidad equivocada, la inspección queda sellada sin posibilidad de corrección justificada por un supervisor.

#### C. Ruido Cognitivo
* 🟠 **Badges Estáticos en Menú Lateral**:
  En `AppSidebar.tsx`, el botón de *"Nueva Inspección"* lleva un badge fijo que dice `Offline`, y el de *"Terminal Tablet"* dice `Kiosk`. Ambos son textos fijos que no indican si hay o no conexión real ni aportan utilidad al usuario.

---

### FLUJO 4: Compras y Abastecimiento

#### A. Callejones sin salida (Dead Ends)
* 🔴 **Recepción de Mercancía sin Enlace a Entrada de Inventario**:
  En `ComprasCola.tsx`, cuando una requisición avanza a *"Comprado"* o *"En recolección"*, el flujo se detiene ahí. No existe un botón de *"Marcar como Recibido en Almacén"* que en automático sume las unidades al stock en `ComprasInventario` y cierre la partida en la OT.
* 🔴 **Duplicidad de Vistas de Pedidos de Refacciones**:
  Existe `TallerRefacciones.tsx` (ruta `/taller/refacciones`) y `ComprasCarrito.tsx` (ruta `/compras/carrito`). Ambas pantallas permiten armar carritos de piezas, buscar en catálogo y emitir requisiciones. Esto confunde al usuario: ¿dónde pide las piezas el mecánico y dónde las procesa el comprador?

#### B. Faltantes de Gestión (CRUD)
* 🟡 **Inexistencia de un Catálogo Maestro de Proveedores**:
  Los proveedores solo se pueden dar de alta a través de un mini modal rápido cuando se está emitiendo una orden de compra en caliente. No hay una vista de `/compras/proveedores` donde se pueda:
  - Ver el directorio de proveedores.
  - Editar teléfonos, correos y contactos de ventas.
  - Asignar días de crédito reales (15, 30, 45 días) o condiciones fiscales.
  - Desactivar proveedores con mal servicio.

#### C. Rutas Fantasma y Errores Tipográficos
* 🟠 **Ruta `/compras/yonkee`**:
  En `routes.tsx` existe registrada una ruta `/compras/yonkee` (con doble "e") como parche por error de tipeo.
* 🟠 **Enlaces Duplicados en Sidebar**:
  `/compras/carrito` y `/compras/caja-chica` cargan exactamente la misma pantalla. El usuario hace clic esperando ver el control de caja chica y se encuentra con el carrito de compras estándar.

---

### FLUJO 5: Administración de Inventarios y Almacén

#### A. Vistas Reiterativas y Duplicadas
* 🔴 **Doble Gestión de Almacén**:
  - En `Catalogo.tsx` existe una pestaña llamada **"Almacén"** que lista los SKUs, permite crear artículos y editar stock mínimo/máximo.
  - En `ComprasInventario.tsx` (`/compras/inventario`) existe una pantalla hipercompleta con Kardex, bitácora de 12 atributos, importación/exportación CSV y semáforos de stock.
  - **Problema**: Son dos pantallas desconectadas para la misma base de datos. Si el usuario edita en `Catalogo`, no ve los movimientos del Kardex; si usa `ComprasInventario`, no entiende por qué hay otro almacén en el catálogo general.

#### B. Faltantes de Gestión (CRUD)
* 🟡 **Baja de Refacciones Obsoletas**:
  En `ComprasInventario.tsx` se pueden registrar entradas y salidas, pero no hay forma de **desactivar o marcar como descontinuado** un número de parte que ya no se usa en la flota, acumulando basura en las sugerencias de autocompletado.

---

### DESTINO FINAL: La Ficha Técnica (`Ficha.tsx`)

#### A. Callejones sin salida (El eslabón roto de la trazabilidad)
* 🔴 **Ausencia de las Inspecciones de Patio**:
  La Ficha Técnica solo muestra reparaciones de taller y cargas de diésel. **No tiene rastro de las inspecciones físicas de patio**. El historial clínico de la unidad está incompleto porque no se puede ver qué reportó el chofer antes de que el camión entrara al taller.
* 🔴 **Sin Acceso al Formato Oficial Imprimible**:
  En la tabla de reparaciones de la ficha, los registros no tienen botón para ver o imprimir la OT correspondiente (Reporte Nº 0801 o Nº 478). La trazabilidad queda en una simple línea de texto sin respaldo documental.
* 🔴 **Incongruencia Total con Remolques y Cajas**:
  Si se consulta la Ficha Técnica de una Caja Seca (ej. `CJ-07` o `CJ-502`):
  - El sistema muestra una tarjeta gigante que dice: **"Gasto Diésel: $0.00"** (las cajas no tienen motor).
  - No muestra las horas de trabajo del Thermo (en caso de cajas refrigeradas).
  - No muestra el estado de los 18 puntos ni la vida de balatas del formato oficial Nº 478.
  - Utiliza terminología exclusiva de tractores.
* 🔴 **Ficha Técnica "Ciega" (Sin Navegación Directa)**:
  El catálogo de unidades (`/catalogo`) **no aparece en la barra lateral izquierda**. Un usuario común no tiene cómo llegar a la lista de camiones para abrir sus fichas, a menos que escriba la URL a mano en el navegador o haga clic en un enlace diminuto dentro de otra tabla.

---

## 3. Matriz de Auditoría: Comparativa de Calidad

| Módulo / Flujo | ¿Flujo Completo? | ¿Tiene CRUD Completo? | ¿Tiene Vistas Duplicadas? | ¿Tiene Ruido o Adornos? | Veredicto |
|---|---|---|---|---|---|
| **Patio (Inspección)** | ⚠️ Parcial (No cierra ciclo con Taller) | ❌ Solo creación; sin edición de errores | 🟢 Limpio | 🟠 Badges fijos en sidebar | **Requiere Cierre de Ciclo** |
| **Taller (Nueva OT)** | ✅ Excelente (Tracto 0801 y Remolque 478) | ⚠️ Falta cancelar OT y editar diagnóstico | 🟢 Limpio | 🟢 Mínimo | **Aprobado con Mejoras CRUD** |
| **Taller (Mecánicos)** | ⚠️ Aislado | ❌ Solo crea; no edita ni desactiva | 🟢 Limpio | 🟠 Estatus "Acreditado" falso | **CRUD Urgente** |
| **Compras (Requisición/OC)** | ⚠️ Brecha en recepción a almacén | ❌ Sin catálogo formal de proveedores | 🔴 Duplicidad con TallerRefacciones | 🟠 Enlaces alias en sidebar | **Unificación Necesaria** |
| **Almacén / Inventario** | ✅ Robusto en `ComprasInventario` | ⚠️ Falta baja de SKUs obsoletos | 🔴 Duplicado con pestaña en Catalogo | 🟢 Funcional | **Eliminar Almacén en Catalogo** |
| **Ficha Técnica** | ❌ Incompleto para Cajas y sin Inspección | ❌ 100% Solo Lectura | 🟢 Limpio | 🟠 Diésel en $0 en Cajas | **Intervención Crítica** |

---

## 4. Plan de Acción Recomendado (Siguientes Pasos)

Para convertir a WarHorse en una plataforma 100% fluida, intuitiva y profesional, se recomiendan las siguientes **4 intervenciones quirúrgicas**:

### Intervención 1: Sanear la Barra Lateral y Eliminar Duplicidades (Quick Win)
1. **Agregar el Catálogo de Flota (`/catalogo`) al Sidebar** bajo la sección de Administración o Flota, dándole visibilidad inmediata.
2. **Eliminar la pestaña "Almacén" de `Catalogo.tsx`** y dejar como único centro oficial de inventarios a `ComprasInventario.tsx` (`/compras/inventario`).
3. **Limpiar enlaces redundantes en Sidebar**:
   - Quitar `/taller/liberaciones` (redirigir al filtro de liberadas dentro de `TallerOrdenes`).
   - Quitar `/compras/caja-chica` (unificar dentro del panel de compras con su filtro respectivo).
   - Unificar `/diesel/cargas` y `/diesel/externas` en una sola entrada clara: *"Gestión de Diésel"*.
   - Limpiar la ruta errónea `/compras/yonkee` en `routes.tsx`.

### Intervención 2: Completar CRUDs Esenciales (Herramientas de Gestión)
1. **Mecánicos (`TallerPersonal.tsx`)**:
   - Agregar botón de **Editar** (nombre, tipo y especialidad).
   - Agregar toggle para **Activar / Desactivar** mecánico (baja lógica para que no aparezca en nuevas OTs pero conserve su historial pasado).
2. **Órdenes de Trabajo (`TallerOrdenes.tsx`)**:
   - Agregar acción de **Cancelar / Descartar OT** (con confirmación modal y motivo obligatorio).
   - Permitir editar diagnóstico o reasignar mecánico en OTs en estado "Activa".
3. **Catálogo de Proveedores**:
   - Crear una pestaña o modal de gestión completa de proveedores en Compras para editar teléfonos, RFC y condiciones comerciales.

### Intervención 3: Conectar los Dead Ends del Flujo
1. **Patio ➔ Taller ➔ Patio**:
   - Cuando se libera una OT que provino de una inspección de patio, marcar la inspección como *"Resuelta / Liberada"* en la base de datos para que el operador vea su semáforo en verde en su historial.
2. **OT ➔ Compras ➔ Almacén ➔ OT**:
   - En la tabla de OTs, mostrar un badge dinámico de refacciones: `Sin Requisición`, `En Compra (OC-012)` o `Refacción en Almacén`.
   - Agregar en Compras el botón *"Entregar a Taller / Ingresar a Almacén"* con un solo clic.

### Intervención 4: Enriquecer la Ficha Técnica (`Ficha.tsx`)
1. **Pestañas por Tipo de Unidad**:
   - Si es **Tractor**: Mostrar KPIs de diésel, reparaciones de motor y rendimiento km/l.
   - Si es **Caja / Remolque**: Ocultar el gasto de diésel, mostrar historial de inspecciones del Formato Nº 478, estado del rodado tándem (11-18) y horas de thermo.
2. **Incorporar la Trazabilidad Documental**:
   - Pestaña de **"Inspecciones de Patio"** recibidas por esa unidad.
   - Botón de **"Ver Formato Oficial"** en cada reparación para abrir directamente el PDF del Reporte Nº 0801 o Nº 478.
   - Enlace directo desde la Ficha para **"Abrir Nueva OT para esta Unidad"**.
