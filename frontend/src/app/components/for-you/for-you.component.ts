import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { NewsService } from '../services/news.service';
import { UserService } from '../services/user.service';
import { HistoryService } from '../services/history.service';
import { SavedNewsService } from '../services/saved-news.service';
import { ToastService } from '../services/toast.service';
import { SharedNewsComponent } from '../shared-news/shared-news.component';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-for-you',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe, SharedNewsComponent, RouterLink],
  templateUrl: './for-you.component.html',
  styleUrls: ['./for-you.component.css'],
})
export class ForYouComponent implements OnInit {
  data: any[] = [];
  isLoading = false;
  error: string | null = null;
  page = 1;
  totalResults = 0;
  max = 10;
  totalPages = 1;
  selectedArticle: any;
  showShareModal = false;
  socialLinks: any = {};

  // Feed metadata
  sources: any = null;
  followedTopics: string[] = [];
  topicInput = '';

  readonly category = 'general';

  private newsService = inject(NewsService);
  private userService = inject(UserService);
  private historyService = inject(HistoryService);
  private savedNewsService = inject(SavedNewsService);
  private toastService = inject(ToastService);
  router = inject(Router);

  ngOnInit(): void {
    const init = () => {
      this.userService.getTopics().subscribe({
        next: (res) => {
          if (!res.onboardingDone) {
            this.router.navigate(['/onboarding'], { replaceUrl: true });
            return;
          }
          this.followedTopics = res.followedTopics || [];
          this.fetchFeed();
        },
        error: () => this.fetchFeed(),
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

  fetchFeed(): void {
    this.isLoading = true;
    this.error = null;

    this.newsService
      .getForYouFeed(this.page, this.max)
      .pipe(
        catchError(() => {
          this.error = 'Failed to load your feed. Please try again.';
          return of({
            success: false,
            data: { articles: [], totalResults: 0 },
          });
        }),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe((res: any) => {
        if (!res) return;

        if (res.success && res.data) {
          this.data = res.data.articles || [];
          this.totalResults = res.data.totalResults || 0;
          this.sources = res.data.sources || null;
        } else {
          this.error = 'Could not load your feed. Please try again.';
        }
      });
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalResults / this.max);
  }

  handleNext(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.fetchFeed();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  handlePrev(): void {
    if (this.page > 1) {
      this.page--;
      this.fetchFeed();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onReadArticle(article: any): void {
    this.historyService.logRead(article, this.category);
  }

  followTopic(topic: string): void {
    if (!topic.trim()) return;
    this.userService.followTopic(topic).subscribe({
      next: (res: any) => {
        this.followedTopics = res.followedTopics || [];
        this.toastService.success(`Following "${topic}" ✓`);
        this.topicInput = '';
        this.fetchFeed();
      },
      error: () => this.toastService.error('Failed to follow topic'),
    });
  }

  unfollowTopic(topic: string): void {
    this.userService.unfollowTopic(topic).subscribe({
      next: (res: any) => {
        this.followedTopics = res.followedTopics || [];
        this.toastService.info(`Unfollowed "${topic}"`);
        this.fetchFeed();
      },
      error: () => this.toastService.error('Failed to unfollow topic'),
    });
  }

  openShareModal(article: any): void {
    this.selectedArticle = article;
    this.newsService.shareNews(article).subscribe({
      next: (res: any) => {
        this.socialLinks = res.socialMediaLinks;
        this.showShareModal = true;
        document.body.style.overflow = 'hidden';
      },
      error: () => {},
    });
  }

  closeModal(): void {
    this.showShareModal = false;
    document.body.style.overflow = '';
  }

  openSocialLink(url: string): void {
    window.open(url, '_blank');
  }

  onSaveClicked(event: { article: any; saved: boolean }): void {}

  handleImageError(event: any): void {
    event.target.src = 'assets/googleNews.png';
  }

  trackByUrl(index: number, item: any): string {
    return item.url;
  }
}
