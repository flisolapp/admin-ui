import { Component, OnInit } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { ThemeService } from '../../services/theme/theme-service';

@Component({
  selector: 'app-theme-selector',
  imports: [MatIconButton, MatTooltip, MatIcon, TranslatePipe],
  templateUrl: './theme-selector.html',
  styleUrl: './theme-selector.scss',
})
export class ThemeSelector implements OnInit {
  constructor(public readonly themeService: ThemeService) {}

  public ngOnInit(): void {
    this.themeService.init();
  }

  public toggleColorScheme(): void {
    this.themeService.toggleColorScheme();
  }
}
