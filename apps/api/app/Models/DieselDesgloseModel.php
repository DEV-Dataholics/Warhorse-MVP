<?php

namespace App\Models;

use CodeIgniter\Model;

class DieselDesgloseModel extends Model
{
    protected $table            = 'diesel_desgloses';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'carga_externa_id',
        'unidad_id',
        'folio_slip',
        'litros',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = '';

    public function getDesglosesPorCarga(int $cargaId)
    {
        return $this->select('diesel_desgloses.id, diesel_desgloses.unidad_id, diesel_desgloses.folio_slip, diesel_desgloses.litros, unidades.id_unidad as unidad_nombre')
            ->join('unidades', 'unidades.id = diesel_desgloses.unidad_id')
            ->where('carga_externa_id', $cargaId)
            ->findAll();
    }
}
