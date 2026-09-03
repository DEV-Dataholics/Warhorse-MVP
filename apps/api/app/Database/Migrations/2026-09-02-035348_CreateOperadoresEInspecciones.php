<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateOperadoresEInspecciones extends Migration
{
    public function up()
    {
        // 1. Tabla operadores
        $this->forge->addField([
            'id' => [
                'type'           => 'BIGINT',
                'constraint'     => 20,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'numero_empleado' => [
                'type'       => 'VARCHAR',
                'constraint' => '50',
                'unique'     => true,
            ],
            'nombre' => [
                'type'       => 'VARCHAR',
                'constraint' => '120',
            ],
            'licencia' => [
                'type'       => 'VARCHAR',
                'constraint' => '50',
                'null'       => true,
            ],
            'tipo_operacion' => [
                'type'       => 'ENUM',
                'constraint' => ['cruce foráneo', 'local', 'backup'],
                'default'    => 'local',
            ],
            'unidad_asignada_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
                'null'       => true,
            ],
            'activo' => [
                'type'       => 'BOOLEAN',
                'default'    => 1,
            ],
            'created_at' => [
                'type' => 'DATETIME',
            ],
            'updated_at' => [
                'type' => 'DATETIME',
            ],
            'deleted_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('unidad_asignada_id', 'unidades', 'id', 'SET NULL', 'RESTRICT');
        $this->forge->createTable('operadores');

        // 2. Tabla inspecciones_patio
        $this->forge->addField([
            'id' => [
                'type'           => 'BIGINT',
                'constraint'     => 20,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'operador_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
            ],
            'unidad_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
            ],
            'kilometraje' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
                'null'       => true,
            ],
            'nivel_combustible' => [
                'type'       => 'INT', // Porcentaje 0-100
                'constraint' => 3,
                'unsigned'   => true,
                'null'       => true,
            ],
            'tiene_anomalias' => [
                'type'       => 'BOOLEAN',
                'default'    => 0,
            ],
            'datos_json' => [
                'type'       => 'JSON', // Respuestas del checklist
                'null'       => true,
            ],
            'estado_revision' => [ // Para el webhook y Taller
                'type'       => 'ENUM',
                'constraint' => ['pendiente', 'revisado', 'ignorada'],
                'default'    => 'pendiente',
            ],
            'created_at' => [
                'type' => 'DATETIME',
            ],
            'updated_at' => [
                'type' => 'DATETIME',
            ],
            'deleted_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('operador_id', 'operadores', 'id', 'RESTRICT', 'RESTRICT');
        $this->forge->addForeignKey('unidad_id', 'unidades', 'id', 'RESTRICT', 'RESTRICT');
        $this->forge->createTable('inspecciones_patio');
    }

    public function down()
    {
        $this->forge->dropTable('inspecciones_patio', true);
        $this->forge->dropTable('operadores', true);
    }
}
