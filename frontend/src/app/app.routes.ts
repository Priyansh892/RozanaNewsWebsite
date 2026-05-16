import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './components/services/auth.service';

import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { AllNewsComponent } from './components/all-news/all-news.component';
import { CountryNewsComponent } from './components/country-news/country-news.component';
import { TopHeadlinesComponent } from './components/top-headlines/top-headlines.component';

const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [
      () => {
        const auth = inject(AuthService);
        const router = inject(Router);
        if (auth.isLoggedIn()) {
          router.navigate(['/all-news']);
        } else {
          router.navigate(['/login']);
        }
        return false;
      },
    ],
  },

  { path: 'all-news', component: AllNewsComponent, canActivate: [authGuard] },
  {
    path: 'country/:iso',
    component: CountryNewsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'top-headlines/:category',
    component: TopHeadlinesComponent,
    canActivate: [authGuard],
  },
  // { path: 'saved-news', component: SavedNewsComponent, canActivate: [authGuard] },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  { path: '**', redirectTo: 'login' },
];
