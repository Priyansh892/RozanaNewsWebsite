

import { Component, OnInit } from '@angular/core';
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
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'RozanaNews';

  selectedCategory: string | null = null;
  selectedCountry: string | null = null;

  categories = ["business", "entertainment", "general", "health", "science", "sports", "technology", "politics"];
  countries = countries;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Optionally, you can handle any initialization logic here
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
    this.router.navigate(['/top-headlines', this.selectedCategory]);
  }

  navigateToCountryNews(countryName: string): void {
    this.selectedCountry = countryName;
    const isoCode = this.getCountryIsoCode(this.selectedCountry);
    this.router.navigate(['/country', isoCode]);
  }

  getCountryIsoCode(countryName: string): string {
    // Find the ISO code for the selected country
    const countryObj = this.countries.find(c => c.countryName === countryName);
    return countryObj?.iso_2_alpha || '';
  }
}


