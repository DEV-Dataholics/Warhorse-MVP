import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Config\Routes.php'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s = """    $routes->post('taller/reparaciones', 'OrdenesTrabajoController::crear', ['filter' => ['cors', 'api-auth', 'rbac:taller,admin', 'throttle-mut', 'password-vigente']]);"""
s_new = """    $routes->post('taller/reparaciones', 'OrdenesTrabajoController::crear', ['filter' => ['cors', 'api-auth', 'rbac:taller,admin', 'throttle-mut', 'password-vigente']]);
    $routes->patch('taller/reparaciones/(:num)/liberar', 'OrdenesTrabajoController::liberar/$1', ['filter' => ['cors', 'api-auth', 'rbac:taller,admin', 'throttle-mut', 'password-vigente']]);"""

if "liberar/$1" not in content:
    content = content.replace(s, s_new)
    
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched routes")
