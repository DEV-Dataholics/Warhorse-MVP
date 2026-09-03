<?php

namespace App\Libraries;

class Permisos
{
    /**
     * Map of roles to the UI modules they can access.
     * The frontend expects an object like { "dashboard": true, "compras": true, ... }
     */
    private static array $matrizFrontend = [
        'compras' => [
            'dashboard' => true,
            'compras' => true,
            'requisicion' => true,
            'catalogo' => true,
            'reparaciones' => true
        ],
        'taller' => [
            'dashboard' => true,
            'taller' => true,
            'requisicion' => true,
            'catalogo' => true,
            'reparaciones' => true
        ],
        'diesel' => [
            'dashboard' => true,
            'diesel' => true,
            'catalogo' => true
        ],
        'admin' => [
            'dashboard' => true,
            'taller' => true,
            'requisicion' => true,
            'compras' => true,
            'diesel' => true,
            'catalogo' => true,
            'usuarios' => true,
            'reportes' => true,
            'admin' => true,
            'reparaciones' => true
        ]
    ];

    /**
     * @param array|string $roles
     */
    public static function deRoles($roles): array
    {
        if (is_string($roles)) {
            $roles = array_map('trim', explode(',', $roles));
        }

        $permisosAcumulados = [];
        foreach ($roles as $rol) {
            if (isset(self::$matrizFrontend[$rol])) {
                foreach (self::$matrizFrontend[$rol] as $modulo => $valor) {
                    if ($valor) {
                        $permisosAcumulados[$modulo] = true;
                    }
                }
            }
        }
        return $permisosAcumulados;
    }

    /**
     * @param array|string $roles
     */
    public static function landing($roles): string
    {
        if (is_string($roles)) {
            $roles = array_map('trim', explode(',', $roles));
        }

        if (in_array('admin', $roles, true)) return 'dashboard';
        if (in_array('compras', $roles, true)) return 'compras';
        if (in_array('taller', $roles, true)) return 'requisicion';
        if (in_array('diesel', $roles, true)) return 'diesel';
        
        return 'dashboard';
    }
}
