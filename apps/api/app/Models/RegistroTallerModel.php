<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;
use App\Traits\Auditable;

/**
 * Ingresos y liberaciones de taller (doc 03).
 */
class RegistroTallerModel extends Model
{
    use Auditable;

    protected $table         = 'registros_taller';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    
    protected $beforeUpdate = ['auditBeforeUpdate'];
    protected $afterInsert  = ['auditAfterInsert'];
    protected $afterUpdate  = ['auditAfterUpdate'];
    protected $afterDelete  = ['auditAfterDelete'];

    protected $allowedFields = [
        'unidad_id', 'fecha_ingreso', 'fecha_salida', 'diagnostico', 'criticidad',
        'costo_taller', 'tipo_liberacion', 'pendientes', 'es_reincidencia', 'registrado_por', 'clasificacion_reparacion', 'estado_ot'
    ];
    protected $useTimestamps = true;

    /**
     * @return array<string, mixed>|null
     */
    public function porId(int $id): ?array
    {
        /** @var array<string, mixed>|null $fila */
        $fila = $this->find($id);

        return $fila;
    }
}
