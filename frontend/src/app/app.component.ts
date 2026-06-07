import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from './components/services/auth.service';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { DarkModeService } from './components/services/dark-mode.service';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { countries } from './components/countries';
import { ToastContainerComponent } from "./components/toast-container/toast-container.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    CommonModule,
    FormsModule,
    ConfirmDialogComponent,
    AsyncPipe,
    ToastContainerComponent
],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'RozanaNews';

  selectedCategory: string | null = null;
  selectedCountry: string | null = null;
  isNavbarOpen = false;

  categories = [
    'business',
    'entertainment',
    'general',
    'health',
    'science',
    'sports',
    'technology',
    'politics',
  ];

  countries = countries;

  private authService = inject(AuthService);
  private router = inject(Router);
  darkModeService = inject(DarkModeService);

  ngOnInit(): void {}

  toggleNavbar(): void {
    this.isNavbarOpen = !this.isNavbarOpen;
  }

  toggleDarkMode(): void {
    this.darkModeService.toggle();
    this.closeNavbar();
  }

  closeNavbar(): void {
    this.isNavbarOpen = false;
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  getUsername(): string {
    return this.authService.getUsername();
  }

  logout(): void {
    this.authService.logout();
  }

  navigateToAllNews(): void {
    this.router.navigate(['/all-news']);
  }

  navigateToTopHeadlines(category: string): void {
    this.selectedCategory = category;
    this.router.navigate(['/top-headlines', category]);
  }

  navigateToCountryNews(countryName: string): void {
    this.selectedCountry = countryName;
    const isoCode = this.getCountryIsoCode(countryName);
    this.router.navigate(['/country', isoCode]);
  }

  getCountryIsoCode(countryName: string): string {
    const countryObj = this.countries.find(
      (c) => c.countryName === countryName,
    );
    return countryObj?.iso_2_alpha || '';
  }
}
