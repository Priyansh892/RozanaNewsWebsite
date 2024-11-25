import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth'; // Adjust API URL as needed
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private cookieService = inject(CookieService);
  private loggedIn = false;
  private router = inject(Router);

  constructor(private http: HttpClient) {
    // Initialize the currentUserSubject and loggedIn status from cookies if available
    const userDetails = this.cookieService.get('userDetails');
    this.loggedIn = !!userDetails; // Set loggedIn based on presence of userDetails in cookies
    this.currentUserSubject = new BehaviorSubject<any>(userDetails ? JSON.parse(userDetails) : null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  register(username: string, password: string, email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, { username, password, email })
      .pipe(
        tap(response => {
          // Store token and user details in cookies
          this.cookieService.set('token', response.token, 1, '/'); // 1 day expiry
          this.cookieService.set('userDetails', JSON.stringify({ username, email: response.user.email }), 1, '/');
          this.loggedIn = true;
          this.currentUserSubject.next({ username, email: response.user.email });
        })
      );
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          // Store token and user details in cookies
          this.cookieService.set('token', response.token, 1, '/'); // 1 day expiry
          this.cookieService.set('userDetails', JSON.stringify({ username, email: response.user.email }), 1, '/');
          this.loggedIn = true;
          this.currentUserSubject.next({ username, email: response.user.email });
        })
      );
  }

  // logout(): void {
  //   this.http.post<any>(`${this.apiUrl}/logout`, {}).subscribe(() => {
  //     // Clear the cookies
  //     this.cookieService.delete('token', '/');
  //     this.cookieService.delete('userDetails', '/');
  //     this.loggedIn = false;
  //     this.currentUserSubject.next(null);
  //     this.router.navigate(['/login']);
  //   });
  // }

  logout(): void {
    this.http.post<void>(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => {
        // Clear the cookies
        this.cookieService.delete('authToken', '/');
        this.cookieService.delete('userDetails', '/');
  
        // Update local state
        this.loggedIn = false;
        this.currentUserSubject.next(null);
  
        // Redirect to the login page
        this.router.navigate(['/login']);
      },
      error: (err) => {
        // Handle errors if needed
        console.error('Logout failed', err);
      }
    });
  }
  
  

  resetPassword(username: string, newPassword: string, confirmPassword: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forgot-password`, { username, newPassword, confirmPassword });
  }

  isLoggedIn(): boolean {
    // Check the loggedIn status and cookies to determine if the user is logged in
    return this.loggedIn || !!this.cookieService.get('userDetails');
  }

  getUsername(): string {
    // Return the username from the cookies
    const userDetails = this.cookieService.get('userDetails');
    return userDetails ? JSON.parse(userDetails).username : '';
  }
}