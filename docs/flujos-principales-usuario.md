# Flujos Principales de Usuario en WarHorse México
### Manual Narrativo de Operación, Taller, Compras e Inventarios

Este documento describe de manera clara, sencilla y narrativa cómo interactúan las distintas personas del equipo en el día a día dentro de **WarHorse**, y cómo cada acción alimenta una cadena de trazabilidad que culmina en la **Ficha Técnica** de cada unidad (Tractor o Remolque).

---

## 1. Los Actores del Sistema (¿Quién es quién?)

* **El Operador / Chofer**: Quien conduce el tracto o transporta la caja. Reporta sensaciones mecánicas y entrega la unidad al llegar a patio.
* **El Inspector de Patio**: El primer filtro de seguridad. Revisa la unidad físicamente al llegar o antes de salir y documenta su estado real.
* **El Jefe de Taller / Mecánico**: El especialista técnico. Atiende las alertas de patio, diagnostica a fondo, solicita refacciones, realiza las reparaciones y da el visto bueno para que la unidad vuelva a rodar.
* **El Almacenista**: El custodio de las piezas. Entrega tornillos, balatas o mangueras para las reparaciones y recibe los pedidos de los proveedores.
* **El Comprador / Administrador**: Quien gestiona los dineros y proveedores. Convierte las necesidades de taller en órdenes de compra formales y cuida los costos de la flota.

---

## 2. Flujo 1: El Ciclo de Mantenimiento de Tractores (De Patio a Ficha Técnica)

> **Resumen en una frase**: *Una falla detectada en el camino o al llegar a patio se transforma en una orden de trabajo, detona compras si faltan piezas y queda registrada para siempre en el expediente del tractor.*

```
[Llegada a Patio] ➔ [Inspección Tractor] ➔ [Alerta a Taller] ➔ [OT Reporte Nº 0801] 
       ➔ [Requisición de Compra] ➔ [Orden de Compra] ➔ [Cierre de OT] ➔ [Ficha Técnica]
```

### Paso a paso narrativo:
1. **Llegada e Inspección en Patio**:
   El tractor ingresa a las instalaciones. El inspector de patio toma su tableta o computadora y abre el módulo de **Inspección de Patio**. Revisa los puntos críticos (niveles de fluidos, luces, fugas de aire, estado de las 10 llantas). Si encuentra una anomalía (por ejemplo, fuga de aire en la manita o balatas desgastadas), la marca en rojo o amarillo y guarda la inspección.
2. **La Alerta viaja a Taller en Tiempo Real**:
   En ese mismo instante, en la pantalla del **Jefe de Taller** aparece una notificación visual: *"Tracto T-12 con reporte de fuga de aire en suspensión"*.
3. **Generación de la Orden de Trabajo (OT)**:
   El jefe de taller da clic en **"Atender"**. El sistema abre la pantalla de **Nueva OT** en la pestaña **Tractor (Reporte Oficial Nº 0801)**. La información de la unidad, el kilometraje y las fallas detectadas en patio ya vienen precargadas automáticamente. El mecánico revisa los 32 puntos oficiales del tractor y confirma el diagnóstico.
4. **¿Se necesitan refacciones que no hay en estante?**:
   Si la reparación requiere una pieza mayor o especializada (ej. una válvula de 4 vías o un compresor nuevo), el mecánico agrega la refacción a la OT y pulsa **"Generar Requisición de Compra"**. 
5. **Compras toma la estafeta**:
   El departamento de compras recibe la requisición ligada al folio de la OT y al número económico del tractor. Cotiza con proveedores, emite la **Orden de Compra (OC)** y autoriza el gasto.
6. **Recepción y Montaje**:
   El proveedor entrega la refacción. El almacenista le da entrada en el sistema, la OT se actualiza como *"Material Disponible"*, el mecánico monta la refacción y concluye los trabajos.
7. **Cierre e Impacto Permanente en la Ficha Técnica**:
   El jefe de taller valida la reparación, firma digitalmente la OT y la marca como **Liberada**. En ese segundo:
   * La alerta de patio se extingue.
   * La unidad vuelve a estar disponible para viaje.
   * La **Ficha Técnica del Tractor** registra: la inspección de origen, la Orden de Trabajo Nº 0801, las refacciones utilizadas con sus costos y la fecha de salida. Si alguien consulta ese tracto dentro de 6 meses o 2 años, verá exactamente qué pieza se le cambió, quién fue el mecánico y cuánto costó.

---

## 3. Flujo 2: El Ciclo de Mantenimiento de Remolques / Cajas (Formato Oficial Nº 478)

> **Resumen en una frase**: *Las cajas secas y refrigeradas tienen vida y desgaste propios: se inspeccionan en sus 18 puntos físicos y sus 8 llantas tándem, ligando sus insumos directamente al historial de la caja.*

```
[Recepción de Caja] ➔ [Inspección Patio] ➔ [Alerta a Taller] ➔ [OT Remolque Nº 478] 
       ➔ [Surtido / Insumos Menores] ➔ [Impresión Oficial] ➔ [Ficha de la Caja]
```

### Paso a paso narrativo:
1. **Recepción de la Caja en Patio**:
   Un operador desengancha una caja seca o termo (ej. Eco `CJ-07` o `A054`). El inspector de patio verifica sellos de seguridad, puertas, loderas y llantas del remolque. Si detecta un perno flojo, una bisagra rota o cables de luces colgando, levanta el reporte de remolque.
2. **Conmutación Inteligente en Taller**:
   El mecánico entra a **Nueva Orden de Trabajo** y hace clic en el conmutador superior: **[ 📦 Remolque / Caja (Reporte Nº 478) ]**. La interfaz cambia por completo: ahora muestra los campos y requerimientos propios de remolques.
3. **Revisión de los 18 Puntos Físicos y Rodado 11-18**:
   El mecánico realiza la inspección física conforme a la hoja oficial de taller:
   * Revisa patines, manivelas, piso interior/exterior, perno rey, loderas y vida de balatas.
   * Inspecciona las **8 llantas tándem** con la numeración oficial física de remolque: **11, 12, 13, 14, 15, 16, 17 y 18**.
4. **Captura de Materiales (Rápida e Híbrida)**:
   A diferencia de un motor de tractor, en las cajas abundan insumos de herrería y ferretería menor (remaches, bisagras, sellos, tornillería, silicón, mangueras espirales de aire). El mecánico tiene botones rápidos para agregar estos insumos en segundos o buscar refacciones de mayor valor en el catálogo de almacén.
5. **Emisión de la OT y Réplica Oficial Imprimible**:
   Al guardar la orden, el sistema permite abrir la réplica digital idéntica al documento preimpreso con su folio rojo (**Nº 478**), firmas del mecánico y del jefe de taller, y un botón para **Descargar en PDF Oficial** o imprimir en papel.
6. **Trazabilidad en la Ficha Técnica de la Caja**:
   Todo el desgaste de suspensión, balatas, llantas y costos de herrería queda consolidado en la ficha técnica de ese remolque, permitiendo saber si una caja en particular tiene problemas recurrentes de puertas, ejes o alineación.

---

## 4. Flujo 3: El Flujo del Operador y la Inspección de Patio (Semáforo Operativo)

> **Resumen en una frase**: *Garantiza que ninguna unidad salga a carretera con fallas que pongan en riesgo la vida del chofer, la carga o la concesión de la empresa.*

```
[Llegada a Caseta/Patio] ➔ [Captura en Móvil/Tablet] ➔ [Cálculo de Semáforo]
       ├─► [VERDE]: Unidad Apta ➔ Lista para Asignación de Viaje
       └─► [AMARILLO / ROJO]: Bloqueo Preventivo ➔ Disparo de Alerta a Taller
```

### Paso a paso narrativo:
1. **El Operador entrega la unidad**:
   El chofer llega a base después de un viaje de ruta. En caseta o en la bahía de patio, reporta kilometraje, combustible y cualquier comportamiento extraño (ej. "siento que jalonea al frenar").
2. **Inspección de Campo**:
   El inspector de patio recorre la unidad con una lista de verificación digital rápida:
   * Luces altas, bajas, direccionales y cuartos.
   * Presión y profundidad de dibujo de llantas.
   * Nivel de aceite de motor y refrigerante.
   * Golpes o daños visibles en carrocería.
3. **El Semáforo de Decisión**:
   * **Verde (Aprobado)**: La unidad está al 100%. El sistema la marca inmediatamente como *"Disponible para Viaje"* y Tráfico/Operaciones puede asignarle una nueva carga.
   * **Amarillo (Precaución)**: Detalles menores que no impiden rodar pero requieren atención próxima (ej. un foco auxiliar fundido). Se agenda mantenimiento preventivo.
   * **Rojo (Crítico / Paro)**: Problemas graves (frenos, fugas activas, llanta reventada o perno rey dañado). El sistema **bloquea la unidad** para que Tráfico no pueda despacharla en ningún viaje y envía la alerta prioritaria a Taller.

---

## 5. Flujo 4: El Ciclo de Compras y Abastecimiento (De la Requisición a la Factura)

> **Resumen en una frase**: *Convierte las solicitudes de refacciones de taller en compras formales, cotizadas, autorizadas y con imputación directa al centro de costo de cada camión.*

```
[Necesidad en OT / Stock Mínimo] ➔ [Requisición de Compra] ➔ [Cotización y Proveedor] 
       ➔ [Orden de Compra (OC)] ➔ [Recepción en Almacén] ➔ [Aviso a Mecánico]
```

### Paso a paso narrativo:
1. **Nacimiento de la Necesidad**:
   Nace por dos vías:
   * **Vía A (Por Orden de Trabajo)**: El mecánico necesita un embrague nuevo para el Tractor 05.
   * **Vía B (Por Stock Mínimo)**: El almacén nota que quedan menos de 4 filtros de aceite en inventario.
2. **Creación de la Requisición**:
   El solicitante genera la requisición. Si viene de una OT, el sistema ya sabe para qué camión es y con qué urgencia se requiere (Urgente por paro de unidad vs Rutinaria).
3. **Gestión de Compras**:
   El encargado de compras recibe la requisición en su bandeja de entrada:
   * Consulta los proveedores habituales o solicita cotización.
   * Selecciona la mejor opción (precio, tiempo de entrega y calidad).
   * Genera la **Orden de Compra (OC)** formal con condiciones de pago y tiempo de entrega pactado.
4. **Entrega y Recepción Física**:
   El proveedor llega con el paquete a la bodega de WarHorse. El almacenista abre el sistema, busca la OC, coteja que las piezas y cantidades coincidan con la factura o remisión, y da clic en **"Recibir Mercancía"**.
5. **Cierre del Círculo**:
   En ese momento, el sistema:
   * Aumenta el stock en almacén.
   * Notifica al mecánico: *"Tus refacciones para la OT del Tractor 05 ya están en mostrador"*.
   * Carga el costo de la compra a los gastos acumulados de esa unidad.

---

## 6. Flujo 5: Administración de Inventarios y Almacén

> **Resumen en una frase**: *Mantiene el control estricto de qué entra, qué sale, qué está en anaquel y cuánto dinero hay invertido en refacciones.*

```
[Catálogo Maestro] ➔ [Entrada por Compra / Traspaso] ➔ [Stock en Anaquel]
       ➔ [Salida con Imputación a OT] ➔ [Alerta de Reorden Automática]
```

### Paso a paso narrativo:
1. **El Catálogo Maestro de Refacciones**:
   Cada tornillo, filtro, llanta y litro de aceite tiene un código interno, nombre normalizado, unidad de medida, ubicación física (anaquel/gaveta), costo promedio y niveles de stock mínimo y máximo.
2. **Entradas al Inventario**:
   Ocurren cuando se recibe una Orden de Compra o por devolución justificada de material no utilizado en una reparación anterior.
3. **Salidas con Destino Obligatorio (Cero Fugas)**:
   En WarHorse no sale ninguna refacción del mostrador sin un destino claro. Para que el almacenista entregue una pieza, el sistema exige:
   * Número de Orden de Trabajo.
   * Número Económico de la Unidad (Tracto o Caja).
   * Nombre del mecánico receptor.
   Esto elimina el "robo hormiga" y garantiza que cada peso invertido en refacciones quede etiquetado a un camión específico.
4. **Alertas de Reorden Inteligente**:
   Cuando el inventario de un insumo de alta rotación (ej. grasa, líquido de frenos o filtros de diésel) cae por debajo del stock de seguridad, el sistema pinta el indicador en color ámbar y le sugiere a compras generar una nueva requisición antes de que haya desabasto.

---

## 7. Matriz de Conexión: El Viaje Completo del Dato

| Paso | Módulo | ¿Qué dato nace aquí? | ¿A dónde viaja? |
|---|---|---|---|
| **1** | **Inspección de Patio** | Folio de inspección, anomalías detectadas, semáforo (Verde/Amarillo/Rojo) | Viaja a **Alertas de Taller** y al tablero de Tráfico. |
| **2** | **Taller (Nueva OT)** | Folio de OT, formato oficial (Tracto Nº 0801 o Caja Nº 478), diagnóstico técnico, mecánicos asignados | Precarga las fallas de patio y viaja a **Requisiciones**. |
| **3** | **Requisiciones** | Lista de refacciones faltantes ligadas a la OT y al número de unidad | Viaja a la bandeja del **Comprador**. |
| **4** | **Compras (OC)** | Proveedor, precio unitario pactado, fecha de entrega comprometida | Viaja a **Almacén** para su recepción física. |
| **5** | **Almacén / Inventario** | Registro de entrada de mercancía, descargo de refacciones e imputación de costo a la OT | Descuenta stock y habilita el cierre de la **OT**. |
| **6** | **Cierre y Liberación** | Firmas digitales de visto bueno, PDF oficial firmado, fecha y hora de entrega | Apaga la alerta de patio y habilita la unidad en **Tráfico**. |
| **7** | **Ficha Técnica (Destino Final)** | Historial clínico consolidado: Inspección + OT + Refacciones + Costos acumulados | Permanece en el expediente de la unidad para auditoría, reventa o mantenimiento preventivo futuro. |

---

## 8. Conclusión

Con estos 5 flujos interconectados, **WarHorse** deja de ser un conjunto de pantallas aisladas y se convierte en un **sistema vivo de gestión de flota**:
* El operador viaja seguro.
* El inspector detecta a tiempo.
* El mecánico trabaja con formatos oficiales idénticos a los físicos.
* El comprador abastece sin demoras.
* La dirección general conoce al centavo el costo operativo de cada camión y cada remolque.
