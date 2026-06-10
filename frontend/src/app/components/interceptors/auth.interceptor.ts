import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<boolean | null>(null);

 intercept(
  req: HttpRequest<any>,
  next: HttpHandler,
): Observable<HttpEvent<any>> {
  // Skip during SSR — AuthService has no tokens on the server
  if (!isPlatformBrowser(this.platformId)) {
    return next.handle(req);
  }

  // Refresh endpoint sends the HttpOnly cookie automatically via withCredentials
  // Don't add Bearer token to it — there's no accessToken yet at that point
  if (req.url.includes('/refresh-token')) {
    return next.handle(req);
  }

  // Attach accessToken from memory as Bearer token on every other request
  const reqWithAuth = this.addAuthHeader(req);

  return next.handle(reqWithAuth).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isPlatformBrowser(this.platformId)) {
        const errorMsg = error.error?.error || '';

        if (errorMsg === 'Access token expired') {
          return this.handle401WithRefresh(reqWithAuth, next);
        }

        this.forceLogoutAndRedirect();
        return throwError(() => error);
      }

      return throwError(() => error);
    }),
  );
}

  private addAuthHeader(req: HttpRequest<any>): HttpRequest<any> {
  console.log('AuthService instance:', this.authService);
  console.log('getAccessToken exists:', typeof this.authService.getAccessToken);
  
  // Guard against SSR empty proxy object
  if (!this.authService || typeof this.authService.getAccessToken !== 'function') {
    return req;
  }
  
  const token = this.authService.getAccessToken();
  if (!token) return req;
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

  private handle401WithRefresh(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshTokens().pipe(
        switchMap(() => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(true);
          // Retry original request with new accessToken
          return next.handle(this.addAuthHeader(req));
        }),
        catchError((refreshError) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(false);
          this.forceLogoutAndRedirect();
          return throwError(() => refreshError);
        }),
      );
    }

    return this.refreshTokenSubject.pipe(
      filter((result) => result !== null),
      take(1),
      switchMap((success) => {
        if (success) {
          return next.handle(this.addAuthHeader(req));
        }
        this.forceLogoutAndRedirect();
        return throwError(() => new Error('Token refresh failed'));
      }),
    );
  }

  private forceLogoutAndRedirect(): void {
    this.authService.forceLogout();
    this.router.navigate(['/login']);
  }
}