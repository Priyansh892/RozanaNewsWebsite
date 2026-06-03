import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf, SlicePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NewsService } from '../services/news.service';
import { HistoryService } from '../services/history.service';
import { SavedNewsService } from '../services/saved-news.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { SharedNewsComponent } from '../shared-news/shared-news.component';

@Component({
  selector: 'app-top-headlines',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, SlicePipe, DatePipe, SharedNewsComponent],
  templateUrl: './top-headlines.component.html',
  styleUrl: './top-headlines.component.css',
})
export class TopHeadlinesComponent implements OnInit {
  data: any[] = [];
  page = 1;
  totalResults = 0;
  totalPages = 1;
  isLoading = false;
  error: string | null = null;
  max = 10;
  selectedArticle: any;
  showShareModal = false;
  socialLinks: any = {};

  // Category from route param - also used as feed context for save + history
  // e.g. /top-headlines/sports → category = 'sports'
  category: string = 'general';

  private route = inject(ActivatedRoute);
  private newsService = inject(NewsService);
  private historyService = inject(HistoryService);
  private savedNewsService = inject(SavedNewsService);

  ngOnInit(): void {
    // Load saved IDs first, then subscribe to route params
    const init = () => {
      this.route.paramMap.subscribe((params) => {
        this.category = params.get('category') || 'general';
        this.page = 1;
        this.fetchData();
      });
    };
    if (this.savedNewsService.isLoaded) {
      init();
    } else {
      this.savedNewsService
        .loadSavedIds()
        .subscribe({ next: () => init(), error: () => init() });
    }
  }

  fetchData(): void {
    this.isLoading = true;
    this.error = null;

    this.newsService
      .getTopHeadlines(this.category, this.page, this.max)
      .pipe(
        catchError((error) => {
          if (error.status === 0) {
            this.error = 'Network error. Check connection.';
          } else if (error.status >= 500) {
            this.error = 'Server error. Try later.';
          } else {
            this.error = 'Failed to fetch news.';
          }
          return of({
            success: false,
            data: { articles: [], totalResults: 0 },
          });
        }),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe((response) => {
        if (response.success) {
          this.totalResults = response.data.totalResults;
          this.data = response.data.articles;
          this.calculateTotalPages();
        }
      });
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalResults / this.max);
  }

  handlePrev(): void {
    if (this.page > 1) {
      this.page--;
      this.fetchData();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  handleNext(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.fetchData();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Logs reading history silently when user clicks "Read Full Story"
  onReadArticle(article: any): void {
    this.historyService.logRead(article, this.category);
  }

  openShareModal(article: any): void {
    this.selectedArticle = article;
    this.newsService.shareNews(article).subscribe({
      next: (response: any) => {
        this.socialLinks = response.socialMediaLinks;
        this.showShareModal = true;
        document.body.style.overflow = 'hidden';
      },
      error: (error) => console.error('Failed to share news:', error),
    });
  }

  openSocialLink(url: string): void {
    window.open(url, '_blank');
  }

  closeModal(): void {
    this.showShareModal = false;
    document.body.style.overflow = '';
  }

  // Hook for save events - Week 8 will add toast notification here
  onSaveClicked(event: { article: any; saved: boolean }): void {}

  trackByUrl(index: number, item: any): string {
    return item.url;
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/googleNews.png';
  }
}
