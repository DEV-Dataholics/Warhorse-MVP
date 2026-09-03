import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Config\Routes.php'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

operators_routes = """
    // --- Operadores (Módulo 1: Yard Operations) ---
    // Auth no requiere token JWT previo
    $routes->post('operadores/auth', 'OperadoresController::auth', ['filter' => ['cors', 'throttle-mut']]);
    // Inspecciones pueden ser públicas o protegidas por algo más simple. Por ahora sin strict JWT.
    $routes->post('operadores/inspecciones', 'OperadoresController::crearInspeccion', ['filter' => ['cors', 'throttle-mut']]);
    $routes->get('operadores/(:num)/historial', 'OperadoresController::historial/$1', ['filter' => ['cors']]);
"""

if "operadores/auth" not in content:
    content = content.replace("});\n\n// Preflight CORS", operators_routes + "\n});\n\n// Preflight CORS")
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Routes patched")
else:
    print("Routes already patched")
