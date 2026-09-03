<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;
use App\Traits\Auditable;

final class CatalogoPiezaModel extends Model
{
    use Auditable;

    protected $table            = 'catalogo_piezas';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    
    protected $beforeUpdate = ['auditBeforeUpdate'];
    protected $afterInsert  = ['auditAfterInsert'];
    protected $afterUpdate  = ['auditAfterUpdate'];
    protected $afterDelete  = ['auditAfterDelete'];

    protected $allowedFields    = [
        'nombre_normalizado',
        'categoria',
        'unidad_donante_id',
        'numero_parte',
        'precio_referencia',
        'stock_minimo',
        'stock_maximo',
        'stock_actual',
        'validar_limites',
    ];
    protected $useTimestamps    = true;
}
