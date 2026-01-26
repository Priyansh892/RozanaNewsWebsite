import { provideServerRendering } from '@angular/platform-server';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config.server';

export const bootstrap = () =>
  bootstrapApplication(AppComponent, {
    ...appConfig,
    providers: [...appConfig.providers, provideServerRendering()],
  });

export default bootstrap;
