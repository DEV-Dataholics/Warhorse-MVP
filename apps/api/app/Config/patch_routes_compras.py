import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Config\Routes.php'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s = """    $routes->get('compras/requisiciones', 'ComprasController::index', ['filter' => ['cors', 'api-auth', 'rbac:taller,compras,admin', 'password-vigente']]);"""
s_new = """    $routes->get('compras/requisiciones', 'ComprasController::index', ['filter' => ['cors', 'api-auth', 'rbac:taller,compras,admin', 'password-vigente']]);
    $routes->get('compras/buscar', 'ComprasController::buscar', ['filter' => ['cors', 'api-auth', 'rbac:taller,compras,admin', 'password-vigente']]);"""

if "compras/buscar" not in content:
    content = content.replace(s, s_new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched Routes.php")
