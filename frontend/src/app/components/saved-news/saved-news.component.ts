import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SavedNewsService } from '../services/saved-news.service';
import { HistoryService } from '../services/history.service';
import { ToastService } from '../services/toast.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-saved-news',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    DatePipe,
    FormsModule,
    SlicePipe,
    ConfirmDialogComponent,
  ],
  templateUrl: './saved-news.component.html',
  styleUrls: ['./saved-news.component.css'],
})
export class SavedNewsComponent implements OnInit {
  savedArticles: any[] = [];
  filteredArticles: any[] = [];
  collections: string[] = [];
  selectedCollection = 'All';
  isLoading = true;
  error: string | null = null;

  showMoveModal = false;
  movingArticle: any = null;
  newCollectionName = '';
  existingCollections: string[] = [];

  // Confirmation dialog
  showRemoveConfirm = false;
  pendingRemoveId: string | null = null;

  private savedNewsService = inject(SavedNewsService);
  private historyService = inject(HistoryService);
  private toastService = inject(ToastService);
  readonly category = 'general';

  ngOnInit(): void {
    this.loadCollections();
    this.loadSaved();
  }

  loadCollections(): void {
    this.savedNewsService.getCollections().subscribe({
      next: (res) => {
        this.collections = ['All', ...res.collections];
        this.existingCollections = res.collections;
      },
      error: () => {},
    });
  }

  loadSaved(): void {
    this.isLoading = true;
    this.error = null;
    const collection =
      this.selectedCollection === 'All' ? undefined : this.selectedCollection;

    this.savedNewsService.getSavedArticles(collection).subscribe({
      next: (res) => {
        this.savedArticles = res.saved;
        this.filteredArticles = res.saved;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load saved articles. Please try again.';
        this.isLoading = false;
      },
    });
  }

  selectCollection(name: string): void {
    this.selectedCollection = name;
    this.loadSaved();
  }

  // ── Step 1: show confirmation ──────────────────────
  confirmUnsave(articleId: string): void {
    this.pendingRemoveId = articleId;
    this.showRemoveConfirm = true;
  }

  // ── Step 2: confirmed → delete ─────────────────────
  onRemoveConfirmed(): void {
    this.showRemoveConfirm = false;
    if (!this.pendingRemoveId) return;

    const id = this.pendingRemoveId;
    this.pendingRemoveId = null;

    this.savedNewsService.unsaveArticle(id).subscribe({
      next: () => {
        this.savedArticles = this.savedArticles.filter(
          (a) => a.articleId !== id,
        );
        this.filteredArticles = this.filteredArticles.filter(
          (a) => a.articleId !== id,
        );
        this.toastService.info('Article removed from saved');
        this.loadCollections();
        if (
          this.filteredArticles.length === 0 &&
          this.selectedCollection !== 'All'
        ) {
          this.selectedCollection = 'All';
          this.loadSaved();
        }
      },
      error: () => {
        this.toastService.error('Failed to remove article');
      },
    });
  }

  onRemoveCancelled(): void {
    this.showRemoveConfirm = false;
    this.pendingRemoveId = null;
  }

  openArticle(article: any): void {
    this.historyService.logRead(article, this.category);
  }

  openMoveModal(article: any): void {
    this.movingArticle = article;
    this.newCollectionName = '';
    this.showMoveModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeMoveModal(): void {
    this.showMoveModal = false;
    this.movingArticle = null;
    document.body.style.overflow = '';
  }

  moveToCollection(collectionName: string): void {
    if (!this.movingArticle || !collectionName.trim()) return;

    this.savedNewsService
      .moveToCollection(this.movingArticle.articleId, collectionName)
      .subscribe({
        next: () => {
          this.closeMoveModal();
          this.toastService.success(`Moved to "${collectionName}"`);
          this.loadCollections();
          this.loadSaved();
        },
        error: () => {
          this.toastService.error('Failed to move article');
        },
      });
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/googleNews.png';
  }

  trackById(index: number, item: any): string {
    return item.articleId;
  }
}
