<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use App\Exceptions\ConflictoException;
use App\Exceptions\NoEncontradoException;
use App\Exceptions\ValidacionException;
use App\Libraries\ActorActual;
use App\Libraries\RespuestasApi;
use App\Services\RequisicionService;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Panel de Compras (doc 05 §6). RF-COM-01..04.
 */
final class ComprasController extends BaseController
{
    public function index(): ResponseInterface
    {
        $request = $this->request;
        $estado  = null;
        $pagina  = 1;
        $porPag  = 100;
        if ($request instanceof IncomingRequest) {
            $valor  = $request->getGet('estado');
            $estado = is_string($valor) && $valor !== '' ? $valor : null;
            $pagina = max(1, (int) ($request->getGet('page') ?? 1));
            $porPag = min(200, max(1, (int) ($request->getGet('per_page') ?? 100)));
        }

        if ($estado === 'Todas') $estado = null;
        if ($estado !== null && ! in_array($estado, ['Solicitado', 'En aprobación', 'En pago', 'En recolección', 'Más información', 'Cancelado', 'Rechazado', 'Instalado', 'Cotizado', 'Comprado', 'En trayecto'], true)) {
            return RespuestasApi::error(422, 'validation', 'Estado de requisición inválido.', ['estado' => ['in_list']]);
        }

        return $this->response->setJSON([
            'data' => (new RequisicionService())->listarCola($estado, $pagina, $porPag),
            'meta' => ['page' => $pagina, 'per_page' => $porPag],
        ]);
    }

    // TKT-WAR-102: Buscador rápido de estatus de compras por ID o número económico
    public function buscar(): ResponseInterface
    {
        $request = $this->request;
        $q = $request instanceof \CodeIgniter\HTTP\IncomingRequest ? $request->getGet('q') : '';
        $q = trim((string)$q);

        if ($q === '') {
            return $this->response->setJSON([]);
        }

        $db = \Config\Database::connect();
        $builder = $db->table('requisiciones req')
            ->select('req.*, u.numero_economico as unidad, u.placas as placas')
            ->join('unidades u', 'u.id = req.unidad_id', 'left')
            ->groupStart()
                ->like('req.id', $q)
                ->orLike('u.numero_economico', $q)
                ->orLike('req.justificacion', $q)
            ->groupEnd()
            ->orderBy('req.created_at', 'DESC')
            ->limit(20);

        return $this->response->setJSON($builder->get()->getResultArray());
    }

    public function estado(int $id): ResponseInterface
    {
        $request = $this->request;
        $cambio  = [];
        $fileC = null;
        $fileF = null;
        if ($request instanceof IncomingRequest) {
            $json = $request->getJSON(true);
            if (is_array($json)) {
                $cambio = $json;
            } else {
                $cambio = $request->getPost();
            }
            $fileC = $request->getFile('archivo_cotizacion');
            $fileF = $request->getFile('archivo_factura');
        }

        if (! $this->validateData($cambio, [
            'estado'         => 'required|in_list[Solicitado,En aprobación,En pago,En recolección,Más información,Cancelado,Rechazado,Instalado,Cotizado,Comprado,En trayecto]',
            'costo_real'     => 'permit_empty|decimal|greater_than[0]',
            'numero_factura' => 'permit_empty|string|max_length[80]',
            'motivo'         => 'permit_empty|string|max_length[500]',
            'proveedor'      => 'permit_empty|string|max_length[150]',
            'es_caja_chica'  => 'permit_empty|in_list[0,1]',
            'factura_xml'    => 'permit_empty|string|max_length[255]',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];

            return RespuestasApi::error(422, 'validation', 'Cambio de estado inválido.', array_map(static fn (string $e): array => [$e], $errores));
        }

        try {
            $requisicion = (new RequisicionService())->avanzarEstado($id, $cambio, ActorActual::usuario());
        } catch (ValidacionException $e) {
            return RespuestasApi::error(422, 'validation', $e->getMessage(), array_filter($e->fields));
        } catch (ConflictoException $e) {
            return RespuestasApi::error(409, 'conflict', $e->getMessage());
        } catch (NoEncontradoException $e) {
            return RespuestasApi::error(404, 'not_found', $e->getMessage());
        }

        return $this->response->setJSON($requisicion);
    }

    public function revertir(int $id): ResponseInterface
    {
        $request = $this->request;
        $datos   = $request instanceof IncomingRequest ? (array) $request->getJSON(true) : [];

        if (! $this->validateData($datos, [
            'motivo' => 'required|string|min_length[5]|max_length[500]',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];
            return RespuestasApi::error(422, 'validation', 'Motivo de reversión inválido.', array_map(static fn (string $e): array => [$e], $errores));
        }

        try {
            $requisicion = (new RequisicionService())->revertirAceptacion($id, (string) $datos['motivo'], ActorActual::usuario());
        } catch (ConflictoException $e) {
            return RespuestasApi::error(409, 'conflict', $e->getMessage());
        } catch (NoEncontradoException $e) {
            return RespuestasApi::error(404, 'not_found', $e->getMessage());
        }

        return $this->response->setJSON($requisicion);
    }
}
