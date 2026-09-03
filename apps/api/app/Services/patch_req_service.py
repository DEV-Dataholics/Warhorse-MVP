import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Services\RequisicionService.php'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s_ot = """        $otId = null;
        if (!empty($datos['orden_trabajo_id'])) {"""
s_ot_new = """        // TKT-WAR-105: Gatekeeper
        $otId = null;
        if (empty($datos['orden_trabajo_id'])) {
            throw new ValidacionException('Todas las requisiciones deben estar vinculadas a una Orden de Trabajo activa.', [
                'orden_trabajo_id' => ['Todas las requisiciones deben estar vinculadas a una Orden de Trabajo activa.'],
            ]);
        }
        if (!empty($datos['orden_trabajo_id'])) {"""

if "TKT-WAR-105" not in content:
    content = content.replace(s_ot, s_ot_new)
    
s_estado = """    public function avanzarEstatus(int $id, string $nuevo, string $justificacion, array $actor): array"""
s_estado_new = """    public function avanzarEstatus(int $id, string $nuevo, string $justificacion, array $actor, array $datos = []): array"""

if s_estado in content:
    content = content.replace(s_estado, s_estado_new)

s_update = """        $this->requisiciones->update($id, [
            'estado' => $nuevo,
        ]);"""
s_update_new = """        $updateData = ['estado' => $nuevo];
        
        // TKT-WAR-106: Pipeline campos
        if (!empty($datos['proveedor'])) {
            $updateData['proveedor'] = $datos['proveedor'];
        }
        if (isset($datos['es_caja_chica'])) {
            $updateData['es_caja_chica'] = (int) $datos['es_caja_chica'];
        }
        if (!empty($datos['factura_xml'])) {
            $updateData['factura_xml'] = $datos['factura_xml'];
        }

        $this->requisiciones->update($id, $updateData);"""

if "TKT-WAR-106" not in content:
    content = content.replace(s_update, s_update_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched RequisicionService.php")
