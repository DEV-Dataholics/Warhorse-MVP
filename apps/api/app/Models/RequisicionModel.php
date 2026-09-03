<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;
use App\Traits\Auditable;

/**
 * Requisiciones de refacciones (doc 03) — la entidad más rica en reglas.
 */
class RequisicionModel extends Model
{
    use Auditable;

    protected $table         = 'requisiciones';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    
    protected $beforeUpdate = ['auditBeforeUpdate'];
    protected $afterInsert  = ['auditAfterInsert'];
    protected $afterUpdate  = ['auditAfterUpdate'];
    protected $afterDelete  = ['auditAfterDelete'];

    protected $allowedFields = [
        'unidad_destino_id', 'origen', 'orden_trabajo_id', 'origen_refaccion', 'almacen', 'numero_serie', 'unidad_donante_id', 'pieza_catalogo_id',
        'descripcion_pieza', 'numero_parte', 'foto_pieza_url', 'urgencia',
        'costo_estimado', 'origen_costo_estimado', 'costo_real', 'numero_factura', 'proveedor', 'es_caja_chica', 'factura_xml',
        'estado', 'fecha_solicitud', 'fecha_instalacion', 'creado_por',
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
