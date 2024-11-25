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
  isLoading = false;
  error: string | null = null;
  max = 12;
  category: string | null = null;
  totalPages=1;

  constructor(
    private route: ActivatedRoute,
    private newsService: NewsService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.category = params.get('category');
      this.fetchData();
    });
  }

  fetchData(): void {
    this.isLoading = true;
    this.error = null;

    this.newsService.getTopHeadlines(this.category || '', this.page, this.max)
      .pipe(
        catchError(error => {
          this.error = 'Failed to fetch news. Please try again later.';
          return of({ success: false, data: { articles: [], totalResults: 0 } });
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(response => {
        if (response.success) {
         // this.totalResults = response.data.totalArticles;
          this.totalResults = response.data.totalResults;
          this.data = response.data.articles;
          this.calculateTotalPages()
        } else {
          this.error = response.message || 'An error occurred';
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
    if (this.page < Math.ceil(this.totalResults / this.max + 1)) {
      this.page++;
      this.fetchData();
    }
  }
  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalResults / this.max + 1);
  }
}

