import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Services\RequisicionService.php'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s_update = """        $this->requisiciones->update($id, [
            'estado' => $nuevo,
        ]);"""
s_update_new = """        // TKT-WAR-106: Pipeline campos
        $updateData = ['estado' => $nuevo];
        
        if (!empty($cambio['proveedor'])) {
            $updateData['proveedor'] = $cambio['proveedor'];
        }
        if (isset($cambio['es_caja_chica'])) {
            $updateData['es_caja_chica'] = (int) $cambio['es_caja_chica'];
        }
        if (!empty($cambio['factura_xml'])) {
            $updateData['factura_xml'] = $cambio['factura_xml'];
        }

        $this->requisiciones->update($id, $updateData);"""

if "TKT-WAR-106: Pipeline campos" not in content and s_update in content:
    content = content.replace(s_update, s_update_new)
    
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched RequisicionService update")
