import { Component, Input } from '@angular/core';
import { NewsService } from '../services/news.service';  // Import your news service
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-shared-news',
  templateUrl: './shared-news.component.html',
  styleUrls: ['./shared-news.component.css'],
  imports:[NgIf],
  standalone:true,
})
export class SharedNewsComponent {
  @Input() article: any;
  showShareModal = false;
  socialLinks: any = {};

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

  shareNews(): void {
    if (this.article) {
      this.newsService.shareNews(this.article).subscribe(
        (response: any) => {
          this.socialLinks = response.socialMediaLinks;
          this.showShareModal = true;
        },
        (error) => {
          console.error('Failed to share news:', error);
        }
      );
    }
  }

  openSocialLink(url: string): void {
    window.open(url, '_blank');
  }

  closeModal(): void {
    this.showShareModal = false;
  }
}
