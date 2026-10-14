<?php

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use App\Libraries\RespuestasApi;
use App\Models\DieselCargaExternaModel;
use App\Models\DieselDesgloseModel;
use CodeIgniter\HTTP\ResponseInterface;

class DieselExternoController extends BaseController
{
    public function index(): ResponseInterface
    {
        $model = new DieselCargaExternaModel();
        return $this->response->setJSON([
            'data' => $model->getCargasExternasConDesglose()
        ]);
    }

    public function createCarga(): ResponseInterface
    {
        $datos = (array) $this->request->getJSON(true);

        if (! $this->validateData($datos, [
            'fecha'          => 'required|valid_date[Y-m-d]',
            'litros_totales' => 'required|decimal|greater_than[0]',
            'costo_total'    => 'required|decimal|greater_than[0]',
        ])) {
            return RespuestasApi::error(422, 'validation', 'Datos incompletos', $this->validator->getErrors());
        }

        $model = new DieselCargaExternaModel();
        $id = $model->insert([
            'fecha'          => $datos['fecha'],
            'litros_totales' => $datos['litros_totales'],
            'costo_total'    => $datos['costo_total'],
            'creado_por'     => auth()->id(),
        ]);

        return $this->response->setJSON([
            'message' => 'Carga externa creada',
            'id' => $id
        ]);
    }

    public function createDesglose($cargaId): ResponseInterface
    {
        $datos = (array) $this->request->getJSON(true);

        if (! $this->validateData($datos, [
            'unidad_id'  => 'required|is_natural_no_zero',
            'litros'     => 'required|decimal|greater_than[0]',
            'folio_slip' => 'required|string|max_length[100]',
        ])) {
            return RespuestasApi::error(422, 'validation', 'Datos de desglose inválidos', $this->validator->getErrors());
        }

        $cargaModel = new DieselCargaExternaModel();
        $carga = $cargaModel->find($cargaId);
        
        if (!$carga) {
            return RespuestasApi::error(404, 'not_found', 'Carga externa no encontrada');
        }

        $desgloseModel = new DieselDesgloseModel();
        $desgloses = $desgloseModel->where('carga_externa_id', $cargaId)->findAll();
        
        $totalAsignado = array_sum(array_column($desgloses, 'litros'));
        if ($totalAsignado + $datos['litros'] > $carga['litros_totales']) {
            return RespuestasApi::error(422, 'validation', 'La suma del desglose supera el total disponible de la carga');
        }

        $desgloseId = $desgloseModel->insert([
            'carga_externa_id' => $cargaId,
            'unidad_id'        => $datos['unidad_id'],
            'folio_slip'       => trim((string) $datos['folio_slip']),
            'litros'           => $datos['litros'],
        ]);

        return $this->response->setJSON([
            'message' => 'Desglose asignado exitosamente',
            'id' => $desgloseId
        ]);
    }

    public function deleteDesglose($cargaId, $desgloseId): ResponseInterface
    {
        $desgloseModel = new DieselDesgloseModel();
        $desglose = $desgloseModel->find($desgloseId);
        
        if (!$desglose || $desglose['carga_externa_id'] != $cargaId) {
            return RespuestasApi::error(404, 'not_found', 'Desglose no encontrado');
        }

        $desgloseModel->delete($desgloseId);

        return $this->response->setJSON([
            'message' => 'Desglose eliminado'
        ]);
    }

    /**
     * Exporta el reporte de conciliación Samsara vs Combustible en formato CSV ejecutivo.
     * Permite mapear, ocultar o renombrar dinámicamente columnas según validación de negocio (TKT-WAR-165).
     */
    public function exportarConciliacion(): ResponseInterface
    {
        $payload = (array) $this->request->getJSON(true);
        $filas = $payload['filas'] ?? [];
        $columnasMapeo = $payload['columnas_mapeo'] ?? [
            'unidad'            => 'Unidad / Económico',
            'litros'            => 'Litros Dispensados (L)',
            'galones'           => 'Volumen (Gal)',
            'costo'             => 'Costo Total (MXN)',
            'distancia_km'      => 'Distancia Samsara (KM)',
            'distancia_mi'      => 'Distancia Samsara (MI)',
            'rendimiento_kml'   => 'Rendimiento (KM/L)',
            'rendimiento_mpg'   => 'Rendimiento (MPG)',
            'estado_operativo'  => 'Estatus Operativo',
        ];
        $soloAlertas = !empty($payload['solo_alertas']);

        // Filtrado por alerta roja (< 3.0 MPG / < 1.28 km/L)
        if ($soloAlertas) {
            $filas = array_values(array_filter($filas, function($r) {
                $mpg = isset($r['rendimiento_mpg']) ? (float)$r['rendimiento_mpg'] : ((float)($r['rendimiento'] ?? 0) * 2.35214);
                return $mpg < 3.0;
            }));
        }

        $output = fopen('php://temp', 'r+');
        fputs($output, "\xEF\xBB\xBF"); // UTF-8 BOM para compatibilidad total con Excel

        // Encabezados
        fputcsv($output, array_values($columnasMapeo));

        // Filas formateadas
        foreach ($filas as $fila) {
            $rowValues = [];
            foreach (array_keys($columnasMapeo) as $colKey) {
                $val = $fila[$colKey] ?? '';
                // Fallbacks derivados si vienen en métrico nativo
                if ($val === '') {
                    if ($colKey === 'galones' && isset($fila['litros'])) {
                        $val = round((float)$fila['litros'] / 3.78541, 2);
                    } elseif ($colKey === 'distancia_km' && isset($fila['distancia'])) {
                        $val = round((float)$fila['distancia'], 2);
                    } elseif ($colKey === 'distancia_mi' && isset($fila['distancia'])) {
                        $val = round((float)$fila['distancia'] / 1.60934, 2);
                    } elseif ($colKey === 'rendimiento_kml' && isset($fila['rendimiento'])) {
                        $val = round((float)$fila['rendimiento'], 2);
                    } elseif ($colKey === 'rendimiento_mpg' && isset($fila['rendimiento'])) {
                        $val = round((float)$fila['rendimiento'] * 2.35214, 2);
                    } elseif ($colKey === 'estado_operativo' && isset($fila['rendimiento'])) {
                        $mpg = (float)$fila['rendimiento'] * 2.35214;
                        $val = $mpg < 3.0 ? 'ALERTA ROJA (< 3.0 MPG)' : 'NORMAL';
                    }
                }
                $rowValues[] = $val;
            }
            fputcsv($output, $rowValues);
        }

        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        $filename = ($soloAlertas ? 'conciliacion_alertas_rojas_' : 'conciliacion_combustible_ejecutiva_') . date('Y-m-d') . '.csv';

        return $this->response
            ->setHeader('Content-Type', 'text/csv; charset=UTF-8')
            ->setHeader('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->setBody($csvContent);
    }
}
