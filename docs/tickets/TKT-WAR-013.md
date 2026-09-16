# Ticket: [TKT-WAR-013] Empate y Digitalización del Formato Físico de Inspección de Viaje (PreTrip / PostTrip) y Diagrama Interactivo de Llantas

**Autor / Rama**: TAVO-REVIEW7-21  
**Módulos Afectados**: [Patio / Yard Operations | Inspección Física | Diagrama de Ejes | Reporte de Viaje]  
**Tipo de Cambio**: [Feature UI | UX/UI Tablet Kiosk | Digitalización de Formatos Físicos]

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO (Se respetan estrictamente todos los tipos de datos y llaves primarias)
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración CodeIgniter 4?**: NO (La tabla `inspecciones_patio` almacena la estructura enriquecida en la columna `datos_json` tipo JSON)
- [x] **Detalle de cambios DDL**: Ninguno. Se mantiene compatibilidad total con la base de datos MySQL local y remota.

---

### 2. IMPACTO EN BACKEND (API CI4)
- **Endpoints Existentes Utilizados**:
  - `POST /api/v1/operadores/inspecciones`: Recibe el payload completo con los 36 parámetros y la matriz del diagrama de neumáticos dentro de `datos_json`.
  - `GET /api/v1/operadores/entrantes`: Devuelve las inspecciones con anomalías para la cola de Taller.
- **Controladores / Políticas Shield**:
  - Controlador `OperadoresController.php` validado y protegido.
- **Compatibilidad con Contrato Existente (`doc 05`)**:
  - 100% compatible.

---

### 3. IMPACTO EN FRONTEND (REACT SPA)
  - `apps/web/src/lib/inspeccionSchema.ts`:
    - Definición de los 36 parámetros físicos exactos del formato en papel "REPORTE DE INSPECCION DE VIAJE" de Warhorse Brokerage para tractocamión.
    - Definición de los 18 parámetros físicos específicos del formato en papel de Caja / Traila (King Pin, Patines/Patas, Techo, Piso, Puertas/Filtraciones, Rotochamber, Manitas de servicio, Líneas de aire, Bolsas de aire, Zoqueteras/Polveras, Luces Marías/Plafones, Documentos).
    - Subesquema para el Diagrama de Llantas adaptable: 10 posiciones en 3 ejes para Tracto y 8 posiciones en 2 ejes tandem para Caja/Semirremolque.
    - Soporte para `tipo_vehiculo: 'tracto' | 'caja'` con campos condicionales (odómetro y combustible omitidos para caja).
  - `apps/web/src/lib/inspeccionStorage.ts`:
    - Incorporación de `obtenerFolioConsecutivoSincrono`, `generarSiguienteFolioInspeccion` y `registrarFolioEmitido` para garantizar la generación y avance continuo del folio histórico consecutivo con máscara `INS-YYYY-00001` (5 dígitos rellenos con ceros), sincronizado con el historial local y persistencia por año.
  - `apps/web/src/components/patio/DiagramaEjesLlantas.tsx`:
    - Soporte dual paramétrico `tipoVehiculo?: 'tracto' | 'caja'`:
      - **Modo Tractocamión**: Chasis con cabina delantera, eje direccional de 2 llantas sencillas y 2 ejes de tracción con 8 llantas duales (Total: 10 llantas).
      - **Modo Caja / Traila**: Chasis alargado de semirremolque con representación gráfica de Perno Rey (King Pin) y Zona de Patines frontales, sin cabina ni eje direccional, enfocado en los 2 ejes tandem traseros con 8 llantas duales (T1 y T2).
      - Botón de aprobación rápida dinámico adaptado a 8 o 10 ruedas.
  - `apps/web/src/pages/patio/PatioInspeccion.tsx`:
    - **Header**: Botón switch táctil grande y prominente para alternar instantáneamente entre **🚛 TRACTOCAMIÓN** y **📦 CAJA / TRAILA**, con persistencia reactiva, reconfiguración automática de catálogo y recarga de items correspondientes (36 vs 18 puntos).
    - **Paso 1**: Selector de PreTrip/PostTrip, folio del sistema correlativo histórico `INS-YYYY-00001`, selector inteligente de flota que filtra cajas (`CJ-...`, `TH-...`) o tractos (`WH-...`), número de placas, timestamp automático en vivo y ocultamiento ergonómico de campos motrices (odómetro y combustible) con banner informativo cuando se inspecciona una traila.
    - **Paso 2**: Pestañas industriales adaptadas según el tipo (`SISTEMAS_TABS_TRACTO` vs `SISTEMAS_TABS_CAJA`), matriz de inspección de 18 puntos para caja o 36 para tracto con botones táctiles de 44px (Bueno, Regular, Crítico) y diagrama interactivo cenital correspondiente.
    - **Paso 3**: Resumen de salud proporcional a la cantidad de puntos, observaciones de bitácora para Caja o Tracto, Carrier Report, timestamp del dictamen y firma táctil en canvas.
  - `apps/web/src/components/patio/OrdenInspeccionModal.tsx`:
    - Generación de PDF oficial y modal de confirmación con títulos y encabezados específicos: "REPORTE DE INSPECCIÓN DE CAJA" con identificador "TRAILA(S):" para semirremolques, y "REPORTE DE INSPECCIÓN DE VIAJE" para tractores, respetando la estructura del diagrama y matriz de puntos.

---

### 4. CHECKLIST PREVIO A PULL REQUEST
- [x] Verificado contra formato físico escaneado oficial de Warhorse Brokerage.
- [x] Diseñado específicamente con zonas táctiles ergonómicas para tableta iPad/Android.
- [x] Cero llamadas residuales o dependencias externas.
- [x] Sin romper tipado TypeScript (`npm run typecheck` exit 0).
- [x] Estilo industrial apegado a la identidad WarHorse (#F2620F, #C5A059, #14181D, Barlow Condensed).
