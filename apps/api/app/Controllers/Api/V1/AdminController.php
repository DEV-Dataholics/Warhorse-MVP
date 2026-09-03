<?php

namespace App\Controllers\Api\V1;

use CodeIgniter\RESTful\ResourceController;
use App\Models\UsuarioModel;
use App\Models\UnidadModel;
use App\Models\ProveedorModel;
use App\Models\TipoFallaModel;
use App\Models\AuditLogModel;

class AdminController extends ResourceController
{
    protected $format = 'json';

    // ==========================================
    // USUARIOS
    // ==========================================
    public function usuariosList()
    {
        $model = new UsuarioModel();
        return $this->respond($model->findAll());
    
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}

    public function usuariosCreate()
    {
        $model = new UsuarioModel();
        $data = $this->request->getJSON(true);
        if ($model->insert($data)) {
            return $this->respondCreated(['id' => $model->getInsertID()]);
        
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}
        return $this->failValidationErrors($model->errors());
    
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}

    public function usuariosUpdate($id = null)
    {
        $model = new UsuarioModel();
        $data = $this->request->getJSON(true);
        if ($model->update($id, $data)) {
            return $this->respond(['message' => 'Actualizado correctamente']);
        
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}
        return $this->failValidationErrors($model->errors());
    
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}

    public function usuariosDelete($id = null)
    {
        $model = new UsuarioModel();
        // Soft delete enabled via model
        if ($model->delete($id)) {
            return $this->respondDeleted(['id' => $id, 'message' => 'Eliminado (Soft delete)']);
        
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}
        return $this->failNotFound('No se encontrÃ³ el usuario');
    
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}

    // ==========================================
    // UNIDADES
    // ==========================================
    public function unidadesList()
    {
        $model = new UnidadModel();
        return $this->respond($model->findAll());
    
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}

    public function unidadesCreate()
    {
        $model = new UnidadModel();
        $data = $this->request->getJSON(true);
        if ($model->insert($data)) {
            return $this->respondCreated(['id' => $model->getInsertID()]);
        
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}
        return $this->failValidationErrors($model->errors());
    
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}

    public function unidadesUpdate($id = null)
    {
        $model = new UnidadModel();
        $data = $this->request->getJSON(true);
        if ($model->update($id, $data)) {
            return $this->respond(['message' => 'Actualizado correctamente']);
        
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}
        return $this->failValidationErrors($model->errors());
    
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}

    public function unidadesDelete($id = null)
    {
        $model = new UnidadModel();
        if ($model->delete($id)) {
            return $this->respondDeleted(['id' => $id, 'message' => 'Eliminado (Soft delete)']);
        
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}
        return $this->failNotFound('No se encontrÃ³ la unidad');
    
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}

    // ==========================================
    // PROVEEDORES
    // ==========================================
    public function proveedoresList()
    {
        $model = new ProveedorModel();
        return $this->respond($model->findAll());
    
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}

    public function proveedoresCreate()
    {
        $model = new ProveedorModel();
        $data = $this->request->getJSON(true);
        if ($model->insert($data)) {
            return $this->respondCreated(['id' => $model->getInsertID()]);
        
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}
        return $this->failValidationErrors($model->errors());
    
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}

    public function proveedoresUpdate($id = null)
    {
        $model = new ProveedorModel();
        $data = $this->request->getJSON(true);
        if ($model->update($id, $data)) {
            return $this->respond(['message' => 'Actualizado correctamente']);
        
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}
        return $this->failValidationErrors($model->errors());
    
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}

    public function proveedoresDelete($id = null)
    {
        $model = new ProveedorModel();
        if ($model->delete($id)) {
            return $this->respondDeleted(['id' => $id, 'message' => 'Eliminado (Soft delete)']);
        
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}
        return $this->failNotFound('No se encontrÃ³ el proveedor');
    
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}

    // ==========================================
    // TIPOS DE FALLAS
    // ==========================================
    public function fallasList()
    {
        $model = new TipoFallaModel();
        return $this->respond($model->findAll());
    
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}

    public function fallasCreate()
    {
        $model = new TipoFallaModel();
        $data = $this->request->getJSON(true);
        if ($model->insert($data)) {
            return $this->respondCreated(['id' => $model->getInsertID()]);
        
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}
        return $this->failValidationErrors($model->errors());
    
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}

    public function fallasUpdate($id = null)
    {
        $model = new TipoFallaModel();
        $data = $this->request->getJSON(true);
        if ($model->update($id, $data)) {
            return $this->respond(['message' => 'Actualizado correctamente']);
        
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}
        return $this->failValidationErrors($model->errors());
    
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}

    public function fallasDelete($id = null)
    {
        $model = new TipoFallaModel();
        if ($model->delete($id)) {
            return $this->respondDeleted(['id' => $id, 'message' => 'Eliminado (Soft delete)']);
        
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}
        return $this->failNotFound('No se encontrÃ³ el tipo de falla');
    
    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}

    // ==========================================
    // AUDIT LOGS (Trazabilidad)
    // ==========================================
    public function auditLogsList()
    {
        $model = new AuditLogModel();
        // Optional filters
        $modulo = $this->request->getVar('modulo');
        $usuario_id = $this->request->getVar('usuario_id');
        
        $model->orderBy('created_at', 'DESC');
        if ($modulo) {
            $model->where('modulo', $modulo);
        }
        if ($usuario_id) {
            $model->where('usuario_id', $usuario_id);
        }
        
        // Limit to latest 500 for performance
        $logs = $model->findAll(500);
        return $this->respond($logs);
    }
}
