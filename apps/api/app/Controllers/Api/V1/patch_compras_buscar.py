import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Controllers\Api\V1\ComprasController.php'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s = """    public function estado(int $id): ResponseInterface"""
s_new = """    // TKT-WAR-102: Buscador rápido de estatus de compras por ID o número económico
    public function buscar(): ResponseInterface
    {
        $request = $this->request;
        $q = $request instanceof \CodeIgniter\HTTP\IncomingRequest ? $request->getGet('q') : '';
        $q = trim((string)$q);

        if ($q === '') {
            return $this->response->setJSON([]);
        }

        $db = \Config\Database::connect();
        $builder = $db->table('requisiciones req')
            ->select('req.*, u.numero_economico as unidad, u.placas as placas')
            ->join('unidades u', 'u.id = req.unidad_id', 'left')
            ->groupStart()
                ->like('req.id', $q)
                ->orLike('u.numero_economico', $q)
                ->orLike('req.justificacion', $q)
            ->groupEnd()
            ->orderBy('req.created_at', 'DESC')
            ->limit(20);

        return $this->response->setJSON($builder->get()->getResultArray());
    }

    public function estado(int $id): ResponseInterface"""

if "public function buscar(" not in content:
    content = content.replace(s, s_new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched ComprasController.php")
