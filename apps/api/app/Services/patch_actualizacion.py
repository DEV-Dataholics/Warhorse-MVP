import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Services\RequisicionService.php'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s_act = """        $actualizacion = ['estado' => $nuevo];"""
s_act_new = """        $actualizacion = ['estado' => $nuevo];
        
        if (!empty($cambio['proveedor'])) {
            $actualizacion['proveedor'] = $cambio['proveedor'];
        }
        if (isset($cambio['es_caja_chica'])) {
            $actualizacion['es_caja_chica'] = (int) $cambio['es_caja_chica'];
        }
        if (!empty($cambio['factura_xml'])) {
            $actualizacion['factura_xml'] = $cambio['factura_xml'];
        }
        """

if "es_caja_chica" not in content:
    content = content.replace(s_act, s_act_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched actualizacion in RequisicionService")
