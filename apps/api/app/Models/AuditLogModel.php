<?php

namespace App\Models;

use CodeIgniter\Model;

class AuditLogModel extends Model
{
    protected $table            = 'audit_logs';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'usuario_id', 'modulo', 'accion', 'registro_id', 'old_state', 'new_state', 'created_at'
    ];

    // Dates
    protected $useTimestamps = false; // We set it manually in Auditable
}
