<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class UpdateUnitHealthState extends Migration
{
    public function up()
    {
        // 1. Añadir estado_salud a unidades
        $this->forge->addColumn('unidades', [
            'estado_salud' => [
                'type'       => 'ENUM',
                'constraint' => ['Activo 100%', 'Activo con Warning', 'Inactivo en reparación', 'Inactivo (Yonkee)', 'Inactivo (Baja)'],
                'default'    => 'Activo 100%',
                'null'       => false,
            ],
        ]);

        // 2. Actualizar ENUM de ordenes_trabajo.estado para incluir Pausada
        $this->db->query("ALTER TABLE ordenes_trabajo MODIFY COLUMN estado ENUM('Activa', 'Pausada', 'Cerrada', 'Cancelada') NOT NULL DEFAULT 'Activa'");
    }

    public function down()
    {
        $this->db->query("ALTER TABLE ordenes_trabajo MODIFY COLUMN estado ENUM('Activa', 'Cerrada', 'Cancelada') NOT NULL DEFAULT 'Activa'");
        $this->forge->dropColumn('unidades', 'estado_salud');
    }
}
