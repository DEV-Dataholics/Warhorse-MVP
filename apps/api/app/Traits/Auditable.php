<?php

declare(strict_types=1);

namespace App\Traits;

use App\Libraries\ActorActual;

trait Auditable
{
    protected function auditBeforeUpdate(array $data): array
    {
        return $data;
    }

    protected function auditAfterInsert(array $data): array
    {
        try {
            $actor = ActorActual::usuario();
            $actorId = (int) ($actor['id'] ?? 1);
            $id = $data['id'] ?? 0;
            if (is_array($id)) {
                $id = $id[0] ?? 0;
            }

            db_connect()->table('auditoria')->insert([
                'actor_id'       => $actorId,
                'accion'         => 'crear',
                'entidad'        => $this->table ?? 'desconocido',
                'entidad_id'     => (int) $id,
                'valor_anterior' => null,
                'valor_nuevo'    => json_encode($data['data'] ?? [], JSON_UNESCAPED_UNICODE),
            ]);
        } catch (\Throwable $e) {
            // No romper la transacción principal si falla auditoría automática
            log_message('error', 'Fallo en auditAfterInsert: ' . $e->getMessage());
        }

        return $data;
    }

    protected function auditAfterUpdate(array $data): array
    {
        try {
            $actor = ActorActual::usuario();
            $actorId = (int) ($actor['id'] ?? 1);
            $id = $data['id'] ?? 0;
            if (is_array($id)) {
                $id = $id[0] ?? 0;
            }

            db_connect()->table('auditoria')->insert([
                'actor_id'       => $actorId,
                'accion'         => 'actualizar',
                'entidad'        => $this->table ?? 'desconocido',
                'entidad_id'     => (int) $id,
                'valor_anterior' => null,
                'valor_nuevo'    => json_encode($data['data'] ?? [], JSON_UNESCAPED_UNICODE),
            ]);
        } catch (\Throwable $e) {
            log_message('error', 'Fallo en auditAfterUpdate: ' . $e->getMessage());
        }

        return $data;
    }

    protected function auditAfterDelete(array $data): array
    {
        try {
            $actor = ActorActual::usuario();
            $actorId = (int) ($actor['id'] ?? 1);
            $id = $data['id'] ?? 0;
            if (is_array($id)) {
                $id = $id[0] ?? 0;
            }

            db_connect()->table('auditoria')->insert([
                'actor_id'       => $actorId,
                'accion'         => 'eliminar',
                'entidad'        => $this->table ?? 'desconocido',
                'entidad_id'     => (int) $id,
                'valor_anterior' => null,
                'valor_nuevo'    => null,
            ]);
        } catch (\Throwable $e) {
            log_message('error', 'Fallo en auditAfterDelete: ' . $e->getMessage());
        }

        return $data;
    }
}
