import { Injectable, signal } from '@angular/core';
import { STORAGE_KEYS } from '../../constants/storage-keys';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  /* v8 ignore next -- @preserve */
  public readonly darkMode = signal<boolean>(false);

  public init(): void {
    let isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const stored = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
    if (stored !== null) {
      isDark = stored === 'true';
    }

    this.darkMode.set(isDark);
    this.applyColorScheme();
  }

  public setDarkMode(value: boolean): void {
    this.darkMode.set(value);
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(value));
    this.applyColorScheme();
  }

  public toggleColorScheme(): void {
    this.setDarkMode(!this.darkMode());
  }

  private applyColorScheme(): void {
    document.body.classList.toggle('darkMode', this.darkMode());

    if (window.flutter_inappwebview) {
      window.flutter_inappwebview.callHandler('setDarkMode', this.darkMode());
    }
  }
}
