import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SavedNewsService } from './saved-news.service';
import { UserService } from './user.service';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  private http = inject(HttpClient);
  private router = inject(Router);
  private cookieService = inject(CookieService);
  private savedNewsService = inject(SavedNewsService);
  private userService = inject(UserService);
  private platformId = inject(PLATFORM_ID);

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // accessToken lives only in memory — never in localStorage/cookie
  // Avoids XSS risks and third-party cookie blocking
  private accessToken: string | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const userDetails = this.cookieService.get('userDetails');
      if (userDetails) {
        try {
          const parsed = JSON.parse(userDetails);
          this.currentUserSubject.next(parsed);
          // Silently get a new accessToken on page load using the refreshToken cookie
          this.refreshTokens().subscribe({
            error: () => this.clearSession(),
          });
        } catch {
          this.cookieService.delete('userDetails', '/');
        }
      }
    }
  }

  get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  // Used by AuthInterceptor to attach Bearer token to every request
  getAccessToken(): string | null {
    return this.accessToken;
  }

  register(username: string, password: string, email: string): Observable<any> {
    return this.http
      .post<any>(
        `${this.apiUrl}/register`,
        { username, password, email },
        // { withCredentials: true },
      )
      .pipe(
        tap((response) => {
          this.accessToken = response.accessToken;
          this.onAuthSuccess(response.user);
        }),
      );
  }

  login(username: string, password: string): Observable<any> {
    return this.http
      .post<any>(
        `${this.apiUrl}/login`,
        { username, password },
        // { withCredentials: true },
      )
      .pipe(
        tap((response) => {
          this.accessToken = response.accessToken;
          this.onAuthSuccess(response.user);
        }),
      );
  }

  logout(): void {
    this.http
      .post<void>(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .subscribe({
        next: () => this.clearSession(),
        error: () => this.clearSession(),
      });
  }

  forceLogout(): void {
    this.clearSession();
  }

  resetPassword(
    username: string,
    newPassword: string,
    confirmPassword: string,
  ): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forgot-password`, {
      username,
      newPassword,
      confirmPassword,
    });
  }

  // refreshToken cookie is HttpOnly — browser sends it automatically on withCredentials: true
  // Response contains new accessToken which we store in memory
  refreshTokens(): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/refresh-token`, {}, { withCredentials: true })
      .pipe(
        tap((response) => {
          this.accessToken = response.accessToken;
        }),
      );
  }

  // Called by GoogleCallbackComponent — accessToken comes in redirect query param
  handleGoogleCallback(
    encodedUser: string | null,
    accessToken: string | null,
  ): void {
    if (!encodedUser || !accessToken) {
      this.router.navigate(['/login'], {
        queryParams: { error: 'google_auth_failed' },
      });
      return;
    }
    try {
      const user = JSON.parse(atob(encodedUser));
      this.accessToken = accessToken;
      this.onAuthSuccess(user);
    //  this.router.navigate(['/onboarding'], { replaceUrl: true });
      this.router.navigate(['/all-news'], { replaceUrl: true });
    } catch {
      this.router.navigate(['/login'], {
        queryParams: { error: 'google_auth_failed' },
      });
    }
  }

   initiateGoogleOAuth(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = environment.googleAuthUrl;
    }
  }

  isLoggedIn(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return !!this.accessToken || !!this.cookieService.get('userDetails');
  }

  getUsername(): string {
    if (!isPlatformBrowser(this.platformId)) return '';
    const userDetails = this.cookieService.get('userDetails');
    return userDetails ? JSON.parse(userDetails).username : '';
  }

  private onAuthSuccess(user: any): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cookieService.set('userDetails', JSON.stringify(user), 7, '/');
    }
    this.currentUserSubject.next(user);
  }

  private clearSession(): void {
    this.accessToken = null;
    if (isPlatformBrowser(this.platformId)) {
      this.cookieService.delete('userDetails', '/');
    }
    this.currentUserSubject.next(null);
    this.savedNewsService.clearState();
    this.userService.clearState();
    this.router.navigate(['/login']);
  }
}
