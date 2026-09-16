/**
 * Warhorse Runtime Guard & Performance Shield
 * 
 * Protege el runtime de la aplicación contra excepciones no controladas generadas por:
 * 1. Extensiones del navegador o DevTools (Core Web Vitals, Lighthouse, RUM, profilers).
 * 2. Scripts inyectados en máquinas virtuales (VMxxx) que intentan leer 'startTime' o 'reportAllChanges'
 *    en requestIdleCallback sin validar si las entradas de rendimiento son nulas o indefinidas.
 * 3. Race conditions en callbacks de inactividad asíncrona cuando las entradas son reseteadas durante
 *    navegaciones de SPA.
 */

if (typeof window !== 'undefined') {
  // 1. Blindaje de window.requestIdleCallback
  if ('requestIdleCallback' in window && typeof window.requestIdleCallback === 'function') {
    const originalRIC = window.requestIdleCallback.bind(window);

    window.requestIdleCallback = function (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions
    ): number {
      const safeCallback: IdleRequestCallback = (deadline: IdleDeadline) => {
        try {
          if (typeof callback === 'function') {
            callback(deadline);
          }
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          const errorStack = err instanceof Error ? err.stack || '' : '';

          // Si es el bug de web-vitals / trackers externos leyendo startTime sobre undefined
          if (
            errorMsg.includes('startTime') ||
            errorStack.includes('reportAllChanges') ||
            errorStack.includes('web-vitals') ||
            errorStack.includes('VM')
          ) {
            console.warn(
              '[Warhorse Guard] Excepción en tracker de métricas (requestIdleCallback) contenida con éxito:',
              errorMsg
            );
            return;
          }

          // Si es un error genuino ajeno a métricas, propagarlo
          throw err;
        }
      };

      return originalRIC(safeCallback, options);
    };
  }

  // 2. Interceptor global de errores no capturados provenientes de VMs dinámicas o scripts externos
  window.addEventListener(
    'error',
    (event: ErrorEvent) => {
      const msg = event.message || '';
      const file = event.filename || '';
      const stack = event.error?.stack || '';

      if (
        (msg.includes('startTime') || stack.includes('reportAllChanges')) &&
        (file.includes('VM') || !file || stack.includes('web-vitals') || stack.includes('requestIdleCallback'))
      ) {
        event.preventDefault();
        event.stopPropagation();
        console.warn(
          '[Warhorse Guard] Error de script externo VM/tracker neutralizado silenciosamente (TypeError startTime):',
          msg
        );
      }
    },
    true
  );
}

export {};
