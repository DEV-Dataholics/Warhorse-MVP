<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddActivoToResponsablesTaller extends Migration
{
    public function up()
    {
        if (! $this->db->fieldExists('activo', 'responsables_taller')) {
            $this->forge->addColumn('responsables_taller', [
                'activo' => [
                    'type'       => 'BOOLEAN',
                    'default'    => 1,
                    'null'       => false,
                    'after'      => 'rol',
                ],
            ]);
        }
    }

    public function down()
    {
        if ($this->db->fieldExists('activo', 'responsables_taller')) {
            $this->forge->dropColumn('responsables_taller', 'activo');
        }
    }
}
