import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SavedNewsService } from '../services/saved-news.service';
import { Router } from '@angular/router';
import { HistoryService } from '../services/history.service';

@Component({
  selector: 'app-saved-news',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe, FormsModule, SlicePipe],
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

  // Move to collection modal
  showMoveModal = false;
  movingArticle: any = null;
  newCollectionName = '';
  existingCollections: string[] = [];

  private savedNewsService = inject(SavedNewsService);
  private historyService = inject(HistoryService);
  private router = inject(Router);
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

  unsave(articleId: string): void {
    this.savedNewsService.unsaveArticle(articleId).subscribe({
      next: () => {
        this.savedArticles = this.savedArticles.filter(
          (a) => a.articleId !== articleId,
        );
        this.filteredArticles = this.filteredArticles.filter(
          (a) => a.articleId !== articleId,
        );
      },
      error: () => {},
    });
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
          this.loadCollections();
          this.loadSaved();
        },
        error: () => {},
      });
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/googleNews.png';
  }

  trackById(index: number, item: any): string {
    return item.articleId;
  }
}
