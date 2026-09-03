<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ConflictoException;
use App\Exceptions\NoEncontradoException;
use App\Exceptions\ProhibidoException;
use App\Exceptions\ValidacionException;
use App\Libraries\Bd;
use App\Models\RequisicionModel;
use App\Models\UnidadModel;
use CodeIgniter\HTTP\Files\UploadedFile;

/**
 * Reglas de la requisición (RF-REQ-01..07): foto obligatoria y validada
 * (A08), donante Yonke, valorización en cascada server-side (ADR-002),
 * notificación a Compras encolada y policy anti-IDOR de lectura.
 */
final class RequisicionService
{
    private const MIMES_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
    private const EXT_FOTO   = ['jpg', 'jpeg', 'png', 'webp'];
    private const MAX_BYTES  = 8 * 1024 * 1024;

    public function __construct(
        private readonly RequisicionModel $requisiciones = new RequisicionModel(),
        private readonly UnidadModel $unidades = new UnidadModel(),
        private readonly ValorizacionService $valorizacion = new ValorizacionService(),
        private readonly AuditoriaService $auditoria = new AuditoriaService(),
        private readonly ConsolidadoService $consolidado = new ConsolidadoService(),
    ) {
    }

    /**
     * Cola de Compras (RF-COM-01): ordenada Crítica→Media→Rápida, filtrable
     * por estado; usa el índice compuesto (estado, urgencia) del doc 03.
     *
     * @return list<array<string, mixed>>
     */
    public function listarCola(?string $estado, int $pagina = 1, int $porPagina = 100): array
    {
        $builder = db_connect()->table('requisiciones r')
            ->select("r.*, COALESCE(d.id_unidad, 'Almacén') AS unidad_destino, d.es_modificada AS destino_modificada, y.id_unidad AS unidad_donante, c.nombre AS creado_por_nombre, a.nombre AS aprobado_por_nombre")
            ->join('usuarios c', 'c.id = r.creado_por', 'left')
            ->join('usuarios a', 'a.id = r.aprobado_por', 'left')
            ->join('unidades d', 'd.id = r.unidad_destino_id', 'left')
            ->join('unidades y', 'y.id = r.unidad_donante_id', 'left');

        if ($estado !== null && $estado !== '') {
            $builder->where('r.estado', $estado);
        }

        // El ENUM ya ordena Rápida < Media < Crítica: DESC = Crítica primero.
        // Con top-N paginado el orden lo resuelven los índices idx_req_cola /
        // idx_req_cola_global, cero filesort (doc 06 §3)
        return Bd::filas(
            $builder->orderBy('r.urgencia', 'DESC')
                ->orderBy('r.fecha_solicitud', 'ASC')
                ->limit($porPagina, ($pagina - 1) * $porPagina),
        );
    }

    /**
     * Avanza el ciclo de una requisición (RF-COM-02/03) según la máquina
     * §4.2 del SRS. La instalación corre en transacción ACID: requisición +
     * consolidado del destino + auditoría con el origen del estimado.
     *
     * @param array<string, mixed> $cambio
     * @param array<string, mixed> $actor
     *
     * @return array<string, mixed>
     */
    public function avanzarEstado(int $id, array $cambio, array $actor): array
    {
        $req = $this->requisiciones->porId($id);
        if ($req === null) {
            throw new NoEncontradoException('Requisición no encontrada.');
        }

        $nuevo  = (string) ($cambio['estado'] ?? '');
        $origen = (string) $req['origen'];
        $actual = (string) $req['estado'];
        
        $aprobadoPor = $req['aprobado_por'] ?? null;
        if ($actual === 'Solicitado' && $nuevo !== 'Solicitado' && empty($aprobadoPor)) {
            $aprobadoPor = (int) $actor['id'];
        }

        
        $aprobadoPor = $req['aprobado_por'];
        if ($actual === 'Solicitado' && $nuevo !== 'Solicitado' && empty($aprobadoPor)) {
            $aprobadoPor = (int) $actor['id'];
        }


        // Si cambia a cualquier estado que no sea 'Solicitado', registramos al aprobador
        // si es que aÃºn no tiene uno.
        $aprobadoPor = $req['aprobado_por'];
        if ($actual === 'Solicitado' && $nuevo !== 'Solicitado' && empty($aprobadoPor)) {
            $aprobadoPor = (int) $actor['id'];
        }


        // RF-INT-03: una requisición Yonke jamás lleva factura
        if ($origen === 'Yonke' && ! empty($cambio['numero_factura'])) {
            throw new ConflictoException('Una requisición Yonke no puede llevar número de factura.');
        }

        $estadosValidos = [
            'Solicitado', 'En aprobación', 'En pago', 'En recolección',
            'Más información', 'Cancelado', 'Rechazado', 'Instalado',
            'Cotizado', 'Comprado', 'En trayecto', 'Bajo pedido'
        ];

        if (! in_array($nuevo, $estadosValidos, true)) {
            throw new ConflictoException("Estado destino inválido: {$nuevo}.");
        }

        if (in_array($actual, ['Instalado', 'Cancelado', 'Rechazado'], true)) {
            throw new ConflictoException("No se puede cambiar el estado desde un estado terminal: {$actual}.");
        }

        $actualizacion = ['estado' => $nuevo];
        
        if (!empty($cambio['proveedor'])) {
            $actualizacion['proveedor'] = $cambio['proveedor'];
        }
        if (isset($cambio['es_caja_chica'])) {
            $actualizacion['es_caja_chica'] = (int) $cambio['es_caja_chica'];
        }
        if (!empty($cambio['factura_xml'])) {
            $actualizacion['factura_xml'] = $cambio['factura_xml'];
        }
        

        $justificacion = null;
        if (in_array($nuevo, ['Cancelado', 'Rechazado', 'Más información'], true)) {
            $justificacion = trim((string) ($cambio['justificacion'] ?? ''));
            if ($justificacion === '') {
                throw new ValidacionException('Es obligatorio registrar una justificación al cancelar, rechazar o solicitar más información.', [
                    'justificacion' => ['Es obligatorio registrar una justificación.']
                ]);
            }
        }

        if (isset($cambio['archivo_cotizacion'])) {
            $cotizacion = $this->guardarDocumento($cambio['archivo_cotizacion'], 'cotizacion');
            if ($cotizacion !== null) {
                $actualizacion['archivo_cotizacion_url'] = $cotizacion;
            }
        }

        if (isset($cambio['archivo_factura'])) {
            $facturaFile = $this->guardarDocumento($cambio['archivo_factura'], 'factura');
            if ($facturaFile !== null) {
                $actualizacion['archivo_factura_url'] = $facturaFile;
            }
        }

        if ($nuevo === 'Comprado') {
            $costoReal = (float) ($cambio['costo_real'] ?? 0);
            $factura   = trim((string) ($cambio['numero_factura'] ?? ''));
            if ($costoReal <= 0 || $factura === '') {
                throw new ValidacionException('Falta el costo real y el número de factura.', [
                    'costo_real'     => $costoReal <= 0 ? ['Captura el costo real facturado.'] : [],
                    'numero_factura' => $factura === '' ? ['Captura el número de factura.'] : [],
                ]);
            }
            $actualizacion['costo_real']     = $costoReal;
            $actualizacion['numero_factura'] = $factura;
        }

        $db = db_connect();
        $db->transStart();

        // WH-008: Automatic inventory stock reduction upon Compras approval/liberation
        if (($nuevo === 'Comprado' || $nuevo === 'Instalado') && !empty($req['pieza_catalogo_id']) && (int)$req['stock_descontado'] === 0) {
            $pieza = $db->table('catalogo_piezas')->where('id', (int)$req['pieza_catalogo_id'])->get()->getRowArray();
            if ($pieza !== null) {
                $db->table('catalogo_piezas')
                    ->where('id', $pieza['id'])
                    ->update(['stock_actual' => max(0, (int)$pieza['stock_actual'] - 1)]);
            }
            $actualizacion['stock_descontado'] = 1;
        }

        if ($nuevo === 'Instalado') {
            $actualizacion['fecha_instalacion'] = date('Y-m-d');
            // El costo efectivo suma al consolidado del tracto destino
            $costoEfectivo = $origen === 'Yonke'
                ? (float) $req['costo_estimado']
                : (float) $req['costo_real'];
            if (! empty($req['unidad_destino_id'])) {
                $this->consolidado->agregarRefaccion((int) $req['unidad_destino_id'], $costoEfectivo);
            }

            $this->requisiciones->update($id, $actualizacion);
            $this->auditoria->registrar($actor, 'requisicion.instalada', 'requisiciones', $id, [
                'estado' => $actual,
            ], [
                'estado'                => 'Instalado',
                'costo_applied'        => $costoEfectivo,
                'origen_costo_estimado' => $req['origen_costo_estimado'],
            ]);
        } else {
            $this->requisiciones->update($id, $actualizacion);
            $nuevoData = ['estado' => $nuevo];
            if ($justificacion !== null) {
                $nuevoData['justificacion'] = $justificacion;
            }
            $this->auditoria->registrar($actor, 'requisicion.estado', 'requisiciones', $id, [
                'estado' => $actual,
            ], $nuevoData);
        }

        $db->transComplete();

        $fila = $this->requisiciones->porId($id);

        return $fila ?? [];
    }

    /**
     * @param array<string, mixed> $datos
     * @param array<string, mixed> $actor
     *
     * @return array<string, mixed>
     */
    public function crear(array $datos, array $fotos, array $actor): array
    {
        $destinoId = null;
        if (! empty($datos['unidad_destino_id'])) {
            $destino = $this->unidades->porId((int) $datos['unidad_destino_id']);
            if ($destino === null) {
                throw new ValidacionException('Selecciona el tracto destino.', [
                    'unidad_destino_id' => ['Selecciona el tracto destino.'],
                ]);
            }
            $destinoId = (int) $destino['id'];
        }

        // TKT-WAR-105: Gatekeeper
        $otId = null;
        if (empty($datos['orden_trabajo_id'])) {
            throw new ValidacionException('Todas las requisiciones deben estar vinculadas a una Orden de Trabajo activa.', [
                'orden_trabajo_id' => ['Todas las requisiciones deben estar vinculadas a una Orden de Trabajo activa.'],
            ]);
        }
        if (!empty($datos['orden_trabajo_id'])) {
            $ot = db_connect()->table('ordenes_trabajo')->where('id', (int)$datos['orden_trabajo_id'])->get()->getRowArray();
            if ($ot === null) {
                throw new ValidacionException('Orden de trabajo no encontrada.', [
                    'orden_trabajo_id' => ['Orden de trabajo no encontrada.'],
                ]);
            }
            if ($ot['estado'] !== 'Activa') {
                throw new ValidacionException('La orden de trabajo asociada debe estar activa.', [
                    'orden_trabajo_id' => ['La orden de trabajo asociada debe estar activa.'],
                ]);
            }
            $otId = (int)$ot['id'];
        }

        $esYonke      = ($datos['origen'] ?? '') === 'Yonke';
        $esInventario = ($datos['origen'] ?? '') === 'Inventario';
        $donanteId    = null;
        $costo        = null;
        $origenCosto  = null;
        $piezaCatId   = null;
        $pieza        = null;

        if ($esInventario) {
            if (empty($datos['pieza_catalogo_id'])) {
                throw new ValidacionException('El origen Inventario exige seleccionar una pieza del catálogo.', [
                    'pieza_catalogo_id' => ['El origen Inventario exige seleccionar una pieza del catálogo.'],
                ]);
            }
            $pieza = db_connect()->table('catalogo_piezas')->where('id', (int) $datos['pieza_catalogo_id'])->get()->getRowArray();
            if ($pieza === null) {
                throw new ValidacionException('Artículo de catálogo inválido.', [
                    'pieza_catalogo_id' => ['Artículo de catálogo inválido.'],
                ]);
            }
            if ($pieza['stock_actual'] <= 0) {
                throw new ValidacionException('No hay stock disponible en almacén para este artículo.', [
                    'pieza_catalogo_id' => ['No hay stock disponible en almacén para este artículo.'],
                ]);
            }
            $piezaCatId = (int) $pieza['id'];
            $costo = (float) ($pieza['precio_referencia'] ?? 0);
            $origenCosto = 'catalogo';
        } else if ($esYonke) {
            if (empty($datos['unidad_donante_id'])) {
                throw new ValidacionException('El origen Yonke obliga a registrar la unidad donante.', [
                    'unidad_donante_id' => ['El origen Yonke obliga a registrar la unidad donante.'],
                ]);
            }
            $donante = $this->unidades->porId((int) $datos['unidad_donante_id']);
            if ($donante === null || $donante['estado'] !== 'Yonke') {
                throw new ConflictoException('La unidad donante no está en estado Yonke.');
            }
            $donanteId = (int) $donante['id'];

            // Priority: manual cost if specified by user, then cascaded automatic estimation
            if (!empty($datos['costo_estimado_manual'])) {
                $costo = (float) $datos['costo_estimado_manual'];
                $origenCosto = 'manual';
            } else {
                $numeroParte = isset($datos['numero_parte']) && $datos['numero_parte'] !== '' ? (string) $datos['numero_parte'] : null;
                $estimacion  = $this->valorizacion->estimar((string) $datos['descripcion_pieza'], $numeroParte);
                if ($estimacion !== null) {
                    $costo       = $estimacion['costo'];
                    $origenCosto = $estimacion['origen'];
                    $piezaCatId  = $estimacion['pieza_catalogo_id'];
                } else {
                    throw new ValidacionException('Asigna un costo estimado a la pieza donada, aunque no exista factura.', [
                        'costo_estimado_manual' => ['Asigna un costo estimado a la pieza donada, aunque no exista factura.'],
                    ]);
                }
            }
        }

        $nombreFoto = $this->guardarFotos($fotos);

        $db = db_connect();
        $db->transStart();

        $this->requisiciones->insert([
            'unidad_destino_id'     => $destinoId,
            'origen'                => $datos['origen'],
            'orden_trabajo_id'      => $otId,
            'origen_refaccion'      => isset($datos['origen_refaccion']) && $datos['origen_refaccion'] !== '' ? $datos['origen_refaccion'] : null,
            'almacen'               => isset($datos['almacen']) && $datos['almacen'] !== '' ? $datos['almacen'] : null,
            'numero_serie'          => isset($datos['numero_serie']) && $datos['numero_serie'] !== '' ? $datos['numero_serie'] : null,
            'unidad_donante_id'     => $donanteId,
            'pieza_catalogo_id'     => $piezaCatId,
            'descripcion_pieza'     => trim((string) $datos['descripcion_pieza']),
            'cantidad'              => empty($datos['cantidad']) ? 1 : (int) $datos['cantidad'],
            'numero_parte'          => isset($datos['numero_parte']) && $datos['numero_parte'] !== '' ? $datos['numero_parte'] : null,
            'foto_pieza_url'        => $nombreFoto,
            'urgencia'              => $datos['urgencia'] ?? 'Medio',
            'costo_estimado'        => $costo,
            'origen_costo_estimado' => $origenCosto,
            'costo_real'            => null,
            'stock_descontado'      => 0,
            'estado'                => 'Solicitado',
            'fecha_solicitud'       => date('Y-m-d'),
            'fecha_instalacion'     => null,
            'creado_por'            => (int) $actor['id'],
        ]);
        $id = (int) $this->requisiciones->getInsertID();

        // RF-INT-04: trazabilidad de la canibalización desde el nacimiento
        $this->auditoria->registrar($actor, 'requisicion.creada', 'requisiciones', $id, null, [
            'origen'                => $datos['origen'],
            'unidad_destino_id'     => $destinoId,
            'unidad_donante_id'     => $donanteId,
            'costo_estimado'        => $costo,
            'origen_costo_estimado' => $origenCosto,
        ]);

        // RF-REQ-06: la notificación va a cola; la respuesta no espera al envío
        service('queue')->push('notificaciones', 'notificar-compras', [
            'requisicion_id'    => $id,
            'descripcion_pieza' => trim((string) $datos['descripcion_pieza']),
            'urgencia'          => (string) ($datos['urgencia'] ?? 'Medio'),
        ]);

        $db->transComplete();

        $fila = $this->requisiciones->porId($id);

        return $fila ?? [];
    }

    private function guardarFotos(array $fotos): string
    {
        if (count($fotos) === 0) {
            throw new ValidacionException('La foto de la pieza o número de serie es obligatoria.', [
                'foto_pieza' => ['La foto de la pieza o número de serie es obligatoria.'],
            ]);
        }

        if (count($fotos) > 3) {
            throw new ValidacionException('No se permiten más de 3 fotografías.', [
                'foto_pieza' => ['No se permiten más de 3 fotografías por requisición.'],
            ]);
        }

        $nombres = [];
        foreach ($fotos as $foto) {
            $esSubidaLegitima = $foto !== null
                && $foto->getError() === UPLOAD_ERR_OK
                && (ENVIRONMENT === 'testing' ? is_file($foto->getTempName()) : is_uploaded_file($foto->getTempName()));

            if ($foto === null || ! $esSubidaLegitima) {
                throw new ValidacionException('La foto de la pieza o número de serie es obligatoria.', [
                    'foto_pieza' => ['La foto de la pieza o número de serie es obligatoria.'],
                ]);
            }

            $mime = mime_content_type($foto->getTempName());
            $ext  = strtolower($foto->getClientExtension());
            if (! in_array($mime, self::MIMES_FOTO, true) || ! in_array($ext, self::EXT_FOTO, true) || $foto->getSize() > self::MAX_BYTES) {
                throw new ValidacionException('Archivo de imagen inválido.', [
                    'foto_pieza' => ['Archivo de imagen inválido (JPEG/PNG/WebP, máx. 8 MB).'],
                ]);
            }

            $nombre  = bin2hex(random_bytes(16)) . '.' . ($ext === 'jpeg' ? 'jpg' : $ext);
            $destino = WRITEPATH . 'uploads/requisiciones';
            if (! is_dir($destino)) {
                mkdir($destino, 0750, true);
            }

            if (ENVIRONMENT === 'testing') {
                copy($foto->getTempName(), $destino . '/' . $nombre);
            } else {
                $foto->move($destino, $nombre);
            }
            $nombres[] = $nombre;
        }

        return implode(',', $nombres);
    }

    /**
     * Listado con policy anti-IDOR: taller solo ve lo que creó su usuario.
     *
     * @param array<string, mixed> $actor
     * @param array<string, mixed> $filtros
     *
     * @return list<array<string, mixed>>
     */
    public function listar(array $actor, array $filtros = []): array
    {
        $builder = db_connect()->table('requisiciones');

        if ($actor['rol'] === 'taller') {
            $builder->where('creado_por', (int) $actor['id']);
        }

        foreach (['estado', 'unidad_destino_id', 'unidad_donante_id'] as $filtro) {
            if (isset($filtros[$filtro]) && $filtros[$filtro] !== '') {
                $builder->where($filtro, $filtros[$filtro]);
            }
        }

        return Bd::filas($builder->orderBy('id', 'DESC'));
    }

    /**
     * Ruta absoluta de la foto, autorizada por rol/propiedad (anti-IDOR).
     *
     * @param array<string, mixed> $actor
     */
    public function rutaFotoAutorizada(int $requisicionId, array $actor, int $index = 0): string
    {
        $requisicion = $this->requisiciones->porId($requisicionId);
        if ($requisicion === null) {
            throw new NoEncontradoException('Requisición no encontrada.');
        }

        if ($actor['rol'] === 'taller' && (int) $requisicion['creado_por'] !== (int) $actor['id']) {
            throw new ProhibidoException('Sin permiso sobre esta requisición.');
        }

        $fotos = explode(',', (string) $requisicion['foto_pieza_url']);
        $fotoNombre = $fotos[$index] ?? null;

        if ($fotoNombre === null || $fotoNombre === '') {
            throw new NoEncontradoException('La foto solicitada no existe.');
        }

        $ruta = WRITEPATH . 'uploads/requisiciones/' . basename($fotoNombre);
        if (! is_file($ruta)) {
            throw new NoEncontradoException('La foto no está disponible.');
        }

        return $ruta;
    }

    private function guardarDocumento(?UploadedFile $file, string $prefix): ?string
    {
        if ($file === null || ! $file->isValid()) {
            return null;
        }

        $mime = mime_content_type($file->getTempName());
        $ext  = strtolower($file->getClientExtension());
        $validMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        $validExts  = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];

        if (! in_array($mime, $validMimes, true) || ! in_array($ext, $validExts, true) || $file->getSize() > self::MAX_BYTES) {
            throw new ValidacionException('Archivo de documento inválido.', [
                $prefix => ['Archivo de documento inválido (PDF/JPEG/PNG/WebP, máx. 8 MB).'],
            ]);
        }

        $nombre  = $prefix . '_' . bin2hex(random_bytes(16)) . '.' . $ext;
        $destino = WRITEPATH . 'uploads/requisiciones';
        if (! is_dir($destino)) {
            mkdir($destino, 0750, true);
        }

        if (ENVIRONMENT === 'testing') {
            copy($file->getTempName(), $destino . '/' . $nombre);
        } else {
            $file->move($destino, $nombre);
        }

        return $nombre;
    }

    public function eliminar(int $id, array $actor): void
    {
        $req = $this->requisiciones->porId($id);
        if ($req === null) {
            throw new NoEncontradoException('Requisición no encontrada.');
        }

        $db = db_connect();
        $db->transStart();

        if ($req['estado'] === 'Instalado') {
            $costoEfectivo = $req['origen'] === 'Yonke'
                ? (float) $req['costo_estimado']
                : (float) $req['costo_real'];
            if (! empty($req['unidad_destino_id'])) {
                $this->consolidado->agregarRefaccion((int) $req['unidad_destino_id'], -$costoEfectivo);
            }
        }

        // Clean up physically uploaded files (up to 3 photos + quote + invoice)
        $archivos = [];
        if (! empty($req['foto_pieza_url'])) {
            $archivos = array_merge($archivos, explode(',', $req['foto_pieza_url']));
        }
        if (! empty($req['archivo_cotizacion_url'])) {
            $archivos[] = $req['archivo_cotizacion_url'];
        }
        if (! empty($req['archivo_factura_url'])) {
            $archivos[] = $req['archivo_factura_url'];
        }

        foreach ($archivos as $archivo) {
            $ruta = WRITEPATH . 'uploads/requisiciones/' . basename($archivo);
            if (is_file($ruta)) {
                unlink($ruta);
            }
        }

        $this->requisiciones->delete($id);

        $this->auditoria->registrar($actor, 'requisicion.eliminada', 'requisiciones', $id, [
            'descripcion_pieza' => $req['descripcion_pieza'],
            'estado'            => $req['estado'],
        ], null);

        $db->transComplete();
    }

    /**
     * Reverts a quote/status transition to Solicitado or preceding status.
     * Records reversion user, date, time, motif and logs audit trail.
     *
     * @param int $id
     * @param string $motivo
     * @param array<string, mixed> $actor
     *
     * @return array<string, mixed>
     */
    public function revertirAceptacion(int $id, string $motivo, array $actor): array
    {
        $req = $this->requisiciones->porId($id);
        if ($req === null) {
            throw new NoEncontradoException('Requisición no encontrada.');
        }

        $estadoAnterior = (string) $req['estado'];

        $db = db_connect();
        $db->transStart();

        // 1. Insert into reversiones_cotizaciones
        $db->table('reversiones_cotizaciones')->insert([
            'requisicion_id' => $id,
            'revertido_por'  => (int) $actor['id'],
            'fecha_reversion' => date('Y-m-d H:i:s'),
            'motivo'         => $motivo,
            'estado_anterior' => $estadoAnterior,
        ]);

        // 2. Revert the requisicion state back to 'Solicitado'
        $actualizacion = [
            'estado' => 'Solicitado',
            'costo_real' => null,
            'numero_factura' => null,
            'fecha_instalacion' => null,
        ];
        $this->requisiciones->update($id, $actualizacion);

        // If it was already Installed, decrement the consolidado of the destination tracto
        if ($estadoAnterior === 'Instalado') {
            $costoEfectivo = $req['origen'] === 'Yonke'
                ? (float) $req['costo_estimado']
                : (float) $req['costo_real'];
            // Decrease the consolidado
            $this->consolidado->agregarRefaccion((int) $req['unidad_destino_id'], -$costoEfectivo);
        }

        // 3. Audit trail log
        $this->auditoria->registrar($actor, 'requisicion.reversion', 'requisiciones', $id, [
            'estado' => $estadoAnterior,
        ], [
            'estado' => 'Solicitado',
            'motivo' => $motivo,
        ]);

        $db->transComplete();

        return $this->requisiciones->porId($id) ?? [];
    }

    public function rutaDocumentoAutorizada(int $requisicionId, array $actor, string $tipo): string
    {
        $requisicion = $this->requisiciones->porId($requisicionId);
        if ($requisicion === null) {
            throw new NoEncontradoException('Requisición no encontrada.');
        }

        if ($actor['rol'] === 'taller' && (int) $requisicion['creado_por'] !== (int) $actor['id']) {
            throw new ProhibidoException('Sin permiso sobre esta requisición.');
        }

        $columna = $tipo === 'cotizacion' ? 'archivo_cotizacion_url' : 'archivo_factura_url';
        $nombreArchivo = $requisicion[$columna] ?? null;

        if ($nombreArchivo === null || $nombreArchivo === '') {
            throw new NoEncontradoException('El documento solicitado no existe.');
        }

        $ruta = WRITEPATH . 'uploads/requisiciones/' . basename($nombreArchivo);
        if (! is_file($ruta)) {
            throw new NoEncontradoException('El documento no está disponible.');
        }

        return $ruta;
    }
}
