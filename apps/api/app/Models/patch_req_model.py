import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Models\RequisicionModel.php'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s = """        'costo_estimado', 'origen_costo_estimado', 'costo_real', 'numero_factura',"""
s_new = """        'costo_estimado', 'origen_costo_estimado', 'costo_real', 'numero_factura', 'proveedor', 'es_caja_chica', 'factura_xml',"""

if "'proveedor'" not in content:
    content = content.replace(s, s_new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched RequisicionModel.php")
