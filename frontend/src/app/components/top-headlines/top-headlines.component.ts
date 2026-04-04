import { Component } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf, SlicePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NewsService } from '../services/news.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { SharedNewsComponent } from '../shared-news/shared-news.component';

@Component({
  selector: 'app-top-headlines',
  standalone: true,
  imports: [NgIf,NgFor,NgClass,SlicePipe,DatePipe,SharedNewsComponent],
  templateUrl: './top-headlines.component.html',
  styleUrl: './top-headlines.component.css'
})
export class TopHeadlinesComponent {
  data: any[] = [];
  page = 1;
  totalResults = 0;
  totalPages = 1;
  isLoading = false;
  error: string | null = null;
  max = 12;
  category: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private newsService: NewsService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.category = params.get('category');
      this.page = 1; // reset on category change
      this.fetchData();
    });
  }

  fetchData(): void {
    this.isLoading = true;
    this.error = null;

    this.newsService.getTopHeadlines(this.category || '', this.page, this.max)
      .pipe(
        catchError(error => {
          if (error.status === 0) {
            this.error = 'Network error. Check connection.';
          } else if (error.status >= 500) {
            this.error = 'Server error. Try later.';
          } else {
            this.error = 'Failed to fetch news.';
          }

          return of({ success: false, data: { articles: [], totalResults: 0 } });
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(response => {
        if (response.success) {
          this.totalResults = response.data.totalResults;
          this.data = response.data.articles;
          this.calculateTotalPages();
        }
      });
  }

  handlePrev(): void {
    if (this.page > 1) {
      this.page--;
      this.fetchData();
    }
  }

  handleNext(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.fetchData();
    }
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalResults / this.max);
  }

  trackByUrl(index: number, item: any): string {
    return item.url;
  }

  handleImageError(event: any): void {
  event.target.src = 'assets/googleNews.png';
}
}

