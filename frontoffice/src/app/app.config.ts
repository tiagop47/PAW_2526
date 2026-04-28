import { ApplicationConfig, provideZoneChangeDetection, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth-interceptor';
import { routes } from './app.routes';

export const BASE_URL = 'http://localhost:3000';
export const API_URL = `${BASE_URL}/api`;

/**
 * Converte caminhos relativos de imagem em URLs absolutas.
 * Centraliza a lógica usada por ProductService e OrderService.
 */
export function formatImageUrl(path: string | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${BASE_URL}${path}`;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
};
