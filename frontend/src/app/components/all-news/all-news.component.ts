import { Component, OnInit } from '@angular/core';
import { NewsService } from '../services/news.service';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass, NgFor, NgIf, SlicePipe } from '@angular/common';
import { SharedNewsComponent } from '../shared-news/shared-news.component';
@Component({
  selector: 'app-all-news',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    NgFor,
    NgClass,
    SlicePipe,
    DatePipe,
    SharedNewsComponent,
  ],
  templateUrl: './all-news.component.html',
  styleUrls: ['./all-news.component.css'],
})
export class AllNewsComponent implements OnInit {
  data: any[] = [];
  page = 1;
  max = 12;
  totalResults = 0;
  isLoading = true;
  error: string | null = null;
  totalPages = 1;

  constructor(private newsService: NewsService) {}

  ngOnInit(): void {
    this.fetchNews();
  }

  fetchNews(): void {
    this.isLoading = true;
    this.error = null; // Reset error on retry

    this.newsService.getAllNews(this.page, this.max).subscribe({
      next: (response) => {
        if (response.success) {
          this.totalResults = response.data.totalResults;
          this.data = response.data.articles;
          this.calculateTotalPages();
        } else {
          this.error = response.message || 'An error occurred';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.error = 'Failed to fetch news. Please check your connection.';
        this.isLoading = false;
      },
    });
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalResults / this.max);
  }

  handlePrev(): void {
    if (this.page > 1) {
      this.page--;
      this.fetchNews();
      this.scrollToTop();
    }
  }

  handleNext(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.fetchNews();
      this.scrollToTop();
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/googleNews.png';
  }

  trackByUrl(index: number, item: any): string {
    return item.url;
  }
}
