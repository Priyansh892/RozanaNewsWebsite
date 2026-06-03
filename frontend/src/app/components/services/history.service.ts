import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  private baseUrl = 'http://localhost:5000/api/history';
  private http = inject(HttpClient);

  // Called silently when user clicks an article card
  // Uses fire-and-forget pattern — we don't block the article open on this
  logRead(article: any, category: string): void {
    this.http
      .post(
        `${this.baseUrl}/log`,
        { article, category },
        { withCredentials: true },
      )
      .subscribe({
        error: (err) =>
          console.error('[HistoryService] Failed to log read:', err.message),
      });
    // No next handler — fire and forget, user should never wait for this
  }

  // Get paginated reading history
  getHistory(page: number = 1, limit: number = 20): Observable<any> {
    return this.http.get(`${this.baseUrl}?page=${page}&limit=${limit}`, {
      withCredentials: true,
    });
  }

  // Clear all reading history
  clearHistory(): Observable<any> {
    return this.http.delete(`${this.baseUrl}`, { withCredentials: true });
  }

  // Remove a single article from history
  removeFromHistory(articleId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${articleId}`, {
      withCredentials: true,
    });
  }
}
