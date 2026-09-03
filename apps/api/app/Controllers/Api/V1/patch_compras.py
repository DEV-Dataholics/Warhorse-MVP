import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Controllers\Api\V1\ComprasController.php'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s_val = """            'numero_factura' => 'permit_empty|string|max_length[80]',
            'motivo'         => 'permit_empty|string|max_length[500]',"""
s_val_new = """            'numero_factura' => 'permit_empty|string|max_length[80]',
            'motivo'         => 'permit_empty|string|max_length[500]',
            'proveedor'      => 'permit_empty|string|max_length[150]',
            'es_caja_chica'  => 'permit_empty|in_list[0,1]',
            'factura_xml'    => 'permit_empty|string|max_length[255]',"""

if "proveedor" not in content:
    content = content.replace(s_val, s_val_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched validateData in ComprasController")
