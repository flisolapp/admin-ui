import { AfterViewInit, Component, computed, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';

import { PageStructure } from '../../../components/page-structure/page-structure';
import { ThemeService } from '../../../services/theme/theme-service';
import {
  CertificatePreviewItem,
  CertificatesService,
} from '../../../services/certificates/certificates-service';
import { AttendanceKind, AttendanceService } from '../../../services/attendance/attendance-service';
import {
  ConfirmReleaseDialog,
  ConfirmReleaseDialogData,
} from './confirm-release-dialog/confirm-release-dialog';

export type RoleFilter = 'Todos' | 'Organizador' | 'Colaborador' | 'Palestrante' | 'Participante';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageStructure,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './certificate-review.component.html',
  styleUrl: './certificate-review.component.scss',
})
export class CertificateReview implements AfterViewInit {
  private readonly certificatesService = inject(CertificatesService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  public readonly themeService = inject(ThemeService);

  @ViewChild(MatSort) sort!: MatSort;

  public readonly loading = signal(false);
  public readonly releasing = signal(false);
  public readonly cancellingKeys = signal<Record<string, boolean>>({});

  public readonly allItems = signal<CertificatePreviewItem[]>([]);
  public readonly editionYear = signal<string>('');
  public readonly editionId = signal<number | null>(null);

  public readonly search = signal('');
  public readonly roleFilter = signal<RoleFilter>('Todos');

  public readonly sortBy = signal<string>('name');
  public readonly sortDirection = signal<'asc' | 'desc' | ''>('asc');

  public readonly dataSource = new MatTableDataSource<CertificatePreviewItem>([]);

  public readonly displayedColumns = ['name', 'email', 'federalCode', 'role', 'status', 'actions'];

  // ── Items matching only the current search text (role-agnostic) ──────────
  // Used to compute per-role pill counts so they stay accurate while searching.
  private readonly searchMatchedItems = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.allItems();

    return this.allItems().filter(
      (item) =>
        item.name?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.federal_code?.toLowerCase().includes(term) ||
        item.talk_title?.toLowerCase().includes(term),
    );
  });

  // ── Counts per role ───────────────────────────────────────────────────────
  public readonly total = computed(() => this.allItems().length);
  public readonly countOrganizer = computed(
    () => this.searchMatchedItems().filter((i) => i.role === 'Organizador').length,
  );
  public readonly countCollaborator = computed(
    () => this.searchMatchedItems().filter((i) => i.role === 'Colaborador').length,
  );
  public readonly countSpeaker = computed(
    () => this.searchMatchedItems().filter((i) => i.role === 'Palestrante').length,
  );
  public readonly countParticipant = computed(
    () => this.searchMatchedItems().filter((i) => i.role === 'Participante').length,
  );
  public readonly countAll = computed(() => this.searchMatchedItems().length);

  // dataSource.data is already filtered manually in applyTableFilter — filteredData == data
  public readonly filteredTotal = signal(0);

  constructor() {
    this.loadPreview();
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;

    // Custom sort accessor for nested/mapped fields
    this.dataSource.sortingDataAccessor = (item: CertificatePreviewItem, header: string) => {
      switch (header) {
        case 'name':
          return item.name?.toLowerCase() ?? '';
        case 'email':
          return item.email?.toLowerCase() ?? '';
        case 'federalCode':
          return item.federal_code?.toLowerCase() ?? '';
        case 'role':
          return item.role?.toLowerCase() ?? '';
        case 'status':
          return item.already_released ? 'z' : 'a';
        default:
          return '';
      }
    };

    this.sort.sortChange.subscribe((s: Sort) => {
      this.sortBy.set(s.active);
      this.sortDirection.set((s.direction || 'asc') as 'asc' | 'desc' | '');
    });
  }

  public loadPreview(): void {
    this.loading.set(true);

    this.certificatesService
      .getPreview()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.allItems.set(response.data);
          this.editionYear.set(response.edition_year);
          this.editionId.set(response.edition_id);
          this.applyTableFilter();
        },
        error: () => {
          this.snackBar.open('Erro ao carregar candidatos a certificados.', 'Fechar', {
            duration: 4000,
          });
        },
      });
  }

  public applySearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.search.set(value);
    this.applyTableFilter();
  }

  public clearSearch(): void {
    this.search.set('');
    this.applyTableFilter();
  }

  public setRoleFilter(role: RoleFilter): void {
    this.roleFilter.set(role);
    this.applyTableFilter();
  }

  private applyTableFilter(): void {
    const term = this.search().trim().toLowerCase();
    const role = this.roleFilter();

    // Build the filtered array and push into dataSource.data
    // (MatTableDataSource.filter is for string matching; we do it manually for multi-field)
    const source = this.allItems().filter((item) => {
      const matchRole = role === 'Todos' || item.role === role;
      if (!matchRole) return false;
      if (!term) return true;

      return (
        item.name?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.federal_code?.toLowerCase().includes(term) ||
        item.talk_title?.toLowerCase().includes(term)
      );
    });

    this.dataSource.data = source;
    this.filteredTotal.set(source.length);
  }

  // Cancel only for items NOT yet released
  public cancel(item: CertificatePreviewItem): void {
    if (item.already_released) return;

    const key = this.itemKey(item);
    if (this.isCancelling(item)) return;

    this.setCancelling(key, true);

    const kind = this.roleToKind(item.role);
    if (!kind || !item.role_record_id) {
      this.snackBar.open('Tipo de registro inválido para cancelamento.', 'Fechar', {
        duration: 3000,
      });
      this.setCancelling(key, false);
      return;
    }

    this.attendanceService
      .toggleCheckIn(kind, item.role_record_id, false)
      .pipe(finalize(() => this.setCancelling(key, false)))
      .subscribe({
        next: () => {
          this.allItems.update((current) => current.filter((i) => this.itemKey(i) !== key));
          this.applyTableFilter();
          this.snackBar.open('Presença cancelada. Registro removido da lista.', 'Fechar', {
            duration: 2500,
          });
        },
        error: (err) => {
          const message = err?.error?.message || err?.error?.error || 'Erro ao cancelar presença.';
          this.snackBar.open(message, 'Fechar', { duration: 5000 });
        },
      });
  }

  public openReleaseDialog(): void {
    if (this.releasing()) return;

    const dialogRef: MatDialogRef<ConfirmReleaseDialog> = this.dialog.open(ConfirmReleaseDialog, {
      width: '480px',
      maxWidth: '95vw',
      data: { total: this.total() } as ConfirmReleaseDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) this.release();
    });
  }

  private release(): void {
    this.releasing.set(true);

    this.certificatesService
      .release()
      .pipe(finalize(() => this.releasing.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Certificados liberados com sucesso!', 'Fechar', {
            duration: 4000,
          });
          this.loadPreview();
        },
        error: (err) => {
          const message =
            err?.error?.error || err?.error?.message || 'Erro ao liberar certificados.';
          this.snackBar.open(message, 'Fechar', { duration: 6000 });
        },
      });
  }

  public isCancelling(item: CertificatePreviewItem): boolean {
    return !!this.cancellingKeys()[this.itemKey(item)];
  }

  public trackByItem(_: number, item: CertificatePreviewItem): string {
    return this.itemKey(item);
  }

  private itemKey(item: CertificatePreviewItem): string {
    return `${item.role}-${item.role_record_id}-${item.person_id}`;
  }

  private setCancelling(key: string, value: boolean): void {
    this.cancellingKeys.update((state) => {
      if (value) return { ...state, [key]: true };
      const next = { ...state };
      delete next[key];
      return next;
    });
  }

  private roleToKind(role: string): AttendanceKind | null {
    switch (role) {
      case 'Participante':
        return 'participant';
      case 'Colaborador':
        return 'collaborator';
      case 'Organizador':
        return 'organizer';
      case 'Palestrante':
        return 'speaker_talk';
      default:
        return null;
    }
  }
}
