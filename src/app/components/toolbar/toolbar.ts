import { Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { ThemeSelector } from '../theme-selector/theme-selector';
import { ThemeService } from '../../services/theme/theme-service';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { ConfirmLogoutDialog } from './confirm-logout-dialog/confirm-logout-dialog';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-toolbar',
  imports: [
    NgOptimizedImage,
    MatIconButton,
    MatTooltip,
    MatIcon,
    TranslatePipe,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    ThemeSelector,
    MatButton,
    RouterLink,
  ],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class Toolbar {
  public registrationItems = [
    // { label: 'Edições', route: '/registrations/editions' },
    { label: 'Palestras', route: '/registrations/talks' },
    // { label: 'Cronograma', route: '/registrations/schedule' },
    { label: 'Participantes', route: '/registrations/participants' },
    { label: 'Colaboradores', route: '/registrations/collaborators' },
    { label: 'Organizadores', route: '/registrations/organizers' },
    { label: 'Usuários', route: '/registrations/users' },
  ];

  constructor(
    public readonly themeService: ThemeService,
    public readonly dialog: MatDialog,
    public readonly authService: AuthService,
  ) {}

  public logout(): void {
    const confirmRef: MatDialogRef<ConfirmLogoutDialog> = this.dialog.open(ConfirmLogoutDialog);

    confirmRef.afterClosed().subscribe((confirmed: boolean): void => {
      if (confirmed) {
        this.authService.logout();
      }
    });
  }
}
