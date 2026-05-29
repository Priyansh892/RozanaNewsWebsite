import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NewsService } from '../services/news.service'; // Import your news service
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-shared-news',
  templateUrl: './shared-news.component.html',
  styleUrls: ['./shared-news.component.css'],
  imports: [NgIf],
  standalone: true,
})
export class SharedNewsComponent {
  @Input() article: any;

  constructor(private newsService: NewsService) {}

  // saveNews(): void {
  //   if (this.article) {
  //     this.newsService.saveNews(this.article).subscribe(
  //       () => {
  //         alert('News saved successfully!');
  //       },
  //       (error) => {
  //         console.error('Failed to save news:', error);
  //       }
  //     );
  //   }
  // }

  @Output() shareClicked = new EventEmitter<any>();

  shareNews(): void {
    this.shareClicked.emit(this.article);
  }
}
