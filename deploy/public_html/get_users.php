<?php
define('FCPATH', __DIR__ . '/');
require FCPATH . '../apps/api/app/Config/Paths.php';
$paths = new Config\Paths();
require rtrim($paths->systemDirectory, '\\/ ') . '/bootstrap.php';
require_once SYSTEMPATH . 'Config/DotEnv.php';
(new CodeIgniter\Config\DotEnv(ROOTPATH))->load();
$db = \Config\Database::connect();
$query = $db->query("SELECT id, nombre, email, rol FROM usuarios");
echo json_encode($query->getResultArray(), JSON_PRETTY_PRINT);
