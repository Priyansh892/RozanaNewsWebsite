import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';

import { AllNewsComponent } from './components/all-news/all-news.component'
import { CountryNewsComponent } from './components/country-news/country-news.component';
import { TopHeadlinesComponent } from './components/top-headlines/top-headlines.component';
//import { SavedNewsComponent } from './components/saved-news/saved-news.component';

export const routes: Routes = [
  { path: 'all-news', component: AllNewsComponent },
  { path: 'country/:iso', component: CountryNewsComponent },
  { path: 'top-headlines/:category', component: TopHeadlinesComponent },
  // { path: 'saved-news',component:SavedNewsComponent},
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: '**', redirectTo: 'register' } // Redirect unknown routes to home
];
