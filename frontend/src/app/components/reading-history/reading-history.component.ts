import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { HistoryService } from '../services/history.service';
import { ToastService } from '../services/toast.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-reading-history',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe, ConfirmDialogComponent],
  templateUrl: './reading-history.component.html',
  styleUrls: ['./reading-history.component.css'],
})
export class ReadingHistoryComponent implements OnInit {
  history: any[] = [];
  isLoading = true;
  error: string | null = null;
  page = 1;
  totalPages = 1;
  total = 0;
  limit = 18;

  // Clear all confirmation modal (existing)
  showClearConfirm = false;

  // Single remove confirmation
  showRemoveConfirm = false;
  pendingRemoveId: string | null = null;

  private historyService = inject(HistoryService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading = true;
    this.error = null;

    this.historyService.getHistory(this.page, this.limit).subscribe({
      next: (res) => {
        this.history = res.history;
        this.total = res.total;
        this.totalPages = res.totalPages;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load reading history. Please try again.';
        this.isLoading = false;
      },
    });
  }

  handleNext(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadHistory();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  handlePrev(): void {
    if (this.page > 1) {
      this.page--;
      this.loadHistory();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  confirmRemove(articleId: string): void {
    this.pendingRemoveId = articleId;
    this.showRemoveConfirm = true;
  }

  onRemoveConfirmed(): void {
    this.showRemoveConfirm = false;
    if (!this.pendingRemoveId) return;

    this.historyService.removeFromHistory(this.pendingRemoveId).subscribe({
      next: () => {
        this.history = this.history.filter(
          (h) => h.articleId !== this.pendingRemoveId,
        );
        this.total = Math.max(0, this.total - 1);
        this.toastService.info('Removed from reading history');
        this.pendingRemoveId = null;
      },
      error: () => {
        this.toastService.error('Failed to remove entry');
        this.pendingRemoveId = null;
      },
    });
  }

  onRemoveCancelled(): void {
    this.showRemoveConfirm = false;
    this.pendingRemoveId = null;
  }

  confirmClearAll(): void {
    this.showClearConfirm = true;
    document.body.style.overflow = 'hidden';
  }

  cancelClear(): void {
    this.showClearConfirm = false;
    document.body.style.overflow = '';
  }

  clearAll(): void {
    this.historyService.clearHistory().subscribe({
      next: () => {
        this.history = [];
        this.total = 0;
        this.totalPages = 1;
        this.page = 1;
        this.cancelClear();
        this.toastService.success('Reading history cleared');
      },
      error: () => {
        this.toastService.error('Failed to clear history');
        this.cancelClear();
      },
    });
  }

  openArticle(url: string): void {
    window.open(url, '_blank');
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/googleNews.png';
  }

  trackById(index: number, item: any): string {
    return item._id || item.articleId;
  }
}
