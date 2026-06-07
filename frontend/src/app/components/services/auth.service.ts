import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SavedNewsService } from './saved-news.service';
import { UserService } from './user.service';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';

  private http = inject(HttpClient);
  private router = inject(Router);
  private cookieService = inject(CookieService);
  private savedNewsService = inject(SavedNewsService);
  private userService = inject(UserService);
  private platformId = inject(PLATFORM_ID);

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private loggedIn = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const userDetails = this.cookieService.get('userDetails');
      if (userDetails) {
        try {
          const parsed = JSON.parse(userDetails);
          this.loggedIn = true;
          this.currentUserSubject.next(parsed);
        } catch {
          // corrupt cookie - clear it
          this.cookieService.delete('userDetails', '/');
        }
      }
    }
  }

  get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  // No client-side SHA-256 hashing - bcrypt over HTTPS is sufficient and correct.
  // Sending a SHA-256 hash as the "password" doesn't improve security because the hash
  // itself becomes the credential. If intercepted, it could be replayed. bcrypt on the
  // server side (over HTTPS) is the correct and complete solution.
  register(username: string, password: string, email: string): Observable<any> {
    return this.http
      .post<any>(
        `${this.apiUrl}/register`,
        { username, password, email },
        { withCredentials: true },
      )
      .pipe(
        tap((response) => {
          this.onAuthSuccess(response.user);
        }),
      );
  }

  login(username: string, password: string): Observable<any> {
    return this.http
      .post<any>(
        `${this.apiUrl}/login`,
        { username, password },
        { withCredentials: true },
      )
      .pipe(
        tap((response) => {
          this.onAuthSuccess(response.user);
        }),
      );
  }

  logout(): void {
    this.http
      .post<void>(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .subscribe({
        next: () => this.clearSession(),
        error: (err) => {
          console.error('Logout failed', err);
          // Clear local session even if server call fails
          this.clearSession();
        },
      });
  }

  // Called by the interceptor when refresh fails - clears session without making server call
  forceLogout(): void {
    this.clearSession();
  }

  // Fixed: consistent behavior in both browser and SSR environments.
  // Previously the SSR branch sent plaintext passwords while the browser branch hashed them.
  // Now both environments send plaintext - password security is handled entirely server-side by bcrypt.
  resetPassword(
    username: string,
    newPassword: string,
    confirmPassword: string,
  ): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/forgot-password`,
      { username, newPassword, confirmPassword },
      { withCredentials: true },
    );
  }

  // Called by AuthInterceptor to rotate tokens when access token expires
  refreshTokens(): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/refresh-token`,
      {},
      { withCredentials: true },
    );
  }

  // isLoggedIn now also validates that the actual auth state is consistent.
  // If userDetails cookie exists but loggedIn flag is false (e.g. after SSR hydration),
  // we restore state from the cookie.
  isLoggedIn(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    if (this.loggedIn) return true;

    // Fallback: try to restore from cookie on page refresh
    const userDetails = this.cookieService.get('userDetails');
    if (userDetails) {
      try {
        const parsed = JSON.parse(userDetails);
        this.loggedIn = true;
        this.currentUserSubject.next(parsed);
        return true;
      } catch {
        this.cookieService.delete('userDetails', '/');
      }
    }
    return false;
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
    this.loggedIn = true;
    this.currentUserSubject.next(user);
  }

  private clearSession(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cookieService.delete('userDetails', '/');
    }
    this.loggedIn = false;
    this.currentUserSubject.next(null);
    // Clear saved IDs cache on logout so next user starts fresh
    this.savedNewsService.clearState();
    this.userService.clearState();
    this.router.navigate(['/login']);
  }
}
