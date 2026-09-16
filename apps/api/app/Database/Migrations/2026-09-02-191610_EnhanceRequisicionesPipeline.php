<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class EnhanceRequisicionesPipeline extends Migration
{
    public function up()
    {
        // 1. Añadir proveedor, caja chica y factura
        $fieldsToAdd = [];
        if (! $this->db->fieldExists('proveedor', 'requisiciones')) {
            $fieldsToAdd['proveedor'] = [
                'type'       => 'VARCHAR',
                'constraint' => '150',
                'null'       => true,
            ];
        }
        if (! $this->db->fieldExists('es_caja_chica', 'requisiciones')) {
            $fieldsToAdd['es_caja_chica'] = [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 0,
                'null'       => false,
            ];
        }
        if (! $this->db->fieldExists('factura_xml', 'requisiciones')) {
            $fieldsToAdd['factura_xml'] = [
                'type'       => 'VARCHAR',
                'constraint' => '255',
                'null'       => true,
            ];
        }
        if (!empty($fieldsToAdd)) {
            $this->forge->addColumn('requisiciones', $fieldsToAdd);
        }

        // 2. Modificar orden_trabajo_id para que sea obligatorio (NOT NULL)
        try {
            $this->db->query("SET FOREIGN_KEY_CHECKS=0");
            $this->db->query("UPDATE requisiciones SET orden_trabajo_id = 1 WHERE orden_trabajo_id IS NULL");
            $this->db->query("ALTER TABLE requisiciones MODIFY orden_trabajo_id BIGINT UNSIGNED NOT NULL");
            $this->db->query("SET FOREIGN_KEY_CHECKS=1");
        } catch (\Throwable $e) {
            // Ignorar si el motor no permite alterar con FK existente
        }
    }

    public function down()
    {
        $this->db->query("ALTER TABLE requisiciones MODIFY orden_trabajo_id BIGINT UNSIGNED NULL");
        $this->forge->dropColumn('requisiciones', 'proveedor');
        $this->forge->dropColumn('requisiciones', 'es_caja_chica');
        $this->forge->dropColumn('requisiciones', 'factura_xml');
    }
}
