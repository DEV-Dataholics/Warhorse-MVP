<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateCatalogosRBAC extends Migration
{
    public function up()
    {
        // Proveedores
        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'nombre' => ['type' => 'VARCHAR', 'constraint' => 255],
            'rfc' => ['type' => 'VARCHAR', 'constraint' => 20, 'null' => true],
            'activo' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
            'deleted_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('proveedores', true);

        // Tipos de Fallas
        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'nombre' => ['type' => 'VARCHAR', 'constraint' => 255],
            'descripcion' => ['type' => 'TEXT', 'null' => true],
            'activo' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
            'deleted_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('tipos_fallas', true);

        // Añadir deleted_at a usuarios
        $fields = [
            'deleted_at' => ['type' => 'DATETIME', 'null' => true]
        ];
        $this->forge->addColumn('usuarios', $fields);

        // Añadir deleted_at a unidades
        $this->forge->addColumn('unidades', $fields);
    }

    public function down()
    {
        $this->forge->dropTable('proveedores', true);
        $this->forge->dropTable('tipos_fallas', true);
        $this->forge->dropColumn('usuarios', 'deleted_at');
        $this->forge->dropColumn('unidades', 'deleted_at');
    }
}
