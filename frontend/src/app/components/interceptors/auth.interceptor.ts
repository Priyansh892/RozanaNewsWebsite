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
    // Skip refresh endpoint to avoid infinite loop
    if (req.url.includes('/refresh-token')) {
      return next.handle(req);
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && isPlatformBrowser(this.platformId)) {
          const errorMsg = error.error?.error || '';

          if (errorMsg === 'Access token expired') {
            // ✅ Token expired - try to refresh silently then retry
            return this.handle401WithRefresh(req, next);
          }

          // ✅ Any other 401 (missing token, invalid token, user not found)
          // means the session is unrecoverable - force logout immediately
          // Previously these were just re-thrown and nothing happened
          this.forceLogoutAndRedirect();
          return throwError(() => error);
        }

        return throwError(() => error);
      }),
    );
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
          return next.handle(req);
        }),
        catchError((refreshError) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(false);
          // ✅ Refresh also failed - session fully expired, force logout
          this.forceLogoutAndRedirect();
          return throwError(() => refreshError);
        }),
      );
    }

    // Another request already triggered refresh - wait for result
    return this.refreshTokenSubject.pipe(
      filter((result) => result !== null),
      take(1),
      switchMap((success) => {
        if (success) {
          return next.handle(req);
        }
        // ✅ Refresh completed but failed - redirect
        this.forceLogoutAndRedirect();
        return throwError(() => new Error('Token refresh failed'));
      }),
    );
  }

  // ✅ Single place that handles all unrecoverable auth failures
  // Clears local session state + saved IDs cache + redirects to login
  private forceLogoutAndRedirect(): void {
    this.authService.forceLogout();
    this.router.navigate(['/login']);
  }
}
