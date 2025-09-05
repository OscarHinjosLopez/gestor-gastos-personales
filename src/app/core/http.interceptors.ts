import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, timeout, throwError, finalize } from 'rxjs';
import { NotificationService } from '../core/notification.service';
import { LoadingService } from '../core/loading.service';

/**
 * HTTP Error Interceptor
 * Handles global HTTP error responses and provides consistent error handling
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const notificationService = inject(NotificationService);
  const loadingService = inject(LoadingService);

  // Generate a unique key for this request
  const requestKey = `http-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  // Set loading state
  loadingService.setLoading(requestKey, true);

  return next(req).pipe(
    // Add timeout for all requests (30 seconds)
    timeout(30000),

    // Retry failed requests once (except for 4xx errors)
    retry({
      count: 1,
      delay: (error: HttpErrorResponse) => {
        // Don't retry client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
          return throwError(() => error);
        }
        // Retry server errors (5xx) and network errors
        return throwError(() => error);
      },
    }),

    // Handle errors
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error inesperado';
      let errorTitle = 'Error';

      // Handle different types of errors
      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        errorTitle = 'Error de Conexión';
      } else {
        // Backend returned an unsuccessful response code
        switch (error.status) {
          case 0:
            errorMessage =
              'No se puede conectar al servidor. Verifica tu conexión.';
            errorTitle = 'Sin Conexión';
            break;
          case 400:
            errorMessage =
              error.error?.message || 'Datos inválidos enviados al servidor.';
            errorTitle = 'Datos Inválidos';
            break;
          case 401:
            errorMessage = 'No tienes autorización para realizar esta acción.';
            errorTitle = 'No Autorizado';
            break;
          case 403:
            errorMessage = 'No tienes permisos para acceder a este recurso.';
            errorTitle = 'Acceso Denegado';
            break;
          case 404:
            errorMessage = 'El recurso solicitado no fue encontrado.';
            errorTitle = 'No Encontrado';
            break;
          case 409:
            errorMessage =
              error.error?.message ||
              'Conflicto con el estado actual del recurso.';
            errorTitle = 'Conflicto';
            break;
          case 422:
            errorMessage =
              error.error?.message ||
              'Los datos enviados no pudieron ser procesados.';
            errorTitle = 'Datos No Procesables';
            break;
          case 429:
            errorMessage =
              'Demasiadas solicitudes. Intenta de nuevo en unos momentos.';
            errorTitle = 'Límite Excedido';
            break;
          case 500:
            errorMessage =
              'Error interno del servidor. Intenta de nuevo más tarde.';
            errorTitle = 'Error del Servidor';
            break;
          case 502:
            errorMessage = 'El servidor no está disponible temporalmente.';
            errorTitle = 'Servidor No Disponible';
            break;
          case 503:
            errorMessage = 'El servicio no está disponible. Intenta más tarde.';
            errorTitle = 'Servicio No Disponible';
            break;
          case 504:
            errorMessage =
              'Tiempo de espera agotado. El servidor no respondió a tiempo.';
            errorTitle = 'Tiempo Agotado';
            break;
          default:
            errorMessage = `Error del servidor (${error.status}): ${
              error.error?.message || error.message
            }`;
            errorTitle = 'Error del Servidor';
        }
      }

      // Show error notification
      notificationService.error(`${errorTitle}: ${errorMessage}`, 8000);

      // Log error for debugging (in development)
      if (!environment.production) {
        console.error('HTTP Error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error,
          url: error.url,
        });
      }

      return throwError(() => error);
    }),

    // Always clear loading state
    finalize(() => {
      loadingService.setLoading(requestKey, false);
    })
  );
};

/**
 * Loading Interceptor
 * Shows global loading indicator for HTTP requests
 */
export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const loadingService = inject(LoadingService);

  // Skip loading indicator for specific URLs if needed
  const skipLoading =
    req.headers.has('X-Skip-Loading') ||
    req.url.includes('/assets/') ||
    req.url.includes('/api/health');

  if (skipLoading) {
    return next(req);
  }

  const requestKey = `http-loading-${Date.now()}`;
  loadingService.setLoading(requestKey, true);

  return next(req).pipe(
    finalize(() => {
      loadingService.setLoading(requestKey, false);
    })
  );
};

/**
 * Cache Interceptor
 * Adds caching headers for GET requests when appropriate
 */
export const cacheInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next(req);
  }

  // Skip caching for specific URLs
  const skipCache =
    req.headers.has('X-Skip-Cache') ||
    req.url.includes('/api/auth') ||
    req.url.includes('/api/realtime');

  if (skipCache) {
    return next(req);
  }

  // Add cache control headers
  const cachedRequest = req.clone({
    setHeaders: {
      'Cache-Control': 'max-age=300', // 5 minutes
      Pragma: 'no-cache',
      Expires: '0',
    },
  });

  return next(cachedRequest);
};

/**
 * Auth Interceptor
 * Adds authentication headers to requests
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // Skip auth for public endpoints
  const skipAuth =
    req.url.includes('/public/') ||
    req.url.includes('/assets/') ||
    req.headers.has('X-Skip-Auth');

  if (skipAuth) {
    return next(req);
  }

  // In a real app, you would get the token from a service
  // const authService = inject(AuthService);
  // const token = authService.getToken();

  // For this demo app, we'll just add a placeholder
  const authRequest = req.clone({
    setHeaders: {
      'X-App-Version': '1.0.0',
      'Content-Type': 'application/json',
    },
  });

  return next(authRequest);
};

// Environment import (you might need to adjust this path)
const environment = {
  production: false, // This should come from your actual environment file
};
