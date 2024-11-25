import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule, NgForm } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [AuthService],
  imports: [FormsModule, NgIf,NgClass]
})
export class LoginComponent {
  username = '';
  password = '';
  newsLoginImage='assets/newsLogin.png';
  errorMessage = ''; // For storing error messages
  succcess=false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private cookieService= inject(CookieService);

  login(form: NgForm) {

    this.authService.login(this.username, this.password).subscribe(
      response => {
        // On successful login, redirect to the home page or another page
        this.succcess=true;
        this.cookieService.set('token', response.token); // Store token in cookie
        this.router.navigate(['/all-news']);
      },
      error => {
        // Handle different error scenarios
        console.clear();
        if (error.status === 400) {
          this.errorMessage = error.error.message || 'Invalid credentials. Please try again.';
        } else if (error.status === 500) {
          this.errorMessage = 'An unexpected error occurred. Please try again later.';
        } else {
          this.errorMessage = 'Something went wrong. Please try again.';
        }
      }
    );
  }

  forgotPassword() {
    // Navigate to the forgot password page
    this.router.navigate(['/forgot-password']);
  }

  navigateToRegister() {
    // Navigate to the registration page
    this.router.navigate(['/register']);
  }

  get alertClass() {
    if (this.succcess) {
      return 'alert alert-success';
    } else if (this.errorMessage) {
      return 'alert alert-danger';
    }
    return '';
  }
}
