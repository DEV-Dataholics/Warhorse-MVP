<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use App\Models\UnidadModel;

class ImportTractores extends BaseCommand
{
    protected $group       = 'Warhorse';
    protected $name        = 'warhorse:import_tractores';
    protected $description = 'Importa o actualiza los tractores desde tractores.json';

    public function run(array $params)
    {
        $file = ROOTPATH . 'tractores.json';
        if (!file_exists($file)) {
            CLI::error("No se encontró el archivo $file");
            return;
        }

        $json = file_get_contents($file);
        $data = json_decode($json, true);

        $model = new UnidadModel();
        $db = \Config\Database::connect();
        
        $upserted = 0;
        foreach ($data as $tractor) {
            $existing = $db->table('unidades')->where('id_unidad', $tractor['id_unidad'])->get()->getRow();
            
            if ($existing) {
                // Update
                $db->table('unidades')->where('id', $existing->id)->update([
                    'placas' => $tractor['placas'],
                    'marca_ano' => $tractor['marca_ano'],
                    'vin' => $tractor['vin'],
                ]);
            } else {
                // Insert
                $model->insert([
                    'id_unidad' => $tractor['id_unidad'],
                    'tipo' => 'Tracto',
                    'placas' => $tractor['placas'],
                    'marca_ano' => $tractor['marca_ano'],
                    'vin' => $tractor['vin'],
                    'status' => 'Disponible',
                    'valor_estimado' => 0,
                    'costo_acumulado' => 0,
                ]);
            }
            $upserted++;
        }

        CLI::write("Se han importado/actualizado $upserted tractores exitosamente.", 'green');
    }
}
