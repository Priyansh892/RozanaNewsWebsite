import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = 'http://localhost:5000/api/user';
  private http = inject(HttpClient);

  // In-memory cache of followed topics so UI updates instantly
  private followedTopicsSubject = new BehaviorSubject<string[]>([]);
  followedTopics$ = this.followedTopicsSubject.asObservable();

  getProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/profile`, { withCredentials: true });
  }

  getTopics(): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/topics`, { withCredentials: true })
      .pipe(
        tap((res: any) => {
          if (res.followedTopics) {
            this.followedTopicsSubject.next(res.followedTopics);
          }
        }),
      );
  }

  completeOnboarding(data: {
    interests: string[];
    followedCountries: string[];
    followedTopics: string[];
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/onboarding`, data, {
      withCredentials: true,
    });
  }

  followTopic(topic: string): Observable<any> {
    return this.http
      .post(
        `${this.baseUrl}/follow-topic`,
        { topic },
        { withCredentials: true },
      )
      .pipe(
        tap((res: any) => {
          if (res.followedTopics)
            this.followedTopicsSubject.next(res.followedTopics);
        }),
      );
  }

  unfollowTopic(topic: string): Observable<any> {
    return this.http
      .post(
        `${this.baseUrl}/unfollow-topic`,
        { topic },
        { withCredentials: true },
      )
      .pipe(
        tap((res: any) => {
          if (res.followedTopics)
            this.followedTopicsSubject.next(res.followedTopics);
        }),
      );
  }

  updateInterests(
    interests: string[],
    followedCountries: string[],
  ): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/interests`,
      { interests, followedCountries },
      { withCredentials: true },
    );
  }

  isFollowing(topic: string): boolean {
    return this.followedTopicsSubject.value.includes(
      topic.toLowerCase().trim(),
    );
  }

  clearState(): void {
    this.followedTopicsSubject.next([]);
  }

  get currentFollowedTopics(): string[] {
    return this.followedTopicsSubject.value;
  }
}
