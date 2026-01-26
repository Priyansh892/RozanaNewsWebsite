import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class NewsService {
  private baseUrl = 'http://localhost:5000/api/news';

  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  // CookieService is injected lazily only in browser
  private cookieService!: CookieService;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.cookieService = inject(CookieService);
    }
  }

  getAllNews(page: number, max: number): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/all-news?page=${page}&pageSize=${max}`,
    );
  }

  getCountryNews(iso: string, page: number, max: number): Observable<any> {
    const countryParam = iso ? `${iso}` : '';
    return this.http.get(
      `${this.baseUrl}/country/${countryParam}?page=${page}&pageSize=${max}`,
    );
  }

  getTopHeadlines(
    category: string,
    page: number,
    max: number,
  ): Observable<any> {
    const categoryParam = category ? `&category=${category}` : '';
    return this.http.get(
      `${this.baseUrl}/top-headlines?langauge=en${categoryParam}&page=${page}&pageSize=${max}`,
    );
  }

  saveNews(article: {
    title: string;
    description: string;
    url: string;
    urlToImage: string;
    publishedAt: string;
    author: string;
    source: any;
  }): Observable<any> {
    // Only use CookieService in browser
    let headers: HttpHeaders = new HttpHeaders();
    if (isPlatformBrowser(this.platformId) && this.cookieService) {
      const token = this.cookieService.get('authToken');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return this.http.post(`${this.baseUrl}/save-news`, article, {
      withCredentials: true,
      headers,
    });
  }

  getSavedNews(): Observable<any> {
    // Only include auth headers in browser
    let headers: HttpHeaders = new HttpHeaders();
    if (isPlatformBrowser(this.platformId) && this.cookieService) {
      const token = this.cookieService.get('authToken');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return this.http.get(`${this.baseUrl}/saved-news`, {
      withCredentials: true,
      headers,
    });
  }

  shareNews(article: { title: string; url: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/share-news`, article);
  }
}
