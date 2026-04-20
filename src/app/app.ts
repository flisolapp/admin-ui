import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme/theme-service';
import { LanguageService } from './services/language/language-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'admin-ui';

  constructor(
    private readonly themeService: ThemeService,
    private readonly languageService: LanguageService,
  ) {
    themeService.init();
    languageService.init();
  }
}
