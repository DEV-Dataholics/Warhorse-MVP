<?php

namespace App\Controllers\Api\V1;

use CodeIgniter\RESTful\ResourceController;
use App\Models\OperadorModel;
use App\Models\InspeccionPatioModel;
use App\Models\UnidadModel;

class OperadoresController extends ResourceController
{
    protected $format = 'json';

    public function auth()
    {
        $numeroEmpleado = $this->request->getVar('numero_empleado');
        if (!$numeroEmpleado) {
            return $this->fail('Número de empleado requerido', 400);
        }

        $operadorModel = new OperadorModel();
        $operador = $operadorModel->where('numero_empleado', $numeroEmpleado)
                                  ->where('activo', 1)
                                  ->first();
        if (!$operador) {
            return $this->failNotFound('Operador no encontrado o inactivo');
        }

        // Si tiene unidad asignada, traemos la info
        $unidad = null;
        if ($operador['unidad_asignada_id']) {
            $unidadModel = new UnidadModel();
            $unidad = $unidadModel->find($operador['unidad_asignada_id']);
        }

        // En un escenario real podríamos devolver un JWT específico para el operador.
        // Para este requerimiento, validaremos en Frontend almacenando la sesión local (tipo token simple o state).
        return $this->respond([
            'token' => base64_encode('op_' . $operador['id'] . '_' . time()), // Fake token para sesión local
            'operador' => [
                'id' => $operador['id'],
                'numero_empleado' => $operador['numero_empleado'],
                'nombre' => $operador['nombre'],
                'licencia' => $operador['licencia'],
                'tipo_operacion' => $operador['tipo_operacion'],
                'unidad' => $unidad ? [
                    'id' => $unidad['id'],
                    'numero_economico' => $unidad['numero_economico'],
                    'placas' => $unidad['placas'],
                    'tipo' => $unidad['tipo']
                ] : null
            ]
        ]);
    }

    public function crearInspeccion()
    {
        // En una app real, verificaríamos el Bearer token del operador.
        $operadorId = $this->request->getVar('operador_id');
        $unidadId = $this->request->getVar('unidad_id');
        
        $rules = [
            'operador_id' => 'required|is_natural_no_zero',
            'unidad_id'   => 'required|is_natural_no_zero',
            'datos_json'  => 'required'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $tieneAnomalias = $this->request->getVar('tiene_anomalias') === 'true' || $this->request->getVar('tiene_anomalias') === true || $this->request->getVar('tiene_anomalias') === 1;

        $inspeccionModel = new InspeccionPatioModel();
        $data = [
            'operador_id' => $operadorId,
            'unidad_id' => $unidadId,
            'kilometraje' => $this->request->getVar('kilometraje'),
            'nivel_combustible' => $this->request->getVar('nivel_combustible'),
            'tiene_anomalias' => $tieneAnomalias ? 1 : 0,
            'datos_json' => is_string($this->request->getVar('datos_json')) ? $this->request->getVar('datos_json') : json_encode($this->request->getVar('datos_json')),
            'estado_revision' => 'pendiente'
        ];

        $inspeccionId = $inspeccionModel->insert($data);

        // Webhook / Notificación a Taller
        if ($tieneAnomalias) {
            // Se registraría en una tabla de notificaciones o se dispararía SSE.
            // Para fines de [TKT-WAR-101], podemos simplemente dejar el registro para que 
            // el dashboard de Taller consulte las "inspecciones entrantes con anomalías".
        }

        return $this->respondCreated(['id' => $inspeccionId, 'mensaje' => 'Inspección registrada con éxito']);
    }
    
    // Endpoint para el Dashboard de Taller (Inspecciones con anomalías)
    public function entrantes()
    {
        $db = \Config\Database::connect();
        $builder = $db->table('inspecciones_patio');
        $builder->select('inspecciones_patio.*, unidades.numero_economico as unidad, operadores.nombre as operador_nombre');
        $builder->join('unidades', 'unidades.id = inspecciones_patio.unidad_id');
        $builder->join('operadores', 'operadores.id = inspecciones_patio.operador_id');
        $builder->where('tiene_anomalias', 1);
        $builder->where('estado_revision', 'pendiente');
        $builder->orderBy('created_at', 'DESC');
        
        $entrantes = $builder->get()->getResultArray();
        
        foreach($entrantes as &$h) {
            $h['datos_json'] = json_decode($h['datos_json'], true);
        }
        
        return $this->respond($entrantes);
    }
    
    // Método para consultar historial del operador
    public function historial($operadorId)
    {
        $inspeccionModel = new InspeccionPatioModel();
        
        $db = \Config\Database::connect();
        $builder = $db->table('inspecciones_patio');
        $builder->select('inspecciones_patio.*, unidades.numero_economico as unidad');
        $builder->join('unidades', 'unidades.id = inspecciones_patio.unidad_id');
        $builder->where('operador_id', $operadorId);
        $builder->orderBy('created_at', 'DESC');
        $builder->limit(10); // Historial reciente
        
        $historial = $builder->get()->getResultArray();
        
        // Decodificar JSON
        foreach($historial as &$h) {
            $h['datos_json'] = json_decode($h['datos_json'], true);
        }
        
        return $this->respond($historial);
    }
}
