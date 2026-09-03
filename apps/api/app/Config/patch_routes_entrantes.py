import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Config\Routes.php'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s = """    $routes->post('operadores/inspecciones', 'OperadoresController::crearInspeccion', ['filter' => ['cors', 'throttle-mut']]);"""
s_new = """    $routes->post('operadores/inspecciones', 'OperadoresController::crearInspeccion', ['filter' => ['cors', 'throttle-mut']]);
    $routes->get('operadores/entrantes', 'OperadoresController::entrantes', ['filter' => ['cors']]);"""

if "operadores/entrantes" not in content:
    content = content.replace(s, s_new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched Routes.php")
