import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, DecimalPipe, TitleCasePipe } from '@angular/common';
import { AnalyticsService } from '../services/analytics.service';
import { AuthService } from '../services/auth.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import {
  Chart,
  BarController, BarElement,
  DoughnutController, ArcElement,
  CategoryScale, LinearScale,
  Tooltip, Legend,
} from 'chart.js';

Chart.register(
  BarController, BarElement,
  DoughnutController, ArcElement,
  CategoryScale, LinearScale,
  Tooltip, Legend
);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, BaseChartDirective, TitleCasePipe],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
})
export class AnalyticsComponent implements OnInit {
  isLoading = true;
  error: string | null = null;
  data: any = null;
  username = '';

  private analyticsService = inject(AnalyticsService);
  private authService = inject(AuthService);

  // ── Bar chart — weekly reads ───────────────────────
  barChartType: ChartType = 'bar';
  barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y} article${ctx.parsed.y !== 1 ? 's' : ''}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#a0a0a0', font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          color: '#a0a0a0',
          stepSize: 1,
          font: { size: 11 },
        },
      },
    },
  };

  // ── Doughnut chart — categories ────────────────────
  doughnutChartType: ChartType = 'doughnut';
  doughnutChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#a0a0a0', padding: 16, font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed} reads`,
        },
      },
    },
  };

  readonly categoryColors = [
    '#c9373c', '#f5a623', '#2196F3', '#4CAF50',
    '#9C27B0', '#FF5722', '#00BCD4', '#607D8B',
  ];

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.isLoading = true;
    this.error = null;

    this.analyticsService.getSummary().subscribe({
      next: (res) => {
        this.data = res.data;
        this.buildCharts(res.data);
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load analytics. Please try again.';
        this.isLoading = false;
      },
    });
  }

  private buildCharts(d: any): void {
    // Bar chart
    this.barChartData = {
      labels: d.weeklyData.map((w: any) => w.label),
      datasets: [
        {
          data: d.weeklyData.map((w: any) => w.count),
          backgroundColor: 'rgba(201, 55, 60, 0.7)',
          borderColor: '#c9373c',
          borderWidth: 2,
          borderRadius: 6,
          hoverBackgroundColor: '#c9373c',
        },
      ],
    };

    // Doughnut chart
    if (d.categoryData.length > 0) {
      this.doughnutChartData = {
        labels: d.categoryData.map((c: any) =>
          c.category.charAt(0).toUpperCase() + c.category.slice(1)
        ),
        datasets: [
          {
            data: d.categoryData.map((c: any) => c.count),
            backgroundColor: this.categoryColors.slice(0, d.categoryData.length),
            borderWidth: 0,
            hoverOffset: 8,
          },
        ],
      };
    }
  }

  get topCategory(): string {
    if (!this.data?.categoryData?.length) return 'None yet';
    const top = this.data.categoryData[0];
    return top.category.charAt(0).toUpperCase() + top.category.slice(1);
  }

  get topSavedCategory(): string {
    if (!this.data?.savedByCategory?.length) return 'None yet';
    const top = this.data.savedByCategory[0];
    return top._id.charAt(0).toUpperCase() + top._id.slice(1);
  }

  get streakEmoji(): string {
    const s = this.data?.streak?.current || 0;
    if (s >= 14) return '🔥🔥';
    if (s >= 7)  return '🔥';
    if (s >= 3)  return '⚡';
    if (s >= 1)  return '✨';
    return '😴';
  }
}