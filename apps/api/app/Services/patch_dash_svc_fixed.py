import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Services\DashboardService.php'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s_return = """        return [
            'kpis' => [
                'diesel'               => $dieselKpi,
                'refacciones'          => $refKpi,
                'taller'               => $tallerKpi,
                'costo_real_acumulado' => $dieselKpi + $refKpi + $tallerKpi,
            ],
            'ranking'    => $ranking,"""

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
            'kpis' => [
                'diesel'               => $dieselKpi,
                'refacciones'          => $refKpi,
                'taller'               => $tallerKpi,
                'costo_real_acumulado' => $dieselKpi + $refKpi + $tallerKpi,
            ],
            'kpis_compras' => [
                'total_compras_formal' => $totalComprasFormal,
                'total_caja_chica'     => $totalCajaChica,
                'reqs_pendientes'      => $reqsPendientes
            ],
            'ranking'    => $ranking,"""

if "kpis_compras" not in content:
    content = content.replace(s_return, s_return_new)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched DashboardService.php")
