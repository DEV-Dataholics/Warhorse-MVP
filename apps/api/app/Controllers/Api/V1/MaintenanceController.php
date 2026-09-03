<?php

namespace App\Controllers\Api\V1;

use CodeIgniter\HTTP\ResponseInterface;

/**
 * One-shot maintenance controller.
 * GET /api/v1/maintenance/run-tables
 * After running, delete this file from the server.
 */
final class MaintenanceController extends \CodeIgniter\Controller
{
    public function runTables(): ResponseInterface
    {
        $db = \Config\Database::connect();
        $results = [];

        // Create operadores table if missing
        $check = $db->query("SHOW TABLES LIKE 'operadores'");
        if ($check->getNumRows() === 0) {
            $sql = "CREATE TABLE `operadores` (
                `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
                `numero_empleado` VARCHAR(50) NOT NULL,
                `nombre` VARCHAR(120) NOT NULL,
                `licencia` VARCHAR(50) NULL,
                `tipo_operacion` ENUM('cruce foraneo','local','backup') NOT NULL DEFAULT 'local',
                `unidad_asignada_id` BIGINT(20) UNSIGNED NULL,
                `activo` TINYINT(1) NOT NULL DEFAULT 1,
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                `deleted_at` DATETIME NULL,
                PRIMARY KEY (`id`),
                UNIQUE KEY `operadores_numero_empleado_unique` (`numero_empleado`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
            if ($db->query($sql)) {
                $results[] = 'OK: Table operadores created';
            } else {
                $results[] = 'ERROR: operadores: ' . $db->error()['message'];
            }
        } else {
            $results[] = 'SKIP: Table operadores already exists';
        }

        // Create inspecciones_patio table if missing
        $check2 = $db->query("SHOW TABLES LIKE 'inspecciones_patio'");
        if ($check2->getNumRows() === 0) {
            $sql2 = "CREATE TABLE `inspecciones_patio` (
                `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
                `operador_id` BIGINT(20) UNSIGNED NOT NULL,
                `unidad_id` BIGINT(20) UNSIGNED NOT NULL,
                `kilometraje` INT(11) UNSIGNED NULL,
                `nivel_combustible` INT(3) UNSIGNED NULL,
                `tiene_anomalias` TINYINT(1) NOT NULL DEFAULT 0,
                `datos_json` JSON NULL,
                `estado_revision` ENUM('pendiente','revisado','ignorada') NOT NULL DEFAULT 'pendiente',
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                `deleted_at` DATETIME NULL,
                PRIMARY KEY (`id`),
                INDEX `idx_operador_id` (`operador_id`),
                INDEX `idx_unidad_id` (`unidad_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
            if ($db->query($sql2)) {
                $results[] = 'OK: Table inspecciones_patio created';
            } else {
                $results[] = 'ERROR: inspecciones_patio: ' . $db->error()['message'];
            }
        } else {
            $results[] = 'SKIP: Table inspecciones_patio already exists';
        }

        return $this->response->setJSON(['status' => 'done', 'results' => $results]);
    }
}
