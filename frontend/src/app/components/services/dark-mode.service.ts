import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DarkModeService {
  private platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'rozana-theme';

  private darkModeSubject = new BehaviorSubject<boolean>(false);
  isDark$ = this.darkModeSubject.asObservable();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Restore from localStorage, fallback to system preference
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved !== null) {
        this.setDark(saved === 'dark');
      } else {
        const prefersDark = window.matchMedia(
          '(prefers-color-scheme: dark)',
        ).matches;
        this.setDark(prefersDark);
      }
    }
  }

  get isDark(): boolean {
    return this.darkModeSubject.value;
  }

  toggle(): void {
    this.setDark(!this.isDark);
  }

  private setDark(dark: boolean): void {
    this.darkModeSubject.next(dark);
    if (isPlatformBrowser(this.platformId)) {
      // Set data-theme on <html> - CSS variables switch based on this attribute
      document.documentElement.setAttribute(
        'data-theme',
        dark ? 'dark' : 'light',
      );
      localStorage.setItem(this.STORAGE_KEY, dark ? 'dark' : 'light');
    }
  }
}
