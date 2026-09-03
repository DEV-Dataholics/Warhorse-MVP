<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class EnhanceRequisicionesPipeline extends Migration
{
    public function up()
    {
        // 1. Añadir proveedor, caja chica y factura
        $this->forge->addColumn('requisiciones', [
            'proveedor' => [
                'type'       => 'VARCHAR',
                'constraint' => '150',
                'null'       => true,
            ],
            'es_caja_chica' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 0,
                'null'       => false,
            ],
            'factura_xml' => [
                'type'       => 'VARCHAR',
                'constraint' => '255',
                'null'       => true,
            ],
        ]);

        // 2. Modificar orden_trabajo_id para que sea obligatorio (NOT NULL)
        // Pero antes, en caso de que existan requisiciones huérfanas, las asignamos a la OT 1 o eliminamos
        $this->db->query("UPDATE requisiciones SET orden_trabajo_id = 1 WHERE orden_trabajo_id IS NULL");
        
        $this->db->query("ALTER TABLE requisiciones MODIFY orden_trabajo_id BIGINT UNSIGNED NOT NULL");
    }

    public function down()
    {
        $this->db->query("ALTER TABLE requisiciones MODIFY orden_trabajo_id BIGINT UNSIGNED NULL");
        $this->forge->dropColumn('requisiciones', 'proveedor');
        $this->forge->dropColumn('requisiciones', 'es_caja_chica');
        $this->forge->dropColumn('requisiciones', 'factura_xml');
    }
}
