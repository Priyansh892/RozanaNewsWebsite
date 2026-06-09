import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NewsService {
  private baseUrl = `${environment.apiUrl}/news`;
  private http = inject(HttpClient);

  getAllNews(page: number, max: number): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/all-news?page=${page}&pageSize=${max}`,
      { withCredentials: true },
    );
  }

  getCountryNews(iso: string, page: number, max: number): Observable<any> {
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

  getForYouFeed(page: number = 1, pageSize: number = 10): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/for-you?page=${page}&pageSize=${pageSize}`,
      { withCredentials: true },
    );
  }
}
