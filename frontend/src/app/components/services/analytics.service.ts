import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private baseUrl = 'http://localhost:5000/api/analytics';
  private http = inject(HttpClient);

  getSummary(): Observable<any> {
    return this.http.get(`${this.baseUrl}/summary`, { withCredentials: true });
  }
}