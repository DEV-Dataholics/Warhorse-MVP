<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use App\Libraries\RespuestasApi;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\ResponseInterface;

final class OrdenesTrabajoController extends BaseController
{
    public function listar(): ResponseInterface
    {
        $db = \Config\Database::connect();
        $builder = $db->table('ordenes_trabajo ot')
            ->select('ot.id, ot.folio, ot.categoria, ot.estado, ot.diagnostico, ot.materiales, ot.archivos_evidencia, ot.created_at, u.id as u_id, u.id_unidad, u.tipo as unidad_tipo, r.nombre as responsable_nombre, r.rol as responsable_rol')
            ->join('unidades u', 'u.id = ot.unidad_id')
            ->join('responsables_taller r', 'r.id = ot.responsable_id')
            ->orderBy('ot.id', 'DESC');

        $filas = $builder->get()->getResultArray();
        $data = [];

        foreach ($filas as $f) {
            $otId = (int)$f['id'];
            
            // Sum of cost of purchased/installed requisitions linked to this OT
            $costoRequisiciones = $db->table('requisiciones')
                ->selectSum('costo_real')
                ->where('orden_trabajo_id', $otId)
                ->whereIn('estado', ['Comprado', 'Instalado'])
                ->get()->getRowArray()['costo_real'] ?? 0.0;

            $materiales = json_decode((string) ($f['materiales'] ?? '[]'), true);
            $costoMaterialesLocal = 0.0;
            foreach ($materiales as $mat) {
                $costoMaterialesLocal += (float) ($mat['costo_total'] ?? 0);
            }
            $costoTotal = (float) $costoRequisiciones + $costoMaterialesLocal;

            $data[] = [
                'id'                 => $otId,
                'folio'              => $f['folio'] ?? 'OT-' . str_pad((string)$otId, 5, '0', STR_PAD_LEFT),
                'categoria'          => (string) $f['categoria'],
                'estado'             => (string) $f['estado'],
                'diagnostico'        => (string) $f['diagnostico'],
                'materiales'         => $materiales,
                'archivos_evidencia' => json_decode((string) ($f['archivos_evidencia'] ?? '[]'), true),
                'created_at'         => (string) $f['created_at'],
                'costo_total'        => $costoTotal,
                'unidad' => [
                    'id'        => (int) $f['u_id'],
                    'id_unidad' => (string) $f['id_unidad'],
                    'tipo'      => (string) $f['unidad_tipo'],
                ],
                'responsable' => [
                    'nombre' => (string) $f['responsable_nombre'],
                    'rol'    => (string) $f['responsable_rol'],
                ],
            ];
        }

        return $this->response->setJSON([
            'data' => $data,
        ]);
    }

    public function crear(): ResponseInterface
    {
        $request = $this->request;
        $datos   = $request instanceof IncomingRequest ? (array) $request->getJSON(true) : [];

        if (! $this->validateData($datos, [
            'unidad_id'          => 'required|is_natural_no_zero',
            'responsable_id'     => 'required|is_natural_no_zero',
            'categoria'          => 'required|in_list[Preventivo,Correctivo,Mantenimiento]',
            'diagnostico'        => 'required|min_length[5]',
            'materiales'         => 'permit_empty',
            'archivos_evidencia' => 'permit_empty',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];
            return RespuestasApi::error(422, 'validation', 'Datos de orden de trabajo inválidos.', array_map(static fn (string $e): array => [$e], $errores));
        }

        $db = \Config\Database::connect();
        
        // Verify unit
        $unidad = $db->table('unidades')->where('id', $datos['unidad_id'])->get()->getRowArray();
        if ($unidad === null) {
            return RespuestasApi::error(404, 'not_found', 'Unidad no encontrada.');
        }

        // Verify responsible
        $resp = $db->table('responsables_taller')->where('id', $datos['responsable_id'])->get()->getRowArray();
        if ($resp === null) {
            return RespuestasApi::error(404, 'not_found', 'Responsable de taller no encontrado.');
        }

        // TKT-WAR-104: Anti-duplicidad de OTs
        $otAbiertaOPausada = $db->table('ordenes_trabajo')
            ->where('unidad_id', $datos['unidad_id'])
            ->whereIn('estado', ['Activa', 'Pausada'])
            ->get()->getRowArray();
            
        if ($otAbiertaOPausada) {
            return RespuestasApi::error(409, 'conflict', 'Esta unidad ya tiene una OT ' . $otAbiertaOPausada['estado'] . '. Debe reactivarla o cerrarla.');
        }

        $materiales = isset($datos['materiales']) ? json_encode($datos['materiales']) : '[]';
        $evidencias = isset($datos['archivos_evidencia']) ? json_encode($datos['archivos_evidencia']) : '[]';

        $db->transStart();

        // TKT-WAR-103: Update Unit Health
        $db->table('unidades')->where('id', $datos['unidad_id'])->update([
            'estado_salud' => 'Inactivo en reparación'
        ]);

        $db->table('ordenes_trabajo')->insert([
            'unidad_id'          => (int) $datos['unidad_id'],
            'responsable_id'     => (int) $datos['responsable_id'],
            'categoria'          => $datos['categoria'],
            'diagnostico'        => trim((string) $datos['diagnostico']),
            'materiales'         => $materiales,
            'archivos_evidencia' => $evidencias,
            'estado'             => 'Activa',
        ]);

        $otId = $db->insertID();
        $folio = 'OT-' . str_pad((string)$otId, 5, '0', STR_PAD_LEFT);

        $db->table('ordenes_trabajo')->where('id', $otId)->update([
            'folio' => $folio,
        ]);

        $db->transComplete();

        return $this->response->setStatusCode(201)->setJSON([
            'id'      => $otId,
            'folio'   => $folio,
            'message' => 'Orden de trabajo creada exitosamente.',
        ]);
    }


    // TKT-WAR-103 & TKT-WAR-104: Liberación y State Machine
    public function liberar(int $id): ResponseInterface
    {
        $request = $this->request;
        $datos   = $request instanceof \CodeIgniter\HTTP\IncomingRequest ? (array) $request->getJSON(true) : [];
        
        $tipoLiberacion = $datos['tipo'] ?? 'Total'; // 'Total' o 'Parcial'
        
        $db = \Config\Database::connect();
        $ot = $db->table('ordenes_trabajo')->where('id', $id)->get()->getRowArray();
        
        if (!$ot) return RespuestasApi::error(404, 'not_found', 'OT no encontrada.');
        if ($ot['estado'] === 'Cerrada') return RespuestasApi::error(409, 'conflict', 'La OT ya está cerrada.');
        
        $db->transStart();
        
        if ($tipoLiberacion === 'Parcial') {
            $db->table('ordenes_trabajo')->where('id', $id)->update(['estado' => 'Pausada']);
            $db->table('unidades')->where('id', $ot['unidad_id'])->update(['estado_salud' => 'Activo con Warning']);
        } else {
            $db->table('ordenes_trabajo')->where('id', $id)->update(['estado' => 'Cerrada']);
            $db->table('unidades')->where('id', $ot['unidad_id'])->update(['estado_salud' => 'Activo 100%']);
        }
        
        $db->transComplete();
        
        return $this->response->setJSON(['mensaje' => 'OT liberada (' . $tipoLiberacion . ') exitosamente.']);
    }

    public function tomarInventario(int $id): ResponseInterface
    {
        $request = $this->request;
        $datos   = $request instanceof IncomingRequest ? (array) $request->getJSON(true) : [];

        if (! $this->validateData($datos, [
            'articulo_id' => 'required|is_natural_no_zero',
            'cantidad'    => 'required|is_natural_no_zero',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];
            return RespuestasApi::error(422, 'validation', 'Datos de inventario inválidos.', array_map(static fn (string $e): array => [$e], $errores));
        }

        $db = \Config\Database::connect();
        
        // Find OT
        $ot = $db->table('ordenes_trabajo')->where('id', $id)->get()->getRowArray();
        if ($ot === null) {
            return RespuestasApi::error(404, 'not_found', 'Orden de trabajo no encontrada.');
        }
        if ($ot['estado'] !== 'Activa') {
            return RespuestasApi::error(409, 'conflict', 'La orden de trabajo no está activa.');
        }

        // Find Catalog piece
        $articulo = $db->table('catalogo_piezas')->where('id', $datos['articulo_id'])->get()->getRowArray();
        if ($articulo === null) {
            return RespuestasApi::error(404, 'not_found', 'Artículo de catálogo no encontrado.');
        }

        $cantidad = (int) $datos['cantidad'];
        if ((int)$articulo['stock_actual'] < $cantidad) {
            return RespuestasApi::error(409, 'conflict', 'Stock insuficiente en almacén.');
        }

        $db->transStart();

        // 1. Decrement stock in catalog
        $db->table('catalogo_piezas')
            ->where('id', $articulo['id'])
            ->update(['stock_actual' => (int)$articulo['stock_actual'] - $cantidad]);

        // 2. Add to materiales list of OT
        $materiales = json_decode((string) ($ot['materiales'] ?? '[]'), true);
        $costoUnitario = (float) ($articulo['precio_referencia'] ?? 0);
        $costoTotalItem = $costoUnitario * $cantidad;

        $materiales[] = [
            'pieza_id'       => (int) $articulo['id'],
            'nombre'         => (string) $articulo['nombre_normalizado'],
            'numero_parte'   => (string) $articulo['numero_parte'],
            'cantidad'       => $cantidad,
            'costo_unitario' => $costoUnitario,
            'costo_total'    => $costoTotalItem,
            'origen'         => 'Local Stock',
            'fecha'          => date('Y-m-d H:i:s'),
        ];

        $db->table('ordenes_trabajo')->where('id', $id)->update([
            'materiales' => json_encode($materiales),
        ]);

        // 3. Add expense to unit consolidado
        $consolidado = new \App\Services\ConsolidadoService();
        $consolidado->agregarRefaccion((int) $ot['unidad_id'], $costoTotalItem);

        $db->transComplete();

        return $this->response->setJSON([
            'message' => 'Material tomado del inventario y cargado a la OT exitosamente.',
            'materiales' => $materiales,
        ]);
    }

    public function responsables(): ResponseInterface
    {
        $db = \Config\Database::connect();
        $filas = $db->table('responsables_taller')->orderBy('nombre', 'ASC')->get()->getResultArray();

        return $this->response->setJSON([
            'data' => array_map(static fn (array $f): array => [
                'id'     => (int) $f['id'],
                'nombre' => (string) $f['nombre'],
                'rol'    => (string) $f['rol'],
            ], $filas),
        ]);
    }

    public function crearResponsable(): ResponseInterface
    {
        $request = $this->request;
        $datos   = $request instanceof IncomingRequest ? (array) $request->getJSON(true) : [];

                if (! $this->validateData($datos, [
            'nombre' => 'required|min_length[3]|max_length[120]',
            'tipo'   => 'required|in_list[Tracto,Caja]',
            'rol'    => 'required|in_list[Mecánico A,Mecánico B,Auxiliar,Termoquineros]',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];
            return RespuestasApi::error(422, 'validation', 'Datos de responsable inválidos.', array_map(static fn (string $e): array => [$e], $errores));
        }

        $db = \Config\Database::connect();
        $db->table('responsables_taller')->insert([
            'nombre' => trim((string) $datos['nombre']),
            'rol'    => $datos['rol'],
        ]);

        return $this->response->setStatusCode(201)->setJSON([
            'id' => $db->insertID(),
            'message' => 'Responsable creado exitosamente.',
        ]);
    }
}
