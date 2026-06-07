import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { ToastService } from '../services/toast.service';
import { countries } from '../countries';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css'],
})
export class OnboardingComponent implements OnInit {
  step = 1;
  totalSteps = 3;
  isSubmitting = false;

  readonly allCategories = [
    { id: 'business', label: 'Business', emoji: '💼' },
    { id: 'technology', label: 'Technology', emoji: '💻' },
    { id: 'sports', label: 'Sports', emoji: '🏏' },
    { id: 'entertainment', label: 'Entertainment', emoji: '🎬' },
    { id: 'health', label: 'Health', emoji: '🏥' },
    { id: 'science', label: 'Science', emoji: '🔬' },
    { id: 'politics', label: 'Politics', emoji: '🏛️' },
    { id: 'general', label: 'General', emoji: '📰' },
  ];
  selectedInterests: string[] = [];

  readonly allCountries = countries;
  selectedCountries: string[] = ['in'];

  followedTopics: string[] = [];
  topicInput = '';

  readonly suggestedTopics = [
    'ISRO',
    'IPL',
    'Artificial Intelligence',
    'Budget 2026',
    'Climate Change',
    'Stock Market',
    'Bollywood',
    'Startup India',
    'Modi',
    'G20',
    'Crypto',
    'Electric Vehicles',
    'ChatGPT',
    'World Cup',
  ];

  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  ngOnInit(): void {
    this.userService.getTopics().subscribe({
      next: (res) => {
        if (res.onboardingDone) {
          this.router.navigate(['/all-news'], { replaceUrl: true });
        }
      },
      error: () => {},
    });
  }

  toggleInterest(id: string): void {
    const idx = this.selectedInterests.indexOf(id);
    if (idx > -1) {
      this.selectedInterests.splice(idx, 1);
    } else {
      this.selectedInterests.push(id);
    }
  }

  isInterestSelected(id: string): boolean {
    return this.selectedInterests.includes(id);
  }

  toggleCountry(iso: string): void {
    const idx = this.selectedCountries.indexOf(iso);
    if (idx > -1) {
      if (this.selectedCountries.length === 1) return;
      this.selectedCountries.splice(idx, 1);
    } else {
      this.selectedCountries.push(iso);
    }
  }

  isCountrySelected(iso: string): boolean {
    return this.selectedCountries.includes(iso);
  }

  addTopic(topic: string): void {
    const t = topic.trim();
    if (!t || this.followedTopics.includes(t.toLowerCase())) return;
    this.followedTopics.push(t.toLowerCase());
    this.topicInput = '';
  }

  addTopicOnEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTopic(this.topicInput);
    }
  }

  removeTopic(topic: string): void {
    this.followedTopics = this.followedTopics.filter((t) => t !== topic);
  }

  isSuggestedFollowed(topic: string): boolean {
    return this.followedTopics.includes(topic.toLowerCase());
  }

  toggleSuggested(topic: string): void {
    if (this.isSuggestedFollowed(topic)) {
      this.removeTopic(topic.toLowerCase());
    } else {
      this.addTopic(topic);
    }
  }

  next(): void {
    if (this.step < this.totalSteps) this.step++;
  }

  prev(): void {
    if (this.step > 1) this.step--;
  }

  canNext(): boolean {
    if (this.step === 1) return this.selectedInterests.length >= 1;
    if (this.step === 2) return this.selectedCountries.length >= 1;
    return true;
  }

  finish(): void {
    this.isSubmitting = true;
    this.userService
      .completeOnboarding({
        interests: this.selectedInterests,
        followedCountries: this.selectedCountries,
        followedTopics: this.followedTopics,
      })
      .subscribe({
        next: () => {
          this.toastService.success('Welcome to RozanaNews! 🎉');
          this.router.navigate(['/for-you'], { replaceUrl: true });
        },
        error: () => {
          this.toastService.error(
            'Failed to save preferences. Please try again.',
          );
          this.isSubmitting = false;
        },
      });
  }

  skip(): void {
    this.userService
      .completeOnboarding({
        interests: [],
        followedCountries: ['in'],
        followedTopics: [],
      })
      .subscribe({
        next: () => this.router.navigate(['/all-news'], { replaceUrl: true }),
        error: () => this.router.navigate(['/all-news'], { replaceUrl: true }),
      });
  }

  get progressWidth(): string {
    return `${(this.step / this.totalSteps) * 100}%`;
  }
}
