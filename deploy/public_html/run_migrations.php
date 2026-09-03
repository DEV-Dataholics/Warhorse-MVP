<?php
// Temporary script to execute database migrations on shared hosting
// Set environment explicitly
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
    $namespaces = ["CodeIgniter\Settings", "CodeIgniter\Shield", "CodeIgniter\Queue", "App"];

    echo "<h1>Starting migrations...</h1>";
    foreach ($namespaces as $ns) {
        echo "Migrating namespace: {$ns}<br>";
        $migrate->setNamespace($ns);
        $migrate->latest();
    }
    echo "<h2>Migration completed successfully!</h2>";
} catch (\Throwable $e) {
    echo "<h2>Migration failed!</h2>";
    echo "<pre>" . $e->getMessage() . "\n" . $e->getTraceAsString() . "</pre>";
}

// IMPORT TRACTORES using real column names from live DB
try {
    $db = \Config\Database::connect();
    $file = ROOTPATH . 'tractores.json';

    if (!file_exists($file)) {
        echo "<p>tractores.json not found at {$file}</p>";
    } else {
        $data = json_decode(file_get_contents($file), true);
        $updated = 0; $inserted = 0;

        foreach ($data as $t) {
            $existing = $db->table('unidades')->where('id_unidad', $t['id_unidad'])->get()->getRow();
            if ($existing) {
                $db->table('unidades')->where('id', $existing->id)->update([
                    'placas'    => $t['placas'],
                    'marca_ano' => $t['marca_ano'],
                    'vin'       => $t['vin'],
                    'marca'     => isset($t['marca_ano']) ? explode('-', $t['marca_ano'])[0] : null,
                    'modelo'    => isset($t['marca_ano']) ? (explode('-', $t['marca_ano'])[1] ?? null) : null,
                ]);
                $updated++;
            } else {
                $db->table('unidades')->insert([
                    'id_unidad' => $t['id_unidad'],
                    'tipo'      => 'Tractor',
                    'placas'    => $t['placas'],
                    'marca_ano' => $t['marca_ano'],
                    'vin'       => $t['vin'],
                    'marca'     => isset($t['marca_ano']) ? explode('-', $t['marca_ano'])[0] : null,
                    'modelo'    => isset($t['marca_ano']) ? (explode('-', $t['marca_ano'])[1] ?? null) : null,
                    'estado'    => 'Activo',
                    'fecha_alta' => date('Y-m-d'),
                ]);
                $inserted++;
            }
        }
        echo "<h2>Tractores: {$updated} updated, {$inserted} inserted.</h2>";
    }
} catch (\Throwable $e) {
    echo "<h2>Tractor import failed!</h2>";
    echo "<pre>" . $e->getMessage() . "\n" . $e->getTraceAsString() . "</pre>";
}
