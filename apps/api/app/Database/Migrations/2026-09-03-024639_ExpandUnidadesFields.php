<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class ExpandUnidadesFields extends Migration
{
    public function up()
    {
        // Check which columns already exist so we don't crash on older MySQL
        $existing = $this->db->getFieldNames('unidades');

        $toAdd = [];
        if (!in_array('placas', $existing)) {
            $toAdd['placas'] = ['type' => 'VARCHAR', 'constraint' => 20, 'null' => true];
        }
        if (!in_array('marca_ano', $existing)) {
            $toAdd['marca_ano'] = ['type' => 'VARCHAR', 'constraint' => 100, 'null' => true];
        }
        if (!in_array('vin', $existing)) {
            $toAdd['vin'] = ['type' => 'VARCHAR', 'constraint' => 50, 'null' => true];
        }

        if (!empty($toAdd)) {
            $this->forge->addColumn('unidades', $toAdd);
        }
    }

    public function down()
    {
        $this->forge->dropColumn('unidades', ['placas', 'marca_ano', 'vin']);
    }
}
