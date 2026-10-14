<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddFolioSlipToDieselDesgloses extends Migration
{
    public function up()
    {
        // Ticket #174: Alphanumeric receipt folio for external plant diesel loads.
        // Rule: Must NOT be UNIQUE because one slip can cover multiple units.
        $this->forge->addColumn('diesel_desgloses', [
            'folio_slip' => [
                'type'       => 'VARCHAR',
                'constraint' => '100',
                'null'       => false,
                'default'    => '',
                'after'      => 'unidad_id',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('diesel_desgloses', 'folio_slip');
    }
}
