import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
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
  private platformId = inject(PLATFORM_ID);

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private loggedIn = false;

  constructor() {
    // ✅ Only run cookie logic in the browser
    if (isPlatformBrowser(this.platformId)) {
      const userDetails = this.cookieService.get('userDetails');
      if (userDetails) {
        const parsed = JSON.parse(userDetails);
        this.loggedIn = true;
        this.currentUserSubject.next(parsed);
      }
    }
  }

  get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  register(username: string, password: string, email: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/register`, { username, password, email })
      .pipe(
        tap((response) => {
          if (isPlatformBrowser(this.platformId)) {
            this.cookieService.set('token', response.token, 1, '/');
            this.cookieService.set(
              'userDetails',
              JSON.stringify({ username, email: response.user.email }),
              1,
              '/',
            );
          }

          this.loggedIn = true;
          this.currentUserSubject.next({
            username,
            email: response.user.email,
          });
        }),
      );
  }

  login(username: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap((response) => {
          if (isPlatformBrowser(this.platformId)) {
            this.cookieService.set('token', response.token, 1, '/');
            this.cookieService.set(
              'userDetails',
              JSON.stringify({ username, email: response.user.email }),
              1,
              '/',
            );
          }

          this.loggedIn = true;
          this.currentUserSubject.next({
            username,
            email: response.user.email,
          });
        }),
      );
  }

  logout(): void {
    this.http.post<void>(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => {
        if (isPlatformBrowser(this.platformId)) {
          this.cookieService.delete('token', '/');
          this.cookieService.delete('userDetails', '/');
        }

        this.loggedIn = false;
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout failed', err);
      },
    });
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

  isLoggedIn(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return this.loggedIn || !!this.cookieService.get('userDetails');
  }

  getUsername(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return '';
    }

    const userDetails = this.cookieService.get('userDetails');
    return userDetails ? JSON.parse(userDetails).username : '';
  }
}
