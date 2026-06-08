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
  imports: [FormsModule, NgIf, NgClass],
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  success = false;
  submitted = false;
  isLoading = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  login(form: NgForm) {
    this.submitted = true;
    if (form.invalid) return;

    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.success = true;
        this.isLoading = false;
        setTimeout(() => {
          this.router.navigate(['/all-news'], { replaceUrl: true });
        }, 800);
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
  loginWithGoogle(): void {
    this.isLoading = true;
    this.authService.initiateGoogleOAuth();
  }

  forgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  get alertClass(): string {
    if (this.success) return 'alert alert-success';
    if (this.errorMessage) return 'alert alert-danger';
    return '';
  }
}
