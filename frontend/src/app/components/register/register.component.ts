
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { NgClass, NgFor, NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  providers: [AuthService],
  imports: [FormsModule, NgFor, NgIf, NgClass]
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  newsLoginImage='assets/newsLogin.png';
  registrationSuccess = false;  // Flag to handle success message
  registrationError = '';  // String to store error message
  submitted = false;  // Flag to track if the form has been submitted
  passwordMismatch = false; // Flag to handle password mismatch error

  private authService = inject(AuthService);
  private router = inject(Router);

  // Method to handle form submission
  onSubmit(registerForm: any) {
    this.submitted = true;
    this.passwordMismatch = this.password !== this.confirmPassword;

    // Check if the form is valid and passwords match
    if (registerForm.valid && !this.passwordMismatch) {
      this.register();
    }
  }

  // Method to register the user
  private register() {
    this.authService.register(this.username, this.password, this.email).subscribe({
      next: (response) => {
        // On successful registration
        this.registrationSuccess = true;
        this.registrationError = ''; // Clear previous errors
        // Redirect to polls page after a short delay
        setTimeout(() => {
          this.router.navigate(['/all-news']);
        }, 1500);
      },
      error: (error) => {
       // console.clear();
        // Handle specific errors based on the error message from the server
        if (error.status === 400) {
            this.registrationError = 'Username is already taken. Kindly login into the account.';
        } else {
          // Handle unexpected errors
          this.registrationError = 'An unexpected error occurred. Please try again later.';
        }
      }
    });
  }

  redirectToLogin() {
    this.router.navigate(['/login']); // Adjust the route as needed
  }

  get alertClass() {
    if (this.registrationSuccess) {
      return 'alert alert-success';
    } else if (this.registrationError) {
      return 'alert alert-danger';
    }
    return '';
  }
}

