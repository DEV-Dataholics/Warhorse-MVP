<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAuditLogs extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => ['type' => 'BIGINT', 'unsigned' => true, 'auto_increment' => true],
            'usuario_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true], // Nullable por si es system
            'modulo' => ['type' => 'VARCHAR', 'constraint' => 100],
            'accion' => ['type' => 'VARCHAR', 'constraint' => 50],
            'registro_id' => ['type' => 'INT', 'unsigned' => true],
            'old_state' => ['type' => 'JSON', 'null' => true],
            'new_state' => ['type' => 'JSON', 'null' => true],
            'created_at' => ['type' => 'DATETIME'],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey('usuario_id');
        $this->forge->addKey('modulo');
        $this->forge->addKey('registro_id');
        $this->forge->createTable('audit_logs', true);
    }

    public function down()
    {
        $this->forge->dropTable('audit_logs', true);
    }
}
