<?php

declare(strict_types=1);

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/**
 * Catálogo de piezas de referencia — alimenta el fallback C de la cascada
 * de valorización Yonke (ADR-002). Precios de referencia del demo.
 */
class CatalogoPiezasSeeder extends Seeder
{
    public function run(): void
    {
        $piezas = [
            ['nombre_normalizado' => 'Turbo Garrett ISX', 'categoria' => 'Motor', 'numero_parte' => 'TRB-3200', 'precio_referencia' => 4500.00, 'stock_actual' => 1, 'stock_minimo' => 1, 'stock_maximo' => 3, 'validar_limites' => 1],
            ['nombre_normalizado' => 'Balatas de freno traseras', 'categoria' => 'Frenos', 'numero_parte' => 'BAL-4420', 'precio_referencia' => 1800.00, 'stock_actual' => 8, 'stock_minimo' => 4, 'stock_maximo' => 16, 'validar_limites' => 1],
            ['nombre_normalizado' => 'Caja de transmisión Eaton', 'categoria' => 'Transmisión', 'numero_parte' => 'EAT-18V', 'precio_referencia' => 28000.00, 'stock_actual' => 0, 'stock_minimo' => 1, 'stock_maximo' => 2, 'validar_limites' => 1],
            ['nombre_normalizado' => 'Kit de clutch Spicer 15.5', 'categoria' => 'Transmisión', 'numero_parte' => 'CLT-1100', 'precio_referencia' => 6400.00, 'stock_actual' => 2, 'stock_minimo' => 1, 'stock_maximo' => 4, 'validar_limites' => 1],
            ['nombre_normalizado' => 'Chapa de puerta cabina', 'categoria' => 'Otros', 'numero_parte' => 'CHP-901', 'precio_referencia' => 800.00, 'stock_actual' => 3, 'stock_minimo' => 2, 'stock_maximo' => 6, 'validar_limites' => 1],
            ['nombre_normalizado' => 'Filtros de aceite LF9009', 'categoria' => 'Filtros', 'numero_parte' => 'FIL-0021', 'precio_referencia' => 950.00, 'stock_actual' => 12, 'stock_minimo' => 6, 'stock_maximo' => 24, 'validar_limites' => 1],
            ['nombre_normalizado' => 'Filtro de combustible FS1000', 'categoria' => 'Filtros', 'numero_parte' => 'FS-1000', 'precio_referencia' => 680.00, 'stock_actual' => 10, 'stock_minimo' => 5, 'stock_maximo' => 20, 'validar_limites' => 1],
            ['nombre_normalizado' => 'Wiper completo 24 pulg', 'categoria' => 'Otros', 'numero_parte' => 'WIP-24', 'precio_referencia' => 1200.00, 'stock_actual' => 4, 'stock_minimo' => 2, 'stock_maximo' => 8, 'validar_limites' => 1],
            ['nombre_normalizado' => 'Alternador Delco Remy 24V', 'categoria' => 'Eléctrico', 'numero_parte' => 'ALT-7743', 'precio_referencia' => 3200.00, 'stock_actual' => 2, 'stock_minimo' => 1, 'stock_maximo' => 4, 'validar_limites' => 1],
            // Piezas de stock categoría Yonke (piezas reutilizadas de tractos donantes en patio)
            ['nombre_normalizado' => 'Marcha de Arranque Cummins (Yonke)', 'categoria' => 'Yonke', 'numero_parte' => 'YK-MAR-01', 'precio_referencia' => 2600.00, 'stock_actual' => 2, 'stock_minimo' => 1, 'stock_maximo' => 4, 'validar_limites' => 0],
            ['nombre_normalizado' => 'Alternador 24V Reutilizado (Yonke WH-099)', 'categoria' => 'Yonke', 'numero_parte' => 'YK-ALT-02', 'precio_referencia' => 3200.00, 'stock_actual' => 1, 'stock_minimo' => 1, 'stock_maximo' => 3, 'validar_limites' => 0],
            ['nombre_normalizado' => 'Radiador de Aluminio Donante (Yonke WH-098)', 'categoria' => 'Yonke', 'numero_parte' => 'YK-RAD-03', 'precio_referencia' => 4500.00, 'stock_actual' => 1, 'stock_minimo' => 1, 'stock_maximo' => 2, 'validar_limites' => 0],
            ['nombre_normalizado' => 'Compresor de Aire Bendix (Yonke WH-099)', 'categoria' => 'Yonke', 'numero_parte' => 'YK-CMP-04', 'precio_referencia' => 3800.00, 'stock_actual' => 2, 'stock_minimo' => 1, 'stock_maximo' => 3, 'validar_limites' => 0],
        ];

        $this->db->table('catalogo_piezas')->insertBatch($piezas);
    }
}
