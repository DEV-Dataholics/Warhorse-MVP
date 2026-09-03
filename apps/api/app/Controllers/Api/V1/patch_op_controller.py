import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Controllers\Api\V1\OperadoresController.php'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s = """    // Método para consultar historial del operador"""
s_new = """    // Endpoint para el Dashboard de Taller (Inspecciones con anomalías)
    public function entrantes()
    {
        $db = \Config\Database::connect();
        $builder = $db->table('inspecciones_patio');
        $builder->select('inspecciones_patio.*, unidades.numero_economico as unidad, operadores.nombre as operador_nombre');
        $builder->join('unidades', 'unidades.id = inspecciones_patio.unidad_id');
        $builder->join('operadores', 'operadores.id = inspecciones_patio.operador_id');
        $builder->where('tiene_anomalias', 1);
        $builder->where('estado_revision', 'pendiente');
        $builder->orderBy('created_at', 'DESC');
        
        $entrantes = $builder->get()->getResultArray();
        
        foreach($entrantes as &$h) {
            $h['datos_json'] = json_decode($h['datos_json'], true);
        }
        
        return $this->respond($entrantes);
    }
    
    // Método para consultar historial del operador"""

if "public function entrantes" not in content:
    content = content.replace(s, s_new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched OperadoresController.php")
