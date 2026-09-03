<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use App\Libraries\RespuestasApi;
use App\Models\CatalogoPiezaModel;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\ResponseInterface;

final class AlmacenController extends BaseController
{
    public function articulos(): ResponseInterface
    {
        $model = new CatalogoPiezaModel();
        $articulos = $model->orderBy('nombre_normalizado', 'ASC')->findAll();
        
        return $this->response->setJSON([
            'data' => array_map(static fn (array $a): array => [
                'id'                 => (int) $a['id'],
                'nombre_normalizado' => (string) $a['nombre_normalizado'],
                'categoria'          => (string) ($a['categoria'] ?? 'Preventivos'),
                'numero_parte'       => $a['numero_parte'],
                'precio_referencia'  => $a['precio_referencia'] === null ? null : (float) $a['precio_referencia'],
                'stock_minimo'       => $a['stock_minimo'] === null ? null : (int) $a['stock_minimo'],
                'stock_maximo'       => $a['stock_maximo'] === null ? null : (int) $a['stock_maximo'],
                'stock_actual'       => isset($a['stock_actual']) ? (int) $a['stock_actual'] : 0,
                'validar_limites'    => isset($a['validar_limites']) ? (bool) $a['validar_limites'] : false,
            ], $articulos),
        ]);
    }

    public function crear(): ResponseInterface
    {
        $request = $this->request;
        $datos   = $request instanceof IncomingRequest ? (array) $request->getJSON(true) : [];

        if (! $this->validateData($datos, [
            'nombre_normalizado' => 'required|is_unique[catalogo_piezas.nombre_normalizado]|min_length[3]|max_length[180]',
            'categoria'          => 'required|in_list[Frenos,Suspensión,Preventivos,Filtros,Aceites,Otros,Yonke]',
            'unidad_donante_id'  => 'permit_empty|is_natural_no_zero',
            'numero_parte'       => 'permit_empty|max_length[80]',
            'precio_referencia'  => 'required|numeric|greater_than[0]',
            'stock_minimo'       => 'permit_empty|is_natural',
            'stock_maximo'       => 'permit_empty|is_natural',
            'stock_actual'       => 'permit_empty|is_natural',
            'validar_limites'    => 'permit_empty|in_list[0,1,true,false]',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];
            return RespuestasApi::error(422, 'validation', 'Datos de producto inválidos.', array_map(static fn (string $e): array => [$e], $errores));
        }

        $model = new CatalogoPiezaModel();
        
        $stockMin = isset($datos['stock_minimo']) && $datos['stock_minimo'] !== '' ? (int) $datos['stock_minimo'] : null;
        $stockMax = isset($datos['stock_maximo']) && $datos['stock_maximo'] !== '' ? (int) $datos['stock_maximo'] : null;
        $stockAct = isset($datos['stock_actual']) && $datos['stock_actual'] !== '' ? (int) $datos['stock_actual'] : 0;
        $validar  = isset($datos['validar_limites']) ? (int) filter_var($datos['validar_limites'], FILTER_VALIDATE_BOOLEAN) : 0;
        $categoria = $datos['categoria'] ?? 'Otros';
        $unidadDonanteId = isset($datos['unidad_donante_id']) && $datos['unidad_donante_id'] !== '' ? (int) $datos['unidad_donante_id'] : null;

        if ($categoria === 'Yonke' && empty($unidadDonanteId)) {
            return RespuestasApi::error(422, 'validation', 'La categoría Yonke obliga a registrar la unidad donante.', [['La categoría Yonke obliga a registrar la unidad donante.']]);
        }

        if ($stockMin !== null && $stockMax !== null && $stockMin > $stockMax) {
            return RespuestasApi::error(422, 'validation', 'El stock mínimo no puede ser mayor que el stock máximo.', ['stock_minimo' => ['El stock mínimo no puede ser mayor que el stock máximo.']]);
        }

        $id = $model->insert([
            'nombre_normalizado' => trim((string) $datos['nombre_normalizado']),
            'categoria'          => $datos['categoria'],
            'numero_parte'       => isset($datos['numero_parte']) && trim((string) $datos['numero_parte']) !== '' ? trim((string) $datos['numero_parte']) : null,
            'precio_referencia'  => (float) $datos['precio_referencia'],
            'stock_minimo'       => $stockMin,
            'stock_maximo'       => $stockMax,
            'stock_actual'       => $stockAct,
            'validar_limites'    => $validar,
        ]);

        if (! $id) {
            return RespuestasApi::error(500, 'server_error', 'No se pudo guardar el producto.');
        }

        // Check stock alert on creation if validation is active
        if ($validar === 1 && $stockMin !== null && $stockAct <= $stockMin) {
            $db = \Config\Database::connect();
            $db->table('notificaciones')->insert([
                'tipo'    => 'taller_alerta_stock',
                'mensaje' => sprintf('ALERTA DE STOCK: El artículo "%s" ha alcanzado o cruzado su stock mínimo configurado. Stock actual: %d (Mínimo: %d).', trim((string) $datos['nombre_normalizado']), $stockAct, $stockMin)
            ]);
        }

        $creado = $model->find($id);

        return $this->response->setStatusCode(21)
            ->setJSON([
                'id'                 => (int) $creado['id'],
                'nombre_normalizado' => (string) $creado['nombre_normalizado'],
                'numero_parte'       => $creado['numero_parte'],
                'precio_referencia'  => (float) $creado['precio_referencia'],
                'stock_minimo'       => $creado['stock_minimo'] === null ? null : (int) $creado['stock_minimo'],
                'stock_maximo'       => $creado['stock_maximo'] === null ? null : (int) $creado['stock_maximo'],
                'stock_actual'       => (int) $creado['stock_actual'],
                'validar_limites'    => (bool) $creado['validar_limites'],
            ]);
    }

    public function actualizar(int $id): ResponseInterface
    {
        $request = $this->request;
        $datos   = $request instanceof IncomingRequest ? (array) $request->getJSON(true) : [];

        if (! $this->validateData($datos, [
            'stock_minimo'    => 'permit_empty|is_natural',
            'stock_maximo'    => 'permit_empty|is_natural',
            'stock_actual'    => 'permit_empty|is_natural',
            'validar_limites' => 'permit_empty|in_list[0,1,true,false]',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];
            return RespuestasApi::error(422, 'validation', 'Datos de inventario inválidos.', array_map(static fn (string $e): array => [$e], $errores));
        }

        $model = new CatalogoPiezaModel();
        $articulo = $model->find($id);
        if ($articulo === null) {
            return RespuestasApi::error(404, 'not_found', 'Artículo no encontrado.');
        }

        $stockMin = isset($datos['stock_minimo']) && $datos['stock_minimo'] !== '' ? (int) $datos['stock_minimo'] : ($articulo['stock_minimo'] !== null ? (int) $articulo['stock_minimo'] : null);
        $stockMax = isset($datos['stock_maximo']) && $datos['stock_maximo'] !== '' ? (int) $datos['stock_maximo'] : ($articulo['stock_maximo'] !== null ? (int) $articulo['stock_maximo'] : null);
        $stockAct = isset($datos['stock_actual']) && $datos['stock_actual'] !== '' ? (int) $datos['stock_actual'] : (int) $articulo['stock_actual'];
        $validar  = isset($datos['validar_limites']) ? (int) filter_var($datos['validar_limites'], FILTER_VALIDATE_BOOLEAN) : (int) $articulo['validar_limites'];

        if ($stockMin !== null && $stockMax !== null && $stockMin > $stockMax) {
            return RespuestasApi::error(422, 'validation', 'El stock mínimo no puede ser mayor que el stock máximo.', ['stock_minimo' => ['El stock mínimo no puede ser mayor que el stock máximo.']]);
        }

        $model->update($id, [
            'stock_minimo'    => isset($datos['stock_minimo']) && $datos['stock_minimo'] !== '' ? (int) $datos['stock_minimo'] : null,
            'stock_maximo'    => isset($datos['stock_maximo']) && $datos['stock_maximo'] !== '' ? (int) $datos['stock_maximo'] : null,
            'stock_actual'    => $stockAct,
            'validar_limites' => $validar,
        ]);

        // Trigger stock warning alert if validation is enabled
        if ($validar === 1 && $stockMin !== null && $stockAct <= $stockMin) {
            $db = \Config\Database::connect();
            $db->table('notificaciones')->insert([
                'tipo'    => 'taller_alerta_stock',
                'mensaje' => sprintf('ALERTA DE STOCK: El artículo "%s" ha alcanzado o cruzado su stock mínimo configurado. Stock actual: %d (Mínimo: %d).', $articulo['nombre_normalizado'], $stockAct, $stockMin)
            ]);
        }

        $actualizado = $model->find($id);

        return $this->response->setJSON([
            'id'                 => (int) $actualizado['id'],
            'nombre_normalizado' => (string) $actualizado['nombre_normalizado'],
            'numero_parte'       => $actualizado['numero_parte'],
            'precio_referencia'  => $actualizado['precio_referencia'] === null ? null : (float) $actualizado['precio_referencia'],
            'stock_minimo'       => $actualizado['stock_minimo'] === null ? null : (int) $actualizado['stock_minimo'],
            'stock_maximo'       => $actualizado['stock_maximo'] === null ? null : (int) $actualizado['stock_maximo'],
            'stock_actual'       => (int) $actualizado['stock_actual'],
            'validar_limites'    => (bool) $actualizado['validar_limites'],
        ]);
    }
}
