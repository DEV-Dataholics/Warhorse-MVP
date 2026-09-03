import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Models\CatalogoPiezaModel.php'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s_allowed = """    protected $allowedFields    = [
        'nombre_normalizado',
        'numero_parte',
        'precio_referencia',
        'stock_minimo',
        'stock_maximo',
        'stock_actual',
        'validar_limites',
    ];"""
s_allowed_new = """    protected $allowedFields    = [
        'nombre_normalizado',
        'categoria',
        'unidad_donante_id',
        'numero_parte',
        'precio_referencia',
        'stock_minimo',
        'stock_maximo',
        'stock_actual',
        'validar_limites',
    ];"""

if "unidad_donante_id" not in content:
    content = content.replace(s_allowed, s_allowed_new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched CatalogoPiezaModel.php")
else:
    print("Already patched")
