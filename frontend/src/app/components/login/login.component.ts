import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule, NgForm } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  // Removed `providers: [AuthService]` — it was creating a component-scoped instance
  // separate from the root instance, causing loggedIn state and BehaviorSubject to be
  // out of sync with the rest of the app. AuthService is providedIn: 'root' and should
  // be injected from the root injector everywhere.
  imports: [FormsModule, NgIf, NgClass],
})
export class LoginComponent {
  username = '';
  password = '';
  newsLoginImage = 'assets/newsLogin.png';
  errorMessage = '';
  success = false;
  isLoading = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  login(form: NgForm) {
    if (form.invalid) return;

    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.success = true;
        this.isLoading = false;
        this.router.navigate(['/all-news']);
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 400) {
          this.errorMessage =
            error.error?.message || 'Please fill in all required fields.';
        } else if (error.status === 401) {
          this.errorMessage = 'Invalid username or password. Please try again.';
        } else if (error.status === 500) {
          this.errorMessage =
            'An unexpected server error occurred. Please try again later.';
        } else {
          this.errorMessage = 'Something went wrong. Please try again.';
        }
      },
    });
  }

  forgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  get alertClass() {
    if (this.success) return 'alert alert-success';
    if (this.errorMessage) return 'alert alert-danger';
    return '';
  }
}
