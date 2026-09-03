<?php

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;

class ReportesController extends BaseController
{
    public function inventario(): ResponseInterface
    {
        $db = \Config\Database::connect();
        $builder = $db->table('catalogo_piezas cp')
            ->select('cp.id, cp.nombre_normalizado, cp.numero_parte, cp.categoria, cp.precio_referencia, cp.stock_actual, cp.stock_minimo, u.id_unidad as unidad_donante')
            ->join('unidades u', 'u.id = cp.unidad_donante_id', 'left');
            
        return $this->response->setJSON($builder->get()->getResultArray());
    }

    public function comprasOt(): ResponseInterface
    {
        $db = \Config\Database::connect();
        // Compras ligadas a OTs (excluye caja chica)
        $builder = $db->table('requisiciones r')
            ->select('r.id, ot.folio as orden_trabajo, u.id_unidad as destino, r.descripcion_pieza, r.cantidad, r.estado, r.costo_estimado, r.costo_real, r.fecha_solicitud, r.proveedor, r.es_caja_chica')
            ->join('ordenes_trabajo ot', 'ot.id = r.orden_trabajo_id', 'left')
            ->join('unidades u', 'u.id = r.unidad_destino_id', 'left')
            ->where('r.es_caja_chica', 0)
            ->where('r.orden_trabajo_id IS NOT NULL');
            
        return $this->response->setJSON($builder->get()->getResultArray());
    }

    public function saludFlota(): ResponseInterface
    {
        $db = \Config\Database::connect();
        $builder = $db->table('unidades')
            ->select('id_unidad, tipo, operacion, estado_salud, es_modificada');
            
        return $this->response->setJSON($builder->get()->getResultArray());
    }

    public function inspecciones(): ResponseInterface
    {
        $db = \Config\Database::connect();
        $builder = $db->table('inspecciones_patio ip')
            ->select('ip.id, o.nombre as operador, u.id_unidad as unidad, ip.tiene_anomalias, ip.estado_revision, ip.created_at')
            ->join('operadores o', 'o.id = ip.operador_id', 'left')
            ->join('unidades u', 'u.id = ip.unidad_id', 'left')
            ->orderBy('ip.created_at', 'DESC');
            
        return $this->response->setJSON($builder->get()->getResultArray());
    }
}
