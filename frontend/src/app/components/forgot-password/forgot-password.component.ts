import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  standalone: true,
  imports: [FormsModule, NgIf, NgClass],
})
export class ForgotPasswordComponent {
  username = '';
  newPassword = '';
  confirmPassword = '';
  submitted = false;
  passwordMismatch = false;
  resetSuccess = false;
  resetError = '';
  isLoading = false;
  showLoginPrompt = false; // shown when password is same as current
  newsLoginImage = 'assets/newsLogin.png';

  // All injected via inject() consistently — no mixed constructor/inject styles
  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit(form: NgForm) {
    this.submitted = true;
    this.resetError = '';
    this.showLoginPrompt = false;

    // Fixed: only flag mismatch when confirmPassword is actually filled in
    // Previously '' !== 'something' was true, triggering both "field required"
    // and "passwords do not match" errors simultaneously
    this.passwordMismatch =
      this.confirmPassword.length > 0 &&
      this.newPassword !== this.confirmPassword;

    if (form.invalid || this.passwordMismatch) return;

    this.isLoading = true;

    this.authService
      .resetPassword(this.username, this.newPassword, this.confirmPassword)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.resetSuccess = true;
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (error) => {
          this.isLoading = false;
          if (error.status === 404) {
            this.resetError = 'No account found with that username.';
          } else if (error.status === 409) {
            // backend now returns 409 when new password == current password
            this.resetError =
              'This password is already in use for your account.';
            this.showLoginPrompt = true;
          } else if (error.status === 400) {
            this.resetError =
              error.error?.message ||
              'Invalid request. Please check your details.';
          } else {
            this.resetError = 'Password reset failed. Please try again.';
          }
        },
      });
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
  navigateToRegister() {
    this.router.navigate(['/register']);
  }
  get alertClass() {
    if (this.resetSuccess) return 'alert alert-success';
    if (this.resetError) return 'alert alert-danger';
    return '';
  }
}
