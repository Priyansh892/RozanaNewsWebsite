import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule, NgForm } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [FormsModule, NgIf, NgClass],
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  registrationSuccess = false;
  registrationError = '';
  submitted = false;
  passwordMismatch = false;
  isLoading = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit(registerForm: NgForm) {
    this.submitted = true;
    this.registrationError = '';
    this.passwordMismatch = this.password !== this.confirmPassword;

    if (registerForm.invalid || this.passwordMismatch) return;

    this.isLoading = true;

    this.authService
      .register(this.username, this.password, this.email)
      .subscribe({
        next: () => {
          this.registrationSuccess = true;
          this.isLoading = false;
          setTimeout(
            () => this.router.navigate(['/onboarding'], { replaceUrl: true }),
            1000,
          );
        },
        error: (error) => {
          this.isLoading = false;
          if (error.status === 400) {
            this.registrationError =
              error.error?.message ||
              'Registration failed. Please check your details.';
          } else if (error.status === 500) {
            this.registrationError =
              'An unexpected server error occurred. Please try again later.';
          } else {
            this.registrationError = 'Something went wrong. Please try again.';
          }
        },
      });
  }

  loginWithGoogle(): void {
    this.authService.initiateGoogleOAuth();
  }

  redirectToLogin(): void {
    this.router.navigate(['/login']);
  }

  get alertClass(): string {
    if (this.registrationSuccess) return 'alert alert-success';
    if (this.registrationError) return 'alert alert-danger';
    return '';
  }
}