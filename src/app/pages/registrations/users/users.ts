import { AfterViewInit, Component, computed, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { PageStructure } from '../../../components/page-structure/page-structure';
import { ThemeService } from '../../../services/theme/theme-service';
import {
  UserPasswordResponse,
  UserRecord,
  UsersService,
} from '../../../services/users/users-service';
import { UserFormDialog, UserFormDialogData } from './user-form-dialog/user-form-dialog';
import { UserPasswordDialog } from './user-password-dialog/user-password-dialog';
import { UserDeleteDialog } from './user-delete-dialog/user-delete-dialog';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-users',
  imports: [
    CommonModule,
    PageStructure,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltip,
    MatProgressBar,
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements AfterViewInit {
  private readonly usersService = inject(UsersService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  public readonly themeService = inject(ThemeService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public readonly displayedColumns: string[] = [
    'id',
    'name',
    'email',
    'role',
    'isActive',
    'lastLogin',
    'actions',
  ];

  public readonly dataSource = new MatTableDataSource<UserRecord>([]);

  public readonly loading = signal(false);
  public readonly total = signal(0);
  public readonly page = signal(1);
  public readonly perPage = signal(10);
  public readonly search = signal('');
  public readonly lastPage = signal(1);
  public readonly sortBy = signal<string | null>('id');
  public readonly sortDirection = signal<'asc' | 'desc' | ''>('desc');

  public readonly activeCount = computed(
    () => this.dataSource.data.filter((item) => item.isActive).length,
  );

  constructor() {
    this.loadUsers();
  }

  public ngAfterViewInit(): void {
    if (this.sort) {
      this.sort.sortChange.subscribe((sort: Sort) => {
        this.sortBy.set(this.mapSortField(sort.active));
        this.sortDirection.set((sort.direction || 'desc') as 'asc' | 'desc' | '');
        this.page.set(1);
        this.loadUsers();
      });
    }
  }

  public loadUsers(): void {
    this.loading.set(true);

    this.usersService
      .getAll({
        page: this.page(),
        perPage: this.perPage(),
        search: this.search(),
        sortBy: this.sortBy(),
        sortDirection: this.sortDirection(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.data;
          this.total.set(response.total);
          this.lastPage.set(response.last_page);

          if (this.paginator) {
            this.paginator.length = response.total;
            this.paginator.pageIndex = response.current_page - 1;
            this.paginator.pageSize = response.per_page;
          }
        },
        error: () => {
          this.snackBar.open('Erro ao carregar usuários.', 'Fechar', {
            duration: 3000,
          });
        },
      });
  }

  public applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.search.set(value.trim());
    this.page.set(1);
    this.loadUsers();
  }

  public clearFilter(): void {
    this.search.set('');
    this.page.set(1);
    this.loadUsers();
  }

  public onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.perPage.set(event.pageSize);
    this.loadUsers();
  }

  public openCreateDialog(): void {
    const dialogRef = this.dialog.open(UserFormDialog, {
      width: '560px',
      maxWidth: '95vw',
      data: {
        mode: 'create',
      } satisfies UserFormDialogData,
    });

    dialogRef.afterClosed().subscribe((payload) => {
      if (!payload) {
        return;
      }

      this.usersService.create(payload).subscribe({
        next: (response) => {
          this.snackBar.open('Usuário criado com sucesso.', 'Fechar', {
            duration: 2500,
          });

          this.openPasswordDialog(response);
          this.page.set(1);
          this.loadUsers();
        },
        error: () => {
          this.snackBar.open('Erro ao criar usuário.', 'Fechar', {
            duration: 3000,
          });
        },
      });
    });
  }

  public openEditDialog(row: UserRecord): void {
    const dialogRef = this.dialog.open(UserFormDialog, {
      width: '560px',
      maxWidth: '95vw',
      data: {
        mode: 'edit',
        user: row,
      } satisfies UserFormDialogData,
    });

    dialogRef.afterClosed().subscribe((payload) => {
      if (!payload) {
        return;
      }

      this.usersService.update(row.id, payload).subscribe({
        next: () => {
          this.snackBar.open('Usuário atualizado com sucesso.', 'Fechar', {
            duration: 2500,
          });

          this.loadUsers();
        },
        error: () => {
          this.snackBar.open('Erro ao atualizar usuário.', 'Fechar', {
            duration: 3000,
          });
        },
      });
    });
  }

  public openResetPasswordDialog(row: UserRecord): void {
    this.usersService.resetPassword(row.id).subscribe({
      next: (response) => {
        this.snackBar.open('Senha redefinida com sucesso.', 'Fechar', {
          duration: 2500,
        });

        this.openPasswordDialog(response);
      },
      error: () => {
        this.snackBar.open('Erro ao redefinir senha.', 'Fechar', {
          duration: 3000,
        });
      },
    });
  }

  public openDeleteDialog(row: UserRecord): void {
    const dialogRef = this.dialog.open(UserDeleteDialog, {
      width: '420px',
      maxWidth: '95vw',
      data: row,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.usersService.delete(row.id).subscribe({
        next: () => {
          this.snackBar.open('Usuário removido com sucesso.', 'Fechar', {
            duration: 2500,
          });

          if (this.dataSource.data.length === 1 && this.page() > 1) {
            this.page.set(this.page() - 1);
          }

          this.loadUsers();
        },
        error: (error: HttpErrorResponse) => {
          console.error(error);

          let message = 'Erro ao remover usuário.';

          if (typeof error.error === 'string' && error.error.trim()) {
            message = error.error;
          } else if (error.error?.message) {
            message = error.error.message;
          } else if (error.message) {
            message = error.message;
          }

          this.snackBar.open(message, 'Fechar', {
            duration: 3000,
          });
        },
      });
    });
  }

  public roleLabel(role: string): string {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Administrador';
      case 'organizer':
        return 'Organizador';
      case 'credential':
        return 'Credenciamento';
      default:
        return role;
    }
  }

  private openPasswordDialog(response: UserPasswordResponse): void {
    this.dialog.open(UserPasswordDialog, {
      width: '520px',
      maxWidth: '95vw',
      data: response,
    });
  }

  private mapSortField(active: string): string {
    switch (active) {
      case 'isActive':
        return 'is_active';
      case 'lastLogin':
        return 'last_login_at';
      default:
        return active;
    }
  }
}
