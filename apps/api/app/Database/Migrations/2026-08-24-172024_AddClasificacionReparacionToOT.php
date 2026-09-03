<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddClasificacionReparacionToOT extends Migration
{
    public function up()
    {
        $this->forge->addColumn('registros_taller', [
            'clasificacion_reparacion' => [
                'type'       => 'ENUM',
                'constraint' => ['Preventivo', 'Correctivo', 'NA'],
                'null'       => false,
                'default'    => 'NA',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('registros_taller', 'clasificacion_reparacion');
    }
}
