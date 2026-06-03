import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { DatePipe, NgClass, NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { NewsService } from '../services/news.service';
import { HistoryService } from '../services/history.service';
import { SavedNewsService } from '../services/saved-news.service';
import { SharedNewsComponent } from '../shared-news/shared-news.component';
import { countries } from '../countries';

@Component({
  selector: 'app-country-news',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe, UpperCasePipe, SharedNewsComponent],
  templateUrl: './country-news.component.html',
  styleUrls: ['./country-news.component.css'],
})
export class CountryNewsComponent implements OnInit {
  data: any[] = [];
  page = 1;
  totalResults = 0;
  isLoading = false;
  error: string | null = null;
  max = 10;
  iso: string | null = null;
  totalPages = 1;
  selectedCountryName = '';
  selectedArticle: any;
  showShareModal = false;
  socialLinks: any = {};

  // Category for this component - used by shared-news for save + history
  readonly category = 'country';

  private route = inject(ActivatedRoute);
  private newsService = inject(NewsService);
  private historyService = inject(HistoryService);
  private savedNewsService = inject(SavedNewsService); // ✅ added for read logging

  ngOnInit(): void {
    // Load saved IDs first, then subscribe to route params
    const init = () => {
      this.route.paramMap.subscribe((params) => {
        this.iso = params.get('iso');
        if (this.iso) {
          this.updateCountryUI(this.iso);
          this.page = 1;
          this.fetchData();
        }
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

  private updateCountryUI(code: string): void {
    const country = countries.find(
      (c) => c.iso_2_alpha.toLowerCase() === code.toLowerCase(),
    );
    this.selectedCountryName = country
      ? country.countryName
      : code.toUpperCase();
  }

  fetchData(): void {
    if (!this.iso) return;
    this.isLoading = true;
    this.error = null;

    this.newsService
      .getCountryNews(this.iso, this.page, this.max)
      .pipe(
        catchError(() => {
          this.error = 'Failed to fetch news. Please try again later.';
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
        } else {
          this.error = response.message || 'An error occurred';
        }
      });
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalResults / this.max);
  }

  handleNext(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.fetchData();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  handlePrev(): void {
    if (this.page > 1) {
      this.page--;
      this.fetchData();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Log reading history when user clicks "Read Full Story"
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

  trackByUrl(index: number, item: any): string {
    return item.url;
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/googleNews.png';
  }

  // Called when user saves/unsaves from shared-news component
  // Currently just a hook - Week 8 will add a toast notification here
  onSaveClicked(event: { article: any; saved: boolean }): void {
    // e.g: show toast "Article saved to Reading List" / "Article removed"
    // Toast service will be wired here in Week 8
  }
}
