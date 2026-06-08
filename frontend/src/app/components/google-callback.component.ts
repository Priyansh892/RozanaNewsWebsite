import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from './services/auth.service';
@Component({
  standalone: true,
  selector: 'app-google-callback',
  template: `
    <div style="display:flex;align-items:center;justify-content:center;min-height:60vh;font-family:sans-serif;color:#888;">
      Signing you in…
    </div>
  `,
})
export class GoogleCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  ngOnInit(): void {
    const encodedUser = this.route.snapshot.queryParamMap.get('user');
    this.authService.handleGoogleCallback(encodedUser);
  }
}