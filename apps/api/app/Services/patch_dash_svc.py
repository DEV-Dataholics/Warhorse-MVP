import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Services\DashboardService.php'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s_refac = """        // 2. Get refacciones costs per unit in date range
        $refaccionesQuery = $db->table('requisiciones r')
            ->select('r.unidad_destino_id, SUM(COALESCE(r.costo_real, r.costo_estimado)) total')
            ->where('r.estado', 'Instalado')
            ->groupBy('r.unidad_destino_id');"""
s_refac_new = """        // 2. Get refacciones costs per unit in date range
        $refaccionesQuery = $db->table('requisiciones r')
            ->select('r.unidad_destino_id, SUM(COALESCE(r.costo_real, r.costo_estimado)) total')
            ->where('r.estado', 'Instalado')
            ->where('r.es_caja_chica', 0) // Aislamiento Matemático de Caja Chica
            ->groupBy('r.unidad_destino_id');"""

if "es_caja_chica" not in content:
    content = content.replace(s_refac, s_refac_new)

# Now to append Compras KPIs
s_return = """        return [
            'unidades' => $resultado,
            'kpis' => [
                'total_diesel'       => array_sum(array_column($resultado, 'costo_diesel')),
                'total_refacciones'  => array_sum(array_column($resultado, 'costo_refacciones')),
                'costo_total'        => array_sum(array_column($resultado, 'costo_total')),
                'top_criticos'       => array_sum(array_column($resultado, 'critico')),
                'reparacion_activa'  => count(array_filter($resultado, fn($u) => $u['estado'] === 'Inactivo (Reparación)' || $u['estado'] === 'Inactivo en reparación')),
                'disponibilidad_pct' => count($unidadesRows) > 0 ? (int) round((count(array_filter($resultado, fn($u) => in_array($u['estado'], ['Activo', 'Activo 100%', 'Activo con Warning']))) / count($unidadesRows)) * 100) : 0,
            ]
        ];"""

s_return_new = """
        // --- KPIs de Compras ---
        $comprasFormal = $db->table('requisiciones')
            ->selectSum('costo_real')
            ->whereIn('estado', ['Comprado', 'En trayecto', 'Instalado'])
            ->where('es_caja_chica', 0);
        if ($desde) $comprasFormal->where('fecha_solicitud >=', $desde);
        if ($hasta) $comprasFormal->where('fecha_solicitud <=', $hasta);
        $totalComprasFormal = (float) $comprasFormal->get()->getRow()->costo_real;

        $comprasCajaChica = $db->table('requisiciones')
            ->selectSum('costo_real')
            ->whereIn('estado', ['Comprado', 'En trayecto', 'Instalado'])
            ->where('es_caja_chica', 1);
        if ($desde) $comprasCajaChica->where('fecha_solicitud >=', $desde);
        if ($hasta) $comprasCajaChica->where('fecha_solicitud <=', $hasta);
        $totalCajaChica = (float) $comprasCajaChica->get()->getRow()->costo_real;
        
        $reqsPendientes = $db->table('requisiciones')
            ->whereIn('estado', ['En aprobación', 'Cotizado'])
            ->countAllResults();

        return [
            'unidades' => $resultado,
            'kpis' => [
                'total_diesel'       => array_sum(array_column($resultado, 'costo_diesel')),
                'total_refacciones'  => array_sum(array_column($resultado, 'costo_refacciones')),
                'costo_total'        => array_sum(array_column($resultado, 'costo_total')),
                'top_criticos'       => array_sum(array_column($resultado, 'critico')),
                'reparacion_activa'  => count(array_filter($resultado, fn($u) => $u['estado'] === 'Inactivo (Reparación)' || $u['estado'] === 'Inactivo en reparación')),
                'disponibilidad_pct' => count($unidadesRows) > 0 ? (int) round((count(array_filter($resultado, fn($u) => in_array($u['estado'], ['Activo', 'Activo 100%', 'Activo con Warning']))) / count($unidadesRows)) * 100) : 0,
            ],
            'kpis_compras' => [
                'total_compras_formal' => $totalComprasFormal,
                'total_caja_chica'     => $totalCajaChica,
                'reqs_pendientes'      => $reqsPendientes
            ]
        ];"""

if "kpis_compras" not in content:
    content = content.replace(s_return, s_return_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched DashboardService.php")
