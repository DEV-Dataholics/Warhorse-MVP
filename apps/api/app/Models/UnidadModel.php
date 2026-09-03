<?php

declare(strict_types=1);

namespace App\Models;

use App\Libraries\Bd;
use CodeIgniter\Model;
use App\Traits\Auditable;

/**
 * Catálogo maestro de unidades (doc 03) — fuente única de la flota.
 */
class UnidadModel extends Model
{
    use Auditable;

    protected $table         = 'unidades';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    
    protected $beforeUpdate = ['auditBeforeUpdate'];
    protected $afterInsert  = ['auditAfterInsert'];
    protected $afterUpdate  = ['auditAfterUpdate'];
    protected $afterDelete  = ['auditAfterDelete'];

    protected $allowedFields = ['id_unidad', 'tipo', 'operacion', 'estado', 'fecha_alta', 'valor_referencia', 'candidata_reincidencia', 'vencimiento_documentacion', 'vin', 'numero_economico', 'marca', 'modelo', 'placas', 'estado_salud'];
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

    /**
     * Listado con el consolidado adjunto (lectura O(1), doc 03 §5).
     *
     * @return array{data: list<array<string, mixed>>, total: int}
     */
    public function listar(?string $estado, int $pagina, int $porPagina): array
    {
        $builder = $this->db->table('unidades u')
            ->select('u.id, u.id_unidad, u.tipo, u.operacion, u.estado, u.fecha_alta, u.valor_referencia, u.candidata_reincidencia, u.vencimiento_documentacion, u.vin, u.numero_economico, u.marca, u.modelo, u.placas, COALESCE(c.costo_real_acumulado, 0) AS costo_real_acumulado')
            ->join('consolidado_unidad c', 'c.unidad_id = u.id', 'left');

        if ($estado !== null && $estado !== '') {
            $builder->where('u.estado', $estado);
        }

        $total = (int) $builder->countAllResults(false);
        $data  = Bd::filas(
            $builder->orderBy('u.id_unidad', 'ASC')->limit($porPagina, ($pagina - 1) * $porPagina),
        );

        return ['data' => $data, 'total' => $total];
    }
}
