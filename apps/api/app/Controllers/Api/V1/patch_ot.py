import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Controllers\Api\V1\OrdenesTrabajoController.php'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# PATCH 1: Block OT creation if one is open/paused
s_crear = """        // Verify responsible
        $resp = $db->table('responsables_taller')->where('id', $datos['responsable_id'])->get()->getRowArray();
        if ($resp === null) {
            return RespuestasApi::error(404, 'not_found', 'Responsable de taller no encontrado.');
        }"""
        
s_crear_new = """        // Verify responsible
        $resp = $db->table('responsables_taller')->where('id', $datos['responsable_id'])->get()->getRowArray();
        if ($resp === null) {
            return RespuestasApi::error(404, 'not_found', 'Responsable de taller no encontrado.');
        }

        // TKT-WAR-104: Anti-duplicidad de OTs
        $otAbiertaOPausada = $db->table('ordenes_trabajo')
            ->where('unidad_id', $datos['unidad_id'])
            ->whereIn('estado', ['Activa', 'Pausada'])
            ->get()->getRowArray();
            
        if ($otAbiertaOPausada) {
            return RespuestasApi::error(409, 'conflict', 'Esta unidad ya tiene una OT ' . $otAbiertaOPausada['estado'] . '. Debe reactivarla o cerrarla.');
        }"""
        
if "TKT-WAR-104" not in content:
    content = content.replace(s_crear, s_crear_new)

# PATCH 2: Update unit health
s_insert = """        $db->table('ordenes_trabajo')->insert([
            'unidad_id'          => (int) $datos['unidad_id'],"""

s_insert_new = """        // TKT-WAR-103: Update Unit Health
        $db->table('unidades')->where('id', $datos['unidad_id'])->update([
            'estado_salud' => 'Inactivo en reparación'
        ]);

        $db->table('ordenes_trabajo')->insert([
            'unidad_id'          => (int) $datos['unidad_id'],"""

if "estado_salud" not in content:
    content = content.replace(s_insert, s_insert_new)

# PATCH 3: Add method liberar()
s_add_method = """    public function tomarInventario(int $id): ResponseInterface"""
s_add_method_new = """
    // TKT-WAR-103 & TKT-WAR-104: Liberación y State Machine
    public function liberar(int $id): ResponseInterface
    {
        $request = $this->request;
        $datos   = $request instanceof \CodeIgniter\HTTP\IncomingRequest ? (array) $request->getJSON(true) : [];
        
        $tipoLiberacion = $datos['tipo'] ?? 'Total'; // 'Total' o 'Parcial'
        
        $db = \Config\Database::connect();
        $ot = $db->table('ordenes_trabajo')->where('id', $id)->get()->getRowArray();
        
        if (!$ot) return RespuestasApi::error(404, 'not_found', 'OT no encontrada.');
        if ($ot['estado'] === 'Cerrada') return RespuestasApi::error(409, 'conflict', 'La OT ya está cerrada.');
        
        $db->transStart();
        
        if ($tipoLiberacion === 'Parcial') {
            $db->table('ordenes_trabajo')->where('id', $id)->update(['estado' => 'Pausada']);
            $db->table('unidades')->where('id', $ot['unidad_id'])->update(['estado_salud' => 'Activo con Warning']);
        } else {
            $db->table('ordenes_trabajo')->where('id', $id)->update(['estado' => 'Cerrada']);
            $db->table('unidades')->where('id', $ot['unidad_id'])->update(['estado_salud' => 'Activo 100%']);
        }
        
        $db->transComplete();
        
        return $this->response->setJSON(['mensaje' => 'OT liberada (' . $tipoLiberacion . ') exitosamente.']);
    }

    public function tomarInventario(int $id): ResponseInterface"""

if "public function liberar" not in content:
    content = content.replace(s_add_method, s_add_method_new)
    
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched OrdenesTrabajoController.php")
