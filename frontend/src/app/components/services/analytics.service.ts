import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private baseUrl = `${environment.apiUrl}/analytics`;
  private http = inject(HttpClient);

  getSummary(): Observable<any> {
    return this.http.get(`${this.baseUrl}/summary`, { withCredentials: true });
  }
}