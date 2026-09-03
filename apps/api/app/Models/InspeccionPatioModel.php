<?php

namespace App\Models;

use CodeIgniter\Model;

class InspeccionPatioModel extends Model
{
    protected $table            = 'inspecciones_patio';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'operador_id',
        'unidad_id',
        'kilometraje',
        'nivel_combustible',
        'tiene_anomalias',
        'datos_json',
        'estado_revision'
    ];

    protected bool $allowEmptyInserts = false;

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    // Validation
    protected $validationRules      = [
        'operador_id'       => 'required|is_natural_no_zero',
        'unidad_id'         => 'required|is_natural_no_zero',
        'kilometraje'       => 'permit_empty|is_natural',
        'nivel_combustible' => 'permit_empty|is_natural',
        'tiene_anomalias'   => 'in_list[0,1,true,false]',
        'estado_revision'   => 'in_list[pendiente,revisado,ignorada]',
    ];
    protected $validationMessages   = [];
    protected $skipValidation       = false;
    protected $cleanValidationRules = true;
}
