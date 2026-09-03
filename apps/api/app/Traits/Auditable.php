<?php

namespace App\Traits;

use App\Libraries\ActorActual;
use App\Models\AuditLogModel;
use CodeIgniter\I18n\Time;

/**
 * Trait Auditable
 * Hookeable en los Modelos de CI4.
 * Requiere que el modelo que lo usa aÃ±ada estos mÃ©todos a sus callbacks:
 * protected $beforeUpdate = ['auditBeforeUpdate'];
 * protected $afterInsert  = ['auditAfterInsert'];
 * protected $afterUpdate  = ['auditAfterUpdate'];
 * protected $afterDelete  = ['auditAfterDelete'];
 */
trait Auditable
{
    // Usamos esta variable de clase estÃ¡tica o de instancia para guardar el estado previo
    // En CI4 los callbacks recogen el estado.
    protected $tempOldState = [];

    protected function getUserId()
    {
        // Obtener del JWT si estÃ¡ seteado en la app (ActorActual)
        // En nuestro sistema, ActorActual guarda la info estÃ¡ticamente
        return ActorActual::id() ?? null;
    }

    public function auditBeforeUpdate(array $data)
    {
        // En update, CI4 pasa $data['id'] si lo tiene (depende de cÃ³mo se llame el update)
        // O $data['id'] puede venir de $data['id'][0]
        if (isset($data['id'])) {
            $id = is_array($data['id']) ? $data['id'][0] : $data['id'];
            $old = $this->db->table($this->table)->where($this->primaryKey, $id)->get()->getRowArray();
            if ($old) {
                $this->tempOldState[$id] = $old;
            }
        }
        return $data;
    }

    public function auditAfterInsert(array $data)
    {
        if ($data['result']) {
            $this->logAction('CREATE', $data['id'], null, $data['data']);
        }
        return $data;
    }

    public function auditAfterUpdate(array $data)
    {
        if ($data['result'] && isset($data['id'])) {
            $id = is_array($data['id']) ? $data['id'][0] : $data['id'];
            $old = $this->tempOldState[$id] ?? null;
            // Quitamos de temporal
            if(isset($this->tempOldState[$id])) {
                unset($this->tempOldState[$id]);
            }
            $this->logAction('UPDATE', $id, $old, $data['data']);
        }
        return $data;
    }

    public function auditAfterDelete(array $data)
    {
        if ($data['result'] && isset($data['id'])) {
            $id = is_array($data['id']) ? $data['id'][0] : $data['id'];
            $this->logAction('DELETE', $id, null, null);
        }
        return $data;
    }

    private function logAction(string $action, $recordId, $oldState, $newState)
    {
        $audit = new AuditLogModel();
        
        $audit->insert([
            'usuario_id' => $this->getUserId(),
            'modulo'      => $this->table,
            'accion'      => $action,
            'registro_id' => $recordId,
            'old_state'   => $oldState ? json_encode($oldState) : null,
            'new_state'   => $newState ? json_encode($newState) : null,
            'created_at'  => Time::now()->toDateTimeString(),
        ]);
    }
}
