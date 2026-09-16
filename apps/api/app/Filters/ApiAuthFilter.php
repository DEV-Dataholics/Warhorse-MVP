<?php

declare(strict_types=1);

namespace App\Filters;

use App\Libraries\ActorActual;
use App\Libraries\RespuestasApi;
use App\Services\CuentaService;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Shield\Authentication\Authenticators\AccessTokens;
use CodeIgniter\Shield\Entities\User;

/**
 * Filtro `api-auth` (doc 04 §3.1), stateless: verifica el Bearer token de
 * Shield en CADA request (validez, revocación y expiración) y exige que el
 * usuario de dominio siga activo. El rol se resuelve server-side.
 */
class ApiAuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        ActorActual::limpiar();

        $crudo = trim(str_ireplace('Bearer', '', $request->getHeaderLine('Authorization')));
        if ($crudo === '') {
            return RespuestasApi::error(401, 'unauthenticated', 'No autenticado.');
        }

        $autenticador = auth('tokens')->getAuthenticator();
        if (! $autenticador instanceof AccessTokens) {
            return RespuestasApi::error(401, 'unauthenticated', 'No autenticado.');
        }

        $resultado = $autenticador->check(['token' => $crudo]);
        if (! $resultado->isOK()) {
            return RespuestasApi::error(401, 'unauthenticated', 'No autenticado.');
        }

        $shield = $resultado->extraInfo();
        $email  = null;
        if ($shield instanceof User) {
            // Asegura que las identidades estén cargadas en la entidad User de Shield
            $shield->getIdentities();
            $email = $shield->email;
            if (! is_string($email) || $email === '') {
                foreach ($shield->getIdentities() as $ident) {
                    if ($ident->type === 'email_password' && is_string($ident->secret) && $ident->secret !== '') {
                        $email = $ident->secret;
                        break;
                    }
                }
            }
        }

        if (! is_string($email) || $email === '') {
            return RespuestasApi::error(401, 'unauthenticated', 'No autenticado.');
        }

        $usuario = (new CuentaService())->activoPorEmail($email);
        if ($usuario === null) {
            // Suspendido después de emitir el token → pierde acceso de inmediato
            return RespuestasApi::error(401, 'unauthenticated', 'No autenticado.');
        }

        // Comparte el actor de dominio con controladores y filtros posteriores
        ActorActual::establecer($usuario);

        return null;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        return null;
    }
}
