import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SavedNewsService {
  private baseUrl = 'http://localhost:5000/api/saved';
  private http = inject(HttpClient);

  // ─── In-memory Set of saved articleIds ───────────────────────────────────
  // Loaded once on app start / page load.
  // Each card checks this Set locally - no per-card API calls needed.
  private savedIds = new Set<string>();
  private loaded = false;
  private savedIdsSubject = new BehaviorSubject<Set<string>>(new Set());
  savedIds$ = this.savedIdsSubject.asObservable();

  // ─── Load all saved IDs (call once per page/session) ─────────────────────
  loadSavedIds(): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/ids`, { withCredentials: true })
      .pipe(
        tap((res) => {
          if (res.success) {
            this.savedIds = new Set<string>(res.ids);
            this.savedIdsSubject.next(new Set(this.savedIds));
            this.loaded = true;
          }
        }),
      );
  }

  // ─── Check saved state locally (no API call) ─────────────────────────────
  isSaved(articleId: string): boolean {
    return this.savedIds.has(articleId);
  }

  // ─── Save article - update Set optimistically ─────────────────────────────
  saveArticle(
    article: any,
    category: string,
    collectionName?: string,
  ): Observable<any> {
    return this.http
      .post<any>(
        `${this.baseUrl}/save`,
        { article, category, collectionName },
        { withCredentials: true },
      )
      .pipe(
        tap((res) => {
          if (res.success) {
            this.savedIds.add(res.saved.articleId);
            this.savedIdsSubject.next(new Set(this.savedIds));
          }
        }),
      );
  }

  // ─── Unsave article - remove from Set optimistically ─────────────────────
  unsaveArticle(articleId: string): Observable<any> {
    return this.http
      .delete<any>(`${this.baseUrl}/${articleId}`, { withCredentials: true })
      .pipe(
        tap((res) => {
          if (res.success) {
            this.savedIds.delete(articleId);
            this.savedIdsSubject.next(new Set(this.savedIds));
          }
        }),
      );
  }

  // ─── Get all saved articles ───────────────────────────────────────────────
  getSavedArticles(collection?: string): Observable<any> {
    const params = collection
      ? `?collection=${encodeURIComponent(collection)}`
      : '';
    return this.http.get(`${this.baseUrl}${params}`, { withCredentials: true });
  }

  // ─── Get all collection names ─────────────────────────────────────────────
  getCollections(): Observable<any> {
    return this.http.get(`${this.baseUrl}/collections`, {
      withCredentials: true,
    });
  }

  // ─── Check single article (kept for edge cases) ───────────────────────────
  checkSaved(articleId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/check/${articleId}`, {
      withCredentials: true,
    });
  }

  // ─── Move to collection ───────────────────────────────────────────────────
  moveToCollection(articleId: string, collectionName: string): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/${articleId}/move`,
      { collectionName },
      { withCredentials: true },
    );
  }

  // ─── Clear in-memory state (call on logout) ───────────────────────────────
  clearState(): void {
    this.savedIds.clear();
    this.loaded = false;
  }

  get isLoaded(): boolean {
    return this.loaded;
  }
}
