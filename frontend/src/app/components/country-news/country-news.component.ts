// import { Component,OnInit } from '@angular/core';
// import { catchError, finalize } from 'rxjs/operators';
// import { NewsService } from '../services/news.service';
// import { of } from 'rxjs';
// import { ActivatedRoute } from '@angular/router';
// import { DatePipe, NgClass, NgFor, NgIf, SlicePipe } from '@angular/common';
// @Component({
//   selector: 'app-country-news',
//   standalone: true,
//   imports: [NgIf,NgFor,NgClass,SlicePipe,DatePipe],
//   templateUrl: './country-news.component.html',
//   styleUrl: './country-news.component.css'
// })
// export class CountryNewsComponent {
//   data: any[] = [];
//   page = 1;
//   totalResults = 1;
//   isLoading = false;
//   error: string | null = null;
//   max = 12;
//   iso: string | null = null;
//   totalPages=1

//   constructor(
//     private route: ActivatedRoute,
//     private newsService: NewsService
//   ) {}

//   ngOnInit(): void {
//     this.route.paramMap.subscribe(params => {
//       this.iso = params.get('iso');
//       if (this.iso) {
//         this.fetchData();
//       }
//     });
//   }

//   fetchData(): void {
//     if (!this.iso) {
//       console.log("dajhdjh")
//       return;
//     }
//     this.isLoading = true;
//     this.error = null;

//     this.newsService.getCountryNews(this.iso, this.page, this.max)
//       .pipe(
//         catchError(error => {
//           this.error = 'Failed to fetch news. Please try again later.';
//           return of({ success: false, data: { articles: [], totalResults: 0 } });
//         }),
//         finalize(() => {
//           this.isLoading = false;
//         })
//       )
//       .subscribe(response => {
//         if (response.success) {
//           // this.totalResults = response.data.totalArticles;
//           this.totalResults = response.data.totalResults;
//           this.data = response.data.articles;
//           this.calculateTotalPages()
//         } else {
//           this.error = response.message || 'An error occurred';
//         }
//       });
//   }

//   handlePrev(): void {
//     if (this.page > 1) {
//       this.page--;
//       this.fetchData();
//     }
//   }

//   handleNext(): void {
//     if (this.page < Math.ceil(this.totalResults / this.max + 1)) {
//       this.page++;
//       this.fetchData();
//     }
//   }
//   calculateTotalPages(): void {
//     this.totalPages = Math.ceil(this.totalResults / this.max + 1);
//   }

//   saveNews(article: any): void {
//     this.newsService.saveNews(article).subscribe(
//       () => {
//         alert('News saved successfully!');
//       },
//       (error) => {
//         console.error('Failed to save news:', error);
//       }
//     );
//   }

//   // Share article using the NewsService
//   shareNews(article: any): void {
//     this.newsService.shareNews(article).subscribe(
//       (response: any) => {
//         const socialLinks = response.socialMediaLinks;
//         if (socialLinks) {
//           this.showShareOptions(socialLinks);
//         } else {
//           alert('Failed to get social media links');
//         }
//       },
//       (error) => {
//         console.error('Failed to share news:', error);
//       }
//     );
//   }

//   // Display a modal or dropdown to choose the platform to share
//   showShareOptions(socialLinks: any) {
//     const shareOption = prompt("Where would you like to share?\n1. Facebook\n2. Twitter\n3. LinkedIn\n4. WhatsApp\n5. Email");

//     switch (shareOption) {
//       case '1':
//         window.open(socialLinks.facebook, '_blank');
//         break;
//       case '2':
//         window.open(socialLinks.twitter, '_blank');
//         break;
//       case '3':
//         window.open(socialLinks.linkedin, '_blank');
//         break;
//       case '4':
//         window.open(socialLinks.whatsapp, '_blank');
//         break;
//       case '5':
//         window.open(socialLinks.email, '_blank');
//         break;
//       default:
//         alert('Invalid option. Please try again.');
//     }
//   }
// }


import { Component, OnInit } from '@angular/core';
import { catchError, finalize } from 'rxjs/operators';
import { NewsService } from '../services/news.service';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { DatePipe, NgClass, NgFor, NgIf, SlicePipe } from '@angular/common';
import { SharedNewsComponent } from '../shared-news/shared-news.component';  // Import SharedNewsComponent

@Component({
  selector: 'app-country-news',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, SlicePipe, DatePipe, SharedNewsComponent],  // Include SharedNewsComponent
  templateUrl: './country-news.component.html',
  styleUrls: ['./country-news.component.css']
})
export class CountryNewsComponent implements OnInit {
  data: any[] = [];
  page = 1;
  totalResults = 1;
  isLoading = false;
  error: string | null = null;
  max = 12;
  iso: string | null = null;
  totalPages = 1;

  constructor(
    private route: ActivatedRoute,
    private newsService: NewsService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.iso = params.get('iso');
      if (this.iso) {
        this.fetchData();
      }
    });
  }

  fetchData(): void {
    if (!this.iso) {
      return;
    }
    this.isLoading = true;
    this.error = null;

    this.newsService.getCountryNews(this.iso, this.page, this.max)
      .pipe(
        catchError(error => {
          this.error = 'Failed to fetch news. Please try again later.';
          return of({ success: false, data: { articles: [], totalResults: 0 } });
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(response => {
        if (response.success) {
          this.totalResults = response.data.totalResults;
          this.data = response.data.articles;
          this.calculateTotalPages();
        } else {
          this.error = response.message || 'An error occurred';
        }
      });
  }

  handlePrev(): void {
    if (this.page > 1) {
      this.page--;
      this.fetchData();
    }
  }

  handleNext(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.fetchData();
    }
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalResults / this.max);
  }
}
