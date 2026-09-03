import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Config\Routes.php'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s_routes = """$routes->group('api/v1', ['namespace' => 'App\Controllers\Api\V1'], static function ($routes) {
    // Endpoints públicos / Operadores (Patio)"""

s_routes_new = """$routes->group('api/v1', ['namespace' => 'App\Controllers\Api\V1'], static function ($routes) {
    // Endpoints de Reportes Estáticos
    $routes->get('reportes/inventario', 'ReportesController::inventario');
    $routes->get('reportes/compras-ot', 'ReportesController::comprasOt');
    $routes->get('reportes/salud-flota', 'ReportesController::saludFlota');
    $routes->get('reportes/inspecciones', 'ReportesController::inspecciones');

    // Endpoints públicos / Operadores (Patio)"""

if "reportes/inventario" not in content:
    content = content.replace(s_routes, s_routes_new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Routes patched")
else:
    print("Already patched")
