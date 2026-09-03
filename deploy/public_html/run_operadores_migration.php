<?php
// run_operadores_migration.php - Create operadores and inspecciones_patio tables
// Trigger via: GET https://warhorse.dataholics.com.mx/run_operadores_migration.php

header('Content-Type: application/json');

require_once '/home1/noodluis/warhorse.dataholics.com.mx/warhorse_app/vendor/autoload.php';

$config = [
    'DSN'      => '',
    'hostname' => 'localhost',
    'username' => 'noodluis_warhorse',
    'password' => 'WHorse_2024!',
    'database' => 'noodluis_warhorse',
    'DBDriver' => 'MySQLi',
    'DBPrefix' => '',
    'pConnect' => false,
    'DBDebug'  => false,
    'charset'  => 'utf8mb4',
    'DBCollat' => 'utf8mb4_general_ci',
    'swapPre'  => '',
    'encrypt'  => false,
    'compress' => false,
    'strictOn' => false,
    'failover' => [],
    'port'     => 3306,
];

// Read actual DB credentials from CI4 .env
$envFile = '/home1/noodluis/warhorse.dataholics.com.mx/warhorse_app/.env';
if (file_exists($envFile)) {
    foreach (file($envFile) as $line) {
        $line = trim($line);
        if (str_starts_with($line, 'database.default.hostname')) {
            $config['hostname'] = trim(explode('=', $line, 2)[1] ?? 'localhost');
        }
        if (str_starts_with($line, 'database.default.username')) {
            $config['username'] = trim(explode('=', $line, 2)[1] ?? '');
        }
        if (str_starts_with($line, 'database.default.password')) {
            $config['password'] = trim(explode('=', $line, 2)[1] ?? '');
        }
        if (str_starts_with($line, 'database.default.database')) {
            $config['database'] = trim(explode('=', $line, 2)[1] ?? '');
        }
    }
}

$results = [];

$mysqli = new mysqli($config['hostname'], $config['username'], $config['password'], $config['database']);
if ($mysqli->connect_error) {
    echo json_encode(['error' => 'DB connect failed: ' . $mysqli->connect_error]);
    exit;
}
$mysqli->set_charset('utf8mb4');

// Check and create operadores table
$check = $mysqli->query("SHOW TABLES LIKE 'operadores'");
if ($check->num_rows === 0) {
    $sql = "CREATE TABLE `operadores` (
        `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        `numero_empleado` VARCHAR(50) NOT NULL,
        `nombre` VARCHAR(120) NOT NULL,
        `licencia` VARCHAR(50) NULL,
        `tipo_operacion` ENUM('cruce foráneo','local','backup') NOT NULL DEFAULT 'local',
        `unidad_asignada_id` BIGINT(20) UNSIGNED NULL,
        `activo` TINYINT(1) NOT NULL DEFAULT 1,
        `created_at` DATETIME NOT NULL,
        `updated_at` DATETIME NOT NULL,
        `deleted_at` DATETIME NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `operadores_numero_empleado_unique` (`numero_empleado`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    if ($mysqli->query($sql)) {
        $results[] = '[OK] Table operadores created';
    } else {
        $results[] = '[ERROR] operadores: ' . $mysqli->error;
    }
} else {
    $results[] = '[SKIP] Table operadores already exists';
}

// Check and create inspecciones_patio table
$check2 = $mysqli->query("SHOW TABLES LIKE 'inspecciones_patio'");
if ($check2->num_rows === 0) {
    $sql2 = "CREATE TABLE `inspecciones_patio` (
        `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        `operador_id` BIGINT(20) UNSIGNED NOT NULL,
        `unidad_id` BIGINT(20) UNSIGNED NOT NULL,
        `kilometraje` INT(11) UNSIGNED NULL,
        `nivel_combustible` INT(3) UNSIGNED NULL,
        `tiene_anomalias` TINYINT(1) NOT NULL DEFAULT 0,
        `datos_json` JSON NULL,
        `estado_revision` ENUM('pendiente','revisado','ignorada') NOT NULL DEFAULT 'pendiente',
        `created_at` DATETIME NOT NULL,
        `updated_at` DATETIME NOT NULL,
        `deleted_at` DATETIME NULL,
        PRIMARY KEY (`id`),
        INDEX `inspecciones_operador_id` (`operador_id`),
        INDEX `inspecciones_unidad_id` (`unidad_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    if ($mysqli->query($sql2)) {
        $results[] = '[OK] Table inspecciones_patio created';
    } else {
        $results[] = '[ERROR] inspecciones_patio: ' . $mysqli->error;
    }
} else {
    $results[] = '[SKIP] Table inspecciones_patio already exists';
}

$mysqli->close();

echo json_encode(['results' => $results], JSON_PRETTY_PRINT);
