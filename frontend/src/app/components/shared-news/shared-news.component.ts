import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { SavedNewsService } from '../services/saved-news.service';
import { ToastService } from '../services/toast.service';
import { ConfirmDialogComponent } from '../toast/confirm-dialog.component';
import { Subscription } from 'rxjs';
import md5 from 'md5';

@Component({
  selector: 'app-shared-news',
  templateUrl: './shared-news.component.html',
  styleUrls: ['./shared-news.component.css'],
  imports: [NgIf, ConfirmDialogComponent],
  standalone: true,
})
export class SharedNewsComponent implements OnInit, OnDestroy {
  @Input() article: any;
  @Input() category: string = 'general';

  @Output() shareClicked = new EventEmitter<any>();
  @Output() saveClicked = new EventEmitter<any>();

  isSaved = false;
  isSaving = false;
  articleId = '';

  // Confirmation dialog state
  showConfirm = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmLabel = '';
  confirmDanger = true;
  pendingAction: 'save' | 'unsave' | null = null;

  private savedNewsService = inject(SavedNewsService);
  private toastService = inject(ToastService);
  private sub?: Subscription;

  ngOnInit(): void {
    if (!this.article?.url) return;
    this.articleId = md5(this.article.url);
    this.sub = this.savedNewsService.savedIds$.subscribe((ids: Set<string>) => {
      this.isSaved = ids.has(this.articleId);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  shareNews(): void {
    this.shareClicked.emit(this.article);
  }
  toggleSave(): void {
    if (!this.article || this.isSaving) return;

    if (this.isSaved) {
      this.confirmTitle = 'Remove from saved?';
      this.confirmMessage =
        'This article will be removed from your Reading List.';
      this.confirmLabel = 'Remove';
      this.confirmDanger = true;
      this.pendingAction = 'unsave';
    } else {
      this.confirmTitle = 'Save this article?';
      this.confirmMessage = 'It will be added to your Reading List.';
      this.confirmLabel = 'Save';
      this.confirmDanger = false;
      this.pendingAction = 'save';
    }
    this.showConfirm = true;
  }

  onConfirmed(): void {
    this.showConfirm = false;
    if (this.pendingAction === 'unsave') {
      this.doUnsave();
    } else if (this.pendingAction === 'save') {
      this.doSave();
    }
    this.pendingAction = null;
  }

  onCancelled(): void {
    this.showConfirm = false;
    this.pendingAction = null;
  }

  private doSave(): void {
    this.isSaving = true;
    this.savedNewsService.saveArticle(this.article, this.category).subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.success('Article saved to Reading List ✓');
        this.saveClicked.emit({ article: this.article, saved: true });
      },
      error: (err) => {
        if (err.status === 409) {
          this.isSaved = true;
          this.toastService.info('Already in your Reading List');
        } else {
          this.toastService.error('Failed to save article');
        }
        this.isSaving = false;
      },
    });
  }

  private doUnsave(): void {
    this.isSaving = true;
    this.savedNewsService.unsaveArticle(this.articleId).subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.info('Removed from saved');
        this.saveClicked.emit({ article: this.article, saved: false });
      },
      error: () => {
        this.toastService.error('Failed to remove article');
        this.isSaving = false;
      },
    });
  }
}
