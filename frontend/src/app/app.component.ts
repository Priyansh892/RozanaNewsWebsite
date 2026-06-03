import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from './components/services/auth.service';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { countries } from './components/countries';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, FormsModule],
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

  ngOnInit(): void {}

  toggleNavbar(): void {
    this.isNavbarOpen = !this.isNavbarOpen;
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
