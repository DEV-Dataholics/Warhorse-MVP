import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Config\Routes.php'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

admin_routes = """
    // Admin (Catálogos y RBAC)
    $routes->group('admin', ['filter' => ['cors', 'api-auth', 'rbac:admin', 'password-vigente']], static function ($routes) {
        // Usuarios
        $routes->get('usuarios', 'AdminController::usuariosList');
        $routes->post('usuarios', 'AdminController::usuariosCreate', ['filter' => 'throttle-mut']);
        $routes->patch('usuarios/(:num)', 'AdminController::usuariosUpdate/$1', ['filter' => 'throttle-mut']);
        $routes->delete('usuarios/(:num)', 'AdminController::usuariosDelete/$1', ['filter' => 'throttle-mut']);

        // Unidades
        $routes->get('unidades', 'AdminController::unidadesList');
        $routes->post('unidades', 'AdminController::unidadesCreate', ['filter' => 'throttle-mut']);
        $routes->patch('unidades/(:num)', 'AdminController::unidadesUpdate/$1', ['filter' => 'throttle-mut']);
        $routes->delete('unidades/(:num)', 'AdminController::unidadesDelete/$1', ['filter' => 'throttle-mut']);

        // Proveedores
        $routes->get('proveedores', 'AdminController::proveedoresList');
        $routes->post('proveedores', 'AdminController::proveedoresCreate', ['filter' => 'throttle-mut']);
        $routes->patch('proveedores/(:num)', 'AdminController::proveedoresUpdate/$1', ['filter' => 'throttle-mut']);
        $routes->delete('proveedores/(:num)', 'AdminController::proveedoresDelete/$1', ['filter' => 'throttle-mut']);

        // Fallas
        $routes->get('fallas', 'AdminController::fallasList');
        $routes->post('fallas', 'AdminController::fallasCreate', ['filter' => 'throttle-mut']);
        $routes->patch('fallas/(:num)', 'AdminController::fallasUpdate/$1', ['filter' => 'throttle-mut']);
        $routes->delete('fallas/(:num)', 'AdminController::fallasDelete/$1', ['filter' => 'throttle-mut']);
    });
"""

if "AdminController::usuariosList" not in content:
    content = content.replace("    // Operadores", admin_routes + "\n    // Operadores")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Routes updated")
