
import { Component,inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';
import { AuthService } from '../services/auth.service';
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  standalone:true,
  imports:[FormsModule,NgIf,NgClass,ReactiveFormsModule]
})
export class ForgotPasswordComponent {
  username: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  submitted: boolean = false;
  passwordMismatch: boolean = false;
  resetSuccess: boolean = false;
  resetError: string | null = null;
  newsLoginImage='assets/newsLogin.png';
  private authService = inject(AuthService);

  constructor(private router: Router, private http: HttpClient) {}

  onSubmit(form: any) {
    this.submitted = true;
    this.passwordMismatch = this.newPassword !== this.confirmPassword;
  
    if (form.invalid || this.passwordMismatch) {
      return;
    }
    this.authService.resetPassword(this.username, this.newPassword, this.confirmPassword).subscribe(
      (response: any) => {
        this.resetSuccess = true;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      (error) => {
        if (error.status === 404) {
          this.resetError = "User not found.";
        } else if (error.status === 400) {
          this.resetError = error.error.message || "Invalid request.";
        } else {
          this.resetError = "Password reset failed. Please try again.";
        }
      }
    );
  }
  navigateToRegister() {
    // Navigate to the registration page
    this.router.navigate(['/register']);
  }
  get alertClass() {
    if (this.resetSuccess) {
      return 'alert alert-success';
    } else if (this.resetError) {
      return 'alert alert-danger';
    }
    return '';
  }
  
  
}

