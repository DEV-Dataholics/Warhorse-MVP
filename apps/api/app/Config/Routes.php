<?php

use CodeIgniter\Router\RouteCollection;

/**
 * Rutas de la API v1 (contrato doc 05). Toda ruta bajo api/v1 salvo
 * auth/login exige token (filtro api-auth); las mutantes suman rbac.
 *
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');
$routes->post('api/contact', 'ContactController::create', ['filter' => ['cors']]);

$routes->group('api/v1', ['namespace' => 'App\Controllers\Api\V1'], static function (RouteCollection $routes): void {
    // Público (con throttling anti fuerza bruta)
    $routes->post('auth/login', 'AuthController::login', ['filter' => ['cors', 'throttle-login']]);
    $routes->get('run-migrations-trigger', static function() {
        $migrate = \CodeIgniter\Config\Services::migrations();
        $namespaces = ["CodeIgniter\Settings", "CodeIgniter\Shield", "CodeIgniter\Queue", "App"];
        $out = "";
        try {
            foreach ($namespaces as $ns) {
                $migrate->setNamespace($ns);
                $migrate->latest();
                $out .= "Migrated {$ns} successfully.<br>";
            }
        } catch (\Throwable $t) {
            $out .= "Migration error: " . $t->getMessage();
        }
        return $out;
    });
    $routes->get('test-unidades-trigger', static function() {
        try {
            $listado = (new \App\Models\UnidadModel())->listar(null, 1, 10);
            return json_encode($listado);
        } catch (\Throwable $e) {
            return $e->getMessage() . "<br>" . $e->getTraceAsString();
        }
    });

    // Autenticado. logout y el cambio de contraseña quedan EXENTOS del filtro
    // password-vigente para que un usuario con temporal siempre pueda definirla.
    $routes->post('auth/logout', 'AuthController::logout', ['filter' => ['cors', 'api-auth']]);
    $routes->patch('auth/password', 'AuthController::password', ['filter' => ['cors', 'api-auth']]);
    $routes->get('auth/me', 'AuthController::me', ['filter' => ['cors', 'api-auth']]);

    $routes->get('migrate-db-now', 'UnidadesController::migrate');

    // Catálogo de unidades (RF-UNI-01..05): lectura para todos los roles,
    // mutaciones solo Dirección (admin)
    $routes->get('unidades', 'UnidadesController::index', ['filter' => ['cors', 'api-auth', 'password-vigente']]);
    $routes->get('unidades/(:num)/ficha', 'UnidadesController::ficha/$1', ['filter' => ['cors', 'api-auth', 'password-vigente']]);
    $routes->post('unidades', 'UnidadesController::create', ['filter' => ['cors', 'api-auth', 'rbac:admin', 'throttle-mut', 'password-vigente']]);
    $routes->patch('unidades/(:num)', 'UnidadesController::update/$1', ['filter' => ['cors', 'api-auth', 'rbac:admin', 'throttle-mut', 'password-vigente']]);

    // Requisiciones (RF-REQ-01..07): crea solo Taller; leen taller (las
    // suyas, anti-IDOR en el service), compras y admin
    $routes->post('requisiciones', 'RequisicionesController::create', ['filter' => ['cors', 'api-auth', 'rbac:taller,admin', 'throttle-mut', 'password-vigente']]);
    $routes->get('requisiciones', 'RequisicionesController::index', ['filter' => ['cors', 'api-auth', 'rbac:taller,compras,admin', 'password-vigente']]);
    $routes->get('requisiciones/(:num)/foto', 'RequisicionesController::foto/$1', ['filter' => ['cors', 'api-auth', 'rbac:taller,compras,admin', 'password-vigente']]);
    $routes->get('requisiciones/(:num)/documento/(:alpha)', 'RequisicionesController::documento/$1/$2', ['filter' => ['cors', 'api-auth', 'rbac:taller,compras,admin', 'password-vigente']]);
    $routes->delete('requisiciones/(:num)', 'RequisicionesController::delete/$1', ['filter' => ['cors', 'api-auth', 'rbac:admin', 'throttle-mut', 'password-vigente']]);

    // Ordenes de Trabajo / Reparaciones (WH-005)
    $routes->get('taller/reparaciones', 'OrdenesTrabajoController::listar', ['filter' => ['cors', 'api-auth', 'rbac:taller,admin', 'password-vigente']]);
    $routes->post('taller/reparaciones', 'OrdenesTrabajoController::crear', ['filter' => ['cors', 'api-auth', 'rbac:taller,admin', 'throttle-mut', 'password-vigente']]);
    $routes->post('taller/reparaciones/(:num)/tomar-inventario', 'OrdenesTrabajoController::tomarInventario/$1', ['filter' => ['cors', 'api-auth', 'rbac:taller,admin', 'throttle-mut', 'password-vigente']]);
    $routes->get('taller/responsables', 'OrdenesTrabajoController::responsables', ['filter' => ['cors', 'api-auth', 'rbac:taller,admin', 'password-vigente']]);
    $routes->post('taller/responsables', 'OrdenesTrabajoController::crearResponsable', ['filter' => ['cors', 'api-auth', 'rbac:taller,admin', 'throttle-mut', 'password-vigente']]);

    // Panel de Compras (RF-COM-01..04): la cola la ven compras y admin; el
    // ciclo lo avanza SOLO compras (doc 05 §6)
    $routes->get('compras/requisiciones', 'ComprasController::index', ['filter' => ['cors', 'api-auth', 'rbac:taller,compras,admin', 'password-vigente']]);
    $routes->get('compras/buscar', 'ComprasController::buscar', ['filter' => ['cors', 'api-auth', 'rbac:taller,compras,admin', 'password-vigente']]);
    $routes->patch('compras/requisiciones/(:num)/estado', 'ComprasController::estado/$1', ['filter' => ['cors', 'api-auth', 'rbac:compras,admin', 'throttle-mut', 'password-vigente']]);
    $routes->post('compras/requisiciones/(:num)/revertir', 'ComprasController::revertir/$1', ['filter' => ['cors', 'api-auth', 'rbac:compras,admin', 'throttle-mut', 'password-vigente']]);

    // Almacén / Inventario (REQ-001)
    $routes->get('almacen/articulos', 'AlmacenController::articulos', ['filter' => ['cors', 'api-auth', 'rbac:compras,admin', 'password-vigente']]);
    $routes->post('almacen/articulos', 'AlmacenController::crear', ['filter' => ['cors', 'api-auth', 'rbac:compras,admin', 'throttle-mut', 'password-vigente']]);
    $routes->patch('almacen/articulos/(:num)', 'AlmacenController::actualizar/$1', ['filter' => ['cors', 'api-auth', 'rbac:compras,admin', 'throttle-mut', 'password-vigente']]);

    // Usuarios y permisos (RF-USR-01/02): solo Dirección
    $routes->get('usuarios', 'UsuariosController::index', ['filter' => ['cors', 'api-auth', 'rbac:admin', 'password-vigente']]);
    $routes->post('usuarios', 'UsuariosController::create', ['filter' => ['cors', 'api-auth', 'rbac:admin', 'throttle-mut', 'password-vigente']]);
    $routes->patch('usuarios/(:num)', 'UsuariosController::update/$1', ['filter' => ['cors', 'api-auth', 'rbac:admin', 'throttle-mut', 'password-vigente']]);

    // Salud de datos (SRS §9): solo Dirección
    $routes->get('metricas/salud', 'MetricasController::salud', ['filter' => ['cors', 'api-auth', 'rbac:admin', 'password-vigente']]);

    // Bitácora de auditoría (RF-INT-05): solo Dirección
    $routes->get('auditoria', 'AuditoriaController::index', ['filter' => ['cors', 'api-auth', 'rbac:admin', 'password-vigente']]);

    // Dashboard de Dirección (RF-DASH-01..06): solo admin, veredicto server-side
    $routes->get('dashboard', 'DashboardController::index', ['filter' => ['cors', 'api-auth', 'rbac:admin', 'password-vigente']]);

    // Parámetros del veredicto (RF-DASH-05): solo Dirección, auditado
    $routes->get('parametros/veredicto', 'ParametrosController::obtener', ['filter' => ['cors', 'api-auth', 'rbac:admin', 'password-vigente']]);
    $routes->patch('parametros/veredicto', 'ParametrosController::actualizar', ['filter' => ['cors', 'api-auth', 'rbac:admin', 'throttle-mut', 'password-vigente']]);

    // Diésel (RF-DIE-01..03): captura SOLO el rol diesel (doc 05 §10);
    // lectura diesel y admin
    $routes->get('diesel', 'DieselController::index', ['filter' => ['cors', 'api-auth', 'rbac:diesel,admin', 'password-vigente']]);
    $routes->post('diesel', 'DieselController::create', ['filter' => ['cors', 'api-auth', 'rbac:diesel,admin', 'throttle-mut', 'password-vigente']]);

    // Diesel Externo (Cargas y Desgloses)
    $routes->get('diesel/externos', 'DieselExternoController::index', ['filter' => ['cors', 'api-auth', 'rbac:diesel,admin', 'password-vigente']]);
    $routes->post('diesel/externos', 'DieselExternoController::createCarga', ['filter' => ['cors', 'api-auth', 'rbac:diesel,admin', 'throttle-mut', 'password-vigente']]);
    $routes->post('diesel/externos/(:num)/desglose', 'DieselExternoController::createDesglose/$1', ['filter' => ['cors', 'api-auth', 'rbac:diesel,admin', 'throttle-mut', 'password-vigente']]);
    $routes->delete('diesel/externos/(:num)/desglose/(:num)', 'DieselExternoController::deleteDesglose/$1/$2', ['filter' => ['cors', 'api-auth', 'rbac:diesel,admin', 'throttle-mut', 'password-vigente']]);

    // Taller (RF-TAL-01..04): captura solo taller; lectura taller y admin
    $routes->get('taller', 'TallerController::index', ['filter' => ['cors', 'api-auth', 'rbac:taller,admin', 'password-vigente']]);
    $routes->post('taller', 'TallerController::create', ['filter' => ['cors', 'api-auth', 'rbac:taller,admin', 'throttle-mut', 'password-vigente']]);
    $routes->patch('taller/(:num)/liberar', 'TallerController::liberar/$1', ['filter' => ['cors', 'api-auth', 'rbac:taller,admin', 'throttle-mut', 'password-vigente']]);

    // --- Operadores (Módulo 1: Yard Operations) ---
    // Auth no requiere token JWT previo
    $routes->post('operadores/auth', 'OperadoresController::auth', ['filter' => ['cors', 'throttle-mut']]);
    // Inspecciones pueden ser públicas o protegidas por algo más simple. Por ahora sin strict JWT.
    $routes->post('operadores/inspecciones', 'OperadoresController::crearInspeccion', ['filter' => ['cors', 'throttle-mut']]);
    $routes->get('operadores/entrantes', 'OperadoresController::entrantes', ['filter' => ['cors']]);
    $routes->get('operadores/(:num)/historial', 'OperadoresController::historial/$1', ['filter' => ['cors']]);

});

// Preflight CORS del SPA
$routes->options('api/(:any)', static fn () => service('response')->setStatusCode(204), ['filter' => 'cors']);
