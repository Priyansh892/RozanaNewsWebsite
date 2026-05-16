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

  // Prevents multiple simultaneous refresh calls
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<boolean | null>(null);

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    // Skip the refresh endpoint itself to avoid infinite loops
    if (req.url.includes('/refresh-token')) {
      return next.handle(req);
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && isPlatformBrowser(this.platformId)) {
          // Distinguish between "token expired" and other 401s
          const isExpired = error.error?.error === 'Access token expired';
          if (isExpired) {
            return this.handle401WithRefresh(req, next);
          }
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
      this.refreshTokenSubject.next(null); // signal: refresh in progress

      return this.authService.refreshTokens().pipe(
        switchMap(() => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(true); // signal: refresh done
          // Retry the original request — cookies are updated server-side
          return next.handle(req);
        }),
        catchError((refreshError) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(false);
          // Refresh failed — force logout and redirect
          this.authService.forceLogout();
          this.router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
      );
    }

    // Another request already triggered a refresh — wait for it to complete
    return this.refreshTokenSubject.pipe(
      filter((result) => result !== null),
      take(1),
      switchMap((success) => {
        if (success) {
          return next.handle(req); // retry with updated cookies
        }
        return throwError(() => new Error('Token refresh failed'));
      }),
    );
  }
}
