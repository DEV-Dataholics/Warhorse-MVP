<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddYonkeUnidadDonante extends Migration
{
    public function up()
    {
        $this->forge->addColumn('catalogo_piezas', [
            'unidad_donante_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
                'null'       => true,
                'after'      => 'categoria'
            ],
        ]);
        
        $this->db->query("ALTER TABLE catalogo_piezas ADD CONSTRAINT fk_pieza_donante FOREIGN KEY (unidad_donante_id) REFERENCES unidades(id) ON DELETE RESTRICT");
        
        // Ensure 'Yonke' is allowed in the ENUM if categoria is ENUM.
        // Wait, the previous migration 2026-08-24-170558_AddCategoriaToPiezas.php set it as VARCHAR(100).
        // So no enum change needed in DB.
    }

    public function down()
    {
        $this->db->query("ALTER TABLE catalogo_piezas DROP FOREIGN KEY fk_pieza_donante");
        $this->forge->dropColumn('catalogo_piezas', 'unidad_donante_id');
    }
}
