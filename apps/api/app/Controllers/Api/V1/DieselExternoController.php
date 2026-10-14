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
}
