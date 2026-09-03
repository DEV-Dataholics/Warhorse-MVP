<?php
// Temporary script to execute migrations AND import tractores on shared hosting
$_SERVER['CI_ENVIRONMENT'] = 'production';

define("FCPATH", __DIR__ . DIRECTORY_SEPARATOR);
if (getcwd() . DIRECTORY_SEPARATOR !== FCPATH) {
    chdir(FCPATH);
}

if (file_exists(FCPATH . 'warhorse_app/app/Config/Paths.php')) {
    require FCPATH . 'warhorse_app/app/Config/Paths.php';
} else {
    require FCPATH . '../warhorse_app/app/Config/Paths.php';
}
$paths = new Config\Paths();
require $paths->systemDirectory . "/Boot.php";

class Bootstrapper extends \CodeIgniter\Boot {
    public static function init($paths) {
        static::definePathConstants($paths);
        static::loadConstants();
        static::loadDotEnv($paths);
        static::defineEnvironment();
        static::loadEnvironmentBootstrap($paths);
        static::loadCommonFunctions();
        static::loadAutoloader();
        static::setExceptionHandler();
        static::autoloadHelpers();
        static::initializeCodeIgniter();
    }
}
Bootstrapper::init($paths);

try {
    $migrate = \CodeIgniter\Config\Services::migrations();

    echo "<h1>Running new migrations...</h1>";
    $migrate->setNamespace("App");
    $migrate->latest();
    echo "<h2 style='color:green'>✓ Migrations completed successfully!</h2>";
} catch (\Throwable $e) {
    echo "<h2 style='color:red'>✗ Migration failed!</h2>";
    echo "<pre>" . $e->getMessage() . "\n" . $e->getTraceAsString() . "</pre>";
    exit;
}

// =====================
// IMPORT TRACTORES
// =====================
try {
    echo "<h1>Importing Tractores...</h1>";
    $db = \Config\Database::connect();

    // Look for tractores.json in ROOTPATH
    $file = ROOTPATH . 'tractores.json';
    if (!file_exists($file)) {
        echo "<p style='color:orange'>⚠ tractores.json not found at {$file}. Skipping import.</p>";
    } else {
        $data = json_decode(file_get_contents($file), true);
        $upserted = 0;
        foreach ($data as $tractor) {
            $existing = $db->table('unidades')->where('id_unidad', $tractor['id_unidad'])->get()->getRow();
            if ($existing) {
                $db->table('unidades')->where('id', $existing->id)->update([
                    'placas'    => $tractor['placas'],
                    'marca_ano' => $tractor['marca_ano'],
                    'vin'       => $tractor['vin'],
                ]);
            } else {
                $db->table('unidades')->insert([
                    'id_unidad'        => $tractor['id_unidad'],
                    'tipo'             => 'Tracto',
                    'placas'           => $tractor['placas'],
                    'marca_ano'        => $tractor['marca_ano'],
                    'vin'              => $tractor['vin'],
                    'status'           => 'Disponible',
                    'valor_estimado'   => 0,
                    'costo_acumulado'  => 0,
                ]);
            }
            $upserted++;
        }
        echo "<h2 style='color:green'>✓ {$upserted} tractores imported/updated successfully!</h2>";
    }
} catch (\Throwable $e) {
    echo "<h2 style='color:red'>✗ Tractor import failed!</h2>";
    echo "<pre>" . $e->getMessage() . "\n" . $e->getTraceAsString() . "</pre>";
}
