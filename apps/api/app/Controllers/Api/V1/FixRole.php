<?php
namespace App\Controllers\Api\V1;
use CodeIgniter\RESTful\ResourceController;
class FixRole extends ResourceController {
    public function index() {
        $db = \Config\Database::connect();
        $db->query("UPDATE usuarios SET rol = 'admin' WHERE email = 'direccion@warhorse.mx'");
        
        $res = $db->query("SELECT id FROM usuarios WHERE email = 'direccion@warhorse.mx'");
        if ($row = $res->getRow()) {
            $db->query("UPDATE auth_groups_users SET `group` = 'admin' WHERE user_id = " . $row->id);
            return $this->response->setJSON(['status' => 'success', 'message' => 'Role updated!']);
        }
        return $this->response->setJSON(['status' => 'error']);
    }
}
