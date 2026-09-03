<?php

namespace App\Models;

use CodeIgniter\Model;

class OperadorModel extends Model
{
    protected $table            = 'operadores';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'numero_empleado',
        'nombre',
        'licencia',
        'tipo_operacion',
        'unidad_asignada_id',
        'activo'
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
        'numero_empleado'    => 'required|is_unique[operadores.numero_empleado,id,{id}]',
        'nombre'             => 'required',
        'tipo_operacion'     => 'in_list[cruce foráneo,local,backup]',
        'unidad_asignada_id' => 'permit_empty|is_natural_no_zero'
    ];
    protected $validationMessages   = [];
    protected $skipValidation       = false;
    protected $cleanValidationRules = true;
}
