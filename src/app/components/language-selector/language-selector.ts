import { Component, OnInit, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { Language, LanguageService } from '../../services/language/language-service';
import { ThemeService } from '../../services/theme/theme-service';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-language-selector',
  imports: [
    NgOptimizedImage,
    MatIconButton,
    MatTooltip,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatIcon,
  ],
  templateUrl: './language-selector.html',
  styleUrl: './language-selector.scss',
})
export class LanguageSelector implements OnInit {
  /* v8 ignore next -- @preserve */
  public language = signal<Language | null>(null);

  constructor(
    public readonly languageService: LanguageService,
    public readonly themeService: ThemeService,
  ) {}

  public ngOnInit(): void {
    this.language.set(this.languageService.getSelected());
  }

  public selectLanguage(item: Language): void {
    this.language.set(item);
    this.languageService.setSelected(item);
  }
}
