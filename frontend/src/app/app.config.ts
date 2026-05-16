import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { routes } from './app.routes';
import { AuthInterceptor } from './components/interceptors/auth.interceptor';

// Register AuthInterceptor here so it applies globally to all HttpClient requests.
// This is what enables automatic token refresh on 401 "Access token expired" responses
// without any component needing to handle that logic manually.
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
};
