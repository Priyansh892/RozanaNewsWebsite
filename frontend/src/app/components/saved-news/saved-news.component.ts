import { Component } from '@angular/core';
import { NewsService } from '../services/news.service';
import { NgFor, NgIf, SlicePipe } from '@angular/common';
@Component({
  selector: 'app-saved-news',
  standalone: true,
  imports: [SlicePipe,NgIf,NgFor],
  templateUrl: './saved-news.component.html',
  styleUrl: './saved-news.component.css'
})
export class SavedNewsComponent {
  data: any[] = [];
  isLoading: boolean = true;

  constructor(private newsService: NewsService) {}

  ngOnInit(): void {
    this.loadSavedNews();
  }

  loadSavedNews(): void {
    this.newsService.getSavedNews().subscribe(
      (response) => {
        this.data = response.news;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching saved news:', error);
        this.isLoading = false;
      }
    );
  }
}
