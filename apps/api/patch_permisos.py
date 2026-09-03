import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Libraries\Permisos.php'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add 'admin' to MODULOS and MATRIZ['admin']
if "'admin'" not in content.split("public const MODULOS")[1].split(";")[0]:
    content = content.replace("public const MODULOS = ['dashboard', 'requisicion', 'taller', 'compras', 'catalogo', 'diesel', 'usuarios', 'reportes', 'reparaciones'];",
                              "public const MODULOS = ['dashboard', 'requisicion', 'taller', 'compras', 'catalogo', 'diesel', 'usuarios', 'reportes', 'reparaciones', 'admin'];")
    
if "'admin'" not in content.split("private const MATRIZ = [")[1].split("];")[0].split("'admin'")[1]:
    content = content.replace("'admin'   => ['dashboard', 'requisicion', 'taller', 'compras', 'catalogo', 'diesel', 'usuarios', 'reportes', 'reparaciones']",
                              "'admin'   => ['dashboard', 'requisicion', 'taller', 'compras', 'catalogo', 'diesel', 'usuarios', 'reportes', 'reparaciones', 'admin']")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Permisos.php")
