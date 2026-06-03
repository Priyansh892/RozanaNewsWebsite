import { Component, OnInit, inject } from '@angular/core';
import { NewsService } from '../services/news.service';
import { HistoryService } from '../services/history.service';
import { SavedNewsService } from '../services/saved-news.service';
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
  max = 10;
  totalResults = 0;
  isLoading = true;
  error: string | null = null;
  totalPages = 1;
  selectedArticle: any;
  showShareModal = false;
  socialLinks: any = {};

  // Category for this feed — passed to app-shared-news
  readonly category = 'general';

  private newsService = inject(NewsService);
  private historyService = inject(HistoryService);
  private savedNewsService = inject(SavedNewsService);

  ngOnInit(): void {
    // Load all saved IDs once — cards read from in-memory Set, no per-card API calls
    if (this.savedNewsService.isLoaded) {
      this.fetchNews();
    } else {
      this.savedNewsService
        .loadSavedIds()
        .subscribe({
          next: () => this.fetchNews(),
          error: () => this.fetchNews(),
        });
    }
  }

  fetchNews(): void {
    this.isLoading = true;
    this.error = null;

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

  // Hook for save events — Week 8 will add toast notification here
  onSaveClicked(event: { article: any; saved: boolean }): void {}

  handleImageError(event: any): void {
    event.target.src = 'assets/googleNews.png';
  }

  trackByUrl(index: number, item: any): string {
    return item.url;
  }
}
