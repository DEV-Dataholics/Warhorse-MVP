import re

# 1. Update AdminController
path_ctrl = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Controllers\Api\V1\AdminController.php'
with open(path_ctrl, 'r', encoding='utf-8') as f:
    ctrl = f.read()

if "App\\Models\\AuditLogModel" not in ctrl:
    ctrl = ctrl.replace("use App\\Models\\TipoFallaModel;", "use App\\Models\\TipoFallaModel;\nuse App\\Models\\AuditLogModel;")

if "auditLogsList" not in ctrl:
    audit_method = """
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
"""
    ctrl = ctrl.replace("}\n", audit_method + "}\n")
    with open(path_ctrl, 'w', encoding='utf-8') as f:
        f.write(ctrl)

# 2. Update Routes.php
path_routes = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Config\Routes.php'
with open(path_routes, 'r', encoding='utf-8') as f:
    routes = f.read()

if "audit-logs" not in routes:
    routes = routes.replace("// Fallas", "// Audit Logs\n        $routes->get('audit-logs', 'AdminController::auditLogsList');\n\n        // Fallas")
    with open(path_routes, 'w', encoding='utf-8') as f:
        f.write(routes)

print("Updated Backend for Audit Logs")
