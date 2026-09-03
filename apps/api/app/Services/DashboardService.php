<?php

declare(strict_types=1);

namespace App\Services;

use App\Libraries\Bd;
use CodeIgniter\I18n\Time;

/**
 * Dashboard de Dirección (RF-DASH-01..06): KPIs y ranking en O(1) desde
 * consolidado_unidad (sin N+1) y veredicto Mantener/Evaluar/Vender calculado
 * SIEMPRE server-side con el umbral/ventana vigentes de parametros_veredicto.
 *
 * El costo del veredicto es el Costo Real Acumulado del consolidado (contrato
 * doc 05 §8); la ventana acota la evidencia operativa de la unidad: qué
 * liberaciones ponderan el % mejoralito y qué cargas alimentan la eficiencia.
 */
final class DashboardService
{
    public function __construct(
        private readonly ParametrosService $parametros = new ParametrosService(),
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function armar(?string $seleccion, ?string $tipo = null, ?string $desde = null, ?string $hasta = null, ?string $categoria = null): array
    {
        $parametros = $this->parametros->obtener();
        $db = db_connect();

        // 1. Get diesel costs per unit in date range (operating only, ignore maintenance category filtering)
        $dieselMap = [];
        if ($categoria === null || $categoria === 'Todos') {
            $dieselQuery = $db->table('registros_diesel')
                ->select('unidad_id, SUM(costo_total) total')
                ->groupBy('unidad_id');
            if ($desde) $dieselQuery->where('fecha >=', $desde);
            if ($hasta) $dieselQuery->where('fecha <=', $hasta);
            $dieselRows = Bd::filas($dieselQuery);
            foreach ($dieselRows as $dr) {
                $dieselMap[(int)$dr['unidad_id']] = (float)$dr['total'];
            }
        }

        // 2. Get refacciones costs per unit in date range
        $refaccionesQuery = $db->table('requisiciones r')
            ->select('r.unidad_destino_id, SUM(COALESCE(r.costo_real, r.costo_estimado)) total')
            ->where('r.estado', 'Instalado')
            ->where('r.es_caja_chica', 0) // Aislamiento Matemático de Caja Chica
            ->groupBy('r.unidad_destino_id');
        if ($desde) $refaccionesQuery->where('r.fecha_solicitud >=', $desde);
        if ($hasta) $refaccionesQuery->where('r.fecha_solicitud <=', $hasta);
        if ($categoria !== null && $categoria !== 'Todos') {
            $refaccionesQuery->join('ordenes_trabajo ot', 'ot.id = r.orden_trabajo_id')
                ->where('ot.categoria', $categoria);
        }
        $refaccionesRows = Bd::filas($refaccionesQuery);
        $refMap = [];
        foreach ($refaccionesRows as $rr) {
            if ($rr['unidad_destino_id'] !== null) {
                $refMap[(int)$rr['unidad_destino_id']] = (float)$rr['total'];
            }
        }

        // 3. Get workshop costs per unit in date range
        $tallerQuery = $db->table('registros_taller rt')
            ->select('rt.unidad_id, SUM(rt.costo_taller) total')
            ->groupBy('rt.unidad_id');
        if ($desde) $tallerQuery->where('rt.fecha_salida >=', $desde);
        if ($hasta) $tallerQuery->where('rt.fecha_salida <=', $hasta);
        if ($categoria !== null && $categoria !== 'Todos') {
            $tallerQuery->join('ordenes_trabajo ot', 'ot.id = rt.orden_trabajo_id')
                ->where('ot.categoria', $categoria);
        }
        $tallerRows = Bd::filas($tallerQuery);
        $tallerMap = [];
        foreach ($tallerRows as $tr) {
            $tallerMap[(int)$tr['unidad_id']] = (float)$tr['total'];
        }

        // 4. Query active units filtered by type
        $unidadesQuery = $db->table('unidades u')
            ->select('u.id, u.id_unidad, u.valor_referencia, u.tipo')
            ->where('u.estado', 'Activo');

        if ($tipo !== null && $tipo !== 'Todos') {
            $unidadesQuery->where('u.tipo', $tipo);
        } else if ($tipo === null) {
            $unidadesQuery->where('u.tipo', 'Tractor');
        }

        $unidadesList = Bd::filas($unidadesQuery);

        $dieselKpi = 0.0;
        $refKpi = 0.0;
        $tallerKpi = 0.0;
        $ranking = [];

        foreach ($unidadesList as $u) {
            $uid = (int)$u['id'];
            $d = $dieselMap[$uid] ?? 0.0;
            $r = $refMap[$uid] ?? 0.0;
            $t = $tallerMap[$uid] ?? 0.0;

            $dieselKpi += $d;
            $refKpi += $r;
            $tallerKpi += $t;

            $ranking[] = [
                'id'          => $uid,
                'id_unidad'   => (string)$u['id_unidad'],
                'costo_total' => $d + $r + $t,
                'critico'     => false,
            ];
        }

        // Sort ranking by cost total descending
        usort($ranking, static fn($a, $b) => $b['costo_total'] <=> $a['costo_total']);

        // Mark the first one as critico
        foreach ($ranking as $idx => &$item) {
            $item['critico'] = $idx === 0 && $item['costo_total'] > 0;
        }
        unset($item);

        // Find selection details
        $elegida = null;
        if ($seleccion !== null) {
            $elegida = Bd::fila(
                $db->table('unidades u')
                    ->select('u.id, u.id_unidad, u.valor_referencia')
                    ->where('u.id_unidad', $seleccion)
            );
        }
        
        if ($elegida === null && count($ranking) > 0) {
            // Default selection is the first unit in the filtered list
            $firstId = $ranking[0]['id'];
            $elegida = Bd::fila(
                $db->table('unidades u')
                    ->select('u.id, u.id_unidad, u.valor_referencia')
                    ->where('u.id', $firstId)
            );
        }

        // Calculate selected unit's total filtered cost
        if ($elegida !== null) {
            $selId = (int)$elegida['id'];
            $dSel = $dieselMap[$selId] ?? 0.0;
            $rSel = $refMap[$selId] ?? 0.0;
            $tSel = $tallerMap[$selId] ?? 0.0;
            
            $elegida['costo_total'] = $dSel + $rSel + $tSel;
        }


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
            'ranking'    => $ranking,
            'seleccion'  => $elegida === null ? null : $this->analizarUnidad($elegida, $parametros),
            'parametros' => [
                'umbral_pct'    => $parametros['umbral_pct'],
                'ventana_meses' => $parametros['ventana_meses'],
            ],
        ];
    }

    /**
     * @param array<string, mixed>                                    $unidad
     * @param array{id: int, umbral_pct: int, ventana_meses: int}     $parametros
     *
     * @return array<string, mixed>
     */
    private function analizarUnidad(array $unidad, array $parametros): array
    {
        $unidadId = (int) $unidad['id'];
        $desde    = Time::now()->subMonths($parametros['ventana_meses'])->toDateString();

        // RF-DASH-02: eficiencia km/L desde cargas reales dentro de la ventana
        $carga = Bd::fila(
            db_connect()->table('registros_diesel')
                ->select('COALESCE(SUM(km_recorridos),0) km, COALESCE(SUM(litros),0) litros')
                ->where('unidad_id', $unidadId)
                ->where('fecha >=', $desde),
        );
        $litros     = (float) ($carga['litros'] ?? 0);
        $eficiencia = $litros > 0 ? round(((float) ($carga['km'] ?? 0)) / $litros, 1) : null;

        // RF-DASH-03: % Total vs. mejoralito de las liberaciones en la ventana
        $liberaciones = Bd::fila(
            db_connect()->table('registros_taller')
                ->select("COUNT(*) liberadas, COALESCE(SUM(tipo_liberacion = 'Total'),0) totales")
                ->where('unidad_id', $unidadId)
                ->where('tipo_liberacion IS NOT NULL')
                ->where('fecha_salida >=', $desde),
        );
        $liberadas     = (int) ($liberaciones['liberadas'] ?? 0);
        $pctTotal      = $liberadas > 0 ? (int) round(((int) ($liberaciones['totales'] ?? 0)) / $liberadas * 100) : 100;
        $pctMejoralito = 100 - $pctTotal;

        $costo = (float) $unidad['costo_total'];
        $valor = $unidad['valor_referencia'] === null ? null : (float) $unidad['valor_referencia'];

        [$veredicto, $razon] = $this->veredicto($costo, $valor, $pctMejoralito, $parametros['umbral_pct']);

        return [
            'id'                        => $unidadId,
            'id_unidad'                 => (string) $unidad['id_unidad'],
            'costo_total'               => $costo,
            'valor_referencia'          => $valor,
            'eficiencia_km_l'           => $eficiencia,
            'pct_reparacion_total'      => $pctTotal,
            'pct_mejoralito'            => $pctMejoralito,
            'veredicto'                 => $veredicto,
            'razon'                     => $razon,
            'valor_referencia_pendiente' => $valor === null,
        ];
    }

    /**
     * RF-DASH-04: la regla del veredicto, con la razón textual del demo.
     *
     * @return array{0: string|null, 1: string}
     */
    private function veredicto(float $costo, ?float $valor, int $pctMejoralito, int $umbral): array
    {
        if ($valor === null) {
            return [null, 'Valor de referencia pendiente: captura el valor estimado de la unidad para calcular su veredicto.'];
        }

        $pct = (int) round($costo / $valor * 100);

        if ($pct < $umbral) {
            return ['Mantener', sprintf(
                'El costo acumulado (%s) representa el %d%% del valor estimado (%s), debajo del umbral del %d%%. La unidad sigue siendo un activo rentable.',
                $this->pesos($costo),
                $pct,
                $this->pesos($valor),
                $umbral,
            )];
        }

        if ($pctMejoralito > 0) {
            return ['Vender', sprintf(
                'El costo acumulado (%s) ya representa el %d%% del valor estimado del tracto (%s), por encima del umbral del %d%%. Además, %d%% de sus liberaciones fueron "mejoralito": reincide.',
                $this->pesos($costo),
                $pct,
                $this->pesos($valor),
                $umbral,
                $pctMejoralito,
            )];
        }

        return ['Evaluar', sprintf(
            'El costo acumulado (%s) ya representa el %d%% del valor estimado del tracto (%s), por encima del umbral del %d%%. Sin mejoralitos en la ventana: evaluar la unidad caso a caso.',
            $this->pesos($costo),
            $pct,
            $this->pesos($valor),
            $umbral,
        )];
    }

    private function pesos(float $monto): string
    {
        return '$' . number_format(round($monto), 0, '.', ',');
    }
}
