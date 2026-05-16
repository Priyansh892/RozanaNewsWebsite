import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NewsService {
  private baseUrl = 'http://localhost:5000/api/news';

  private http = inject(HttpClient);

  getAllNews(page: number, max: number): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/all-news?page=${page}&pageSize=${max}`,
      { withCredentials: true },
    );
  }

  getCountryNews(iso: string, page: number, max: number): Observable<any> {
    // Removed redundant ternary — iso is always passed, and an empty string
    // would produce a broken URL (/country/) anyway. Callers should validate iso.
    return this.http.get(
      `${this.baseUrl}/country/${iso}?page=${page}&pageSize=${max}`,
      { withCredentials: true },
    );
  }

  getTopHeadlines(
    category: string,
    page: number,
    max: number,
  ): Observable<any> {
    const categoryParam = category ? `&category=${category}` : '';
    return this.http.get(
      `${this.baseUrl}/top-headlines?language=en${categoryParam}&page=${page}&pageSize=${max}`,
      { withCredentials: true },
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
    return this.http.post(`${this.baseUrl}/save-news`, article, {
      withCredentials: true,
    });
  }

  getSavedNews(): Observable<any> {
    return this.http.get(`${this.baseUrl}/saved-news`, {
      withCredentials: true,
    });
  }

  shareNews(article: { title: string; url: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/share-news`, article, {
      withCredentials: true,
    });
  }
}
