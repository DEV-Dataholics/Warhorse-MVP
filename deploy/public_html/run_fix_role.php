<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$envFile = __DIR__ . '/../warhorse_app/.env';
if (!file_exists($envFile)) {
    die("No env file");
}
$env = parse_ini_file($envFile);

$host = $env['database.default.hostname'] ?? 'localhost';
$user = $env['database.default.username'] ?? '';
$pass = $env['database.default.password'] ?? '';
$db   = $env['database.default.database'] ?? '';

$mysqli = new mysqli($host, $user, $pass, $db);
if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

// update role
$mysqli->query("UPDATE usuarios SET rol = 'admin' WHERE email = 'direccion@warhorse.mx'");
echo "Updated usuarios table. ";

$res = $mysqli->query("SELECT id FROM usuarios WHERE email = 'direccion@warhorse.mx'");
if ($row = $res->fetch_assoc()) {
    $id = $row['id'];
    $mysqli->query("UPDATE auth_groups_users SET `group` = 'admin' WHERE user_id = $id");
    echo "Updated auth_groups_users for ID $id.";
}

$mysqli->close();
