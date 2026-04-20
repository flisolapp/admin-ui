import { Component, signal, WritableSignal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ThemeSelector } from '../theme-selector/theme-selector';
import { ThemeService } from '../../services/theme/theme-service';

// FIX: Avoid named import for soon-to-be ESM-only default exports
import packageInfo from '../../../../package.json';

@Component({
  selector: 'app-page-auth',
  imports: [NgOptimizedImage, ThemeSelector],
  templateUrl: './page-auth.html',
  styleUrl: './page-auth.scss',
})
export class PageAuth {
  /* v8 ignore next -- @preserve */
  public version: WritableSignal<string> = signal<string>(packageInfo.version);

  constructor(public readonly themeService: ThemeService) {}
}
