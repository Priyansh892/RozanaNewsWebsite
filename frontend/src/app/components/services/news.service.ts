
import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private baseUrl = 'http://localhost:5000/api/news';

  constructor(private http: HttpClient, private cookieService: CookieService) {}

  getAllNews(page: number, max: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/all-news?page=${page}&pageSize=${max}`);
  }

  getCountryNews(iso: string, page: number, max: number): Observable<any> {
    const countryParam = iso ? `${iso}` : '';
    return this.http.get(`${this.baseUrl}/country/${countryParam}?page=${page}&pageSize=${max}`);
  }

  getTopHeadlines(category: string, page: number, max: number): Observable<any> {
    const categoryParam = category ? `&category=${category}` : '';
    return this.http.get(`${this.baseUrl}/top-headlines?langauge=en${categoryParam}&page=${page}&pageSize=${max}`);
   
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
    // const token = this.cookieService.get('authToken'); // Get token from cookie
    // const headers = new HttpHeaders({
    //   'Authorization': `Bearer ${token}`
    // });
    
    return this.http.post(`${this.baseUrl}/save-news`, article, { withCredentials: true });
  }
  getSavedNews(): Observable<any> {
    return this.http.get(`${this.baseUrl}/saved-news`,{ withCredentials: true });
  }

  shareNews(article: { title: string; url: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/share-news`, article);
  }
}


