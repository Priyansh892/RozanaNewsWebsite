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
import { Subscription } from 'rxjs';

import { SavedNewsService } from '../services/saved-news.service';

import md5 from 'md5';

@Component({
  selector: 'app-shared-news',
  templateUrl: './shared-news.component.html',
  styleUrls: ['./shared-news.component.css'],
  imports: [NgIf],
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

  private savedNewsService = inject(SavedNewsService);

  private subscription?: Subscription;

  ngOnInit(): void {
    if (this.article?.url) {
      this.articleId = md5(this.article.url);

      // reactive sync with service
      this.subscription = this.savedNewsService.savedIds$.subscribe(
        (savedIds) => {
          this.isSaved = savedIds.has(this.articleId);
        },
      );
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  shareNews(): void {
    this.shareClicked.emit(this.article);
  }

  toggleSave(): void {
    if (!this.article || this.isSaving) return;

    this.isSaving = true;

    if (this.isSaved) {
      this.savedNewsService.unsaveArticle(this.articleId).subscribe({
        next: () => {
          this.isSaving = false;

          this.saveClicked.emit({
            article: this.article,
            saved: false,
          });
        },
        error: () => {
          this.isSaving = false;
        },
      });
    } else {
      this.savedNewsService.saveArticle(this.article, this.category).subscribe({
        next: () => {
          this.isSaving = false;

          this.saveClicked.emit({
            article: this.article,
            saved: true,
          });
        },
        error: (err) => {
          if (err.status === 409) {
            this.isSaved = true;
          }

          this.isSaving = false;
        },
      });
    }
  }
}
