<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

define('FCPATH', __DIR__ . DIRECTORY_SEPARATOR);
require FCPATH . '../warhorse_app/app/Config/Paths.php';
$paths = new Config\Paths();
require rtrim($paths->systemDirectory, '\\/ ') . DIRECTORY_SEPARATOR . 'bootstrap.php';
require_once SYSTEMPATH . 'Config/DotEnv.php';
(new CodeIgniter\Config\DotEnv(ROOTPATH))->load();
$db = \Config\Database::connect();
$db->query("UPDATE usuarios SET rol = 'admin' WHERE email = 'direccion@warhorse.mx'");
echo "Role updated to admin in usuarios for direccion@warhorse.mx\n";

// Also update shield's auth_groups_users table if it exists
$tables = $db->listTables();
if (in_array('auth_groups_users', $tables)) {
    // get user id
    $query = $db->query("SELECT id FROM usuarios WHERE email = 'direccion@warhorse.mx'");
    $row = $query->getRow();
    if ($row) {
        $id = $row->id;
        $db->query("UPDATE auth_groups_users SET `group` = 'admin' WHERE user_id = " . $id);
        echo "Role updated to admin in auth_groups_users for ID $id\n";
    }
}
