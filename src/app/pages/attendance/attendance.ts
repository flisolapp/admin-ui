import {
  AfterViewInit,
  Component,
  computed,
  effect,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { PageStructure } from '../../components/page-structure/page-structure';
import { ThemeService } from '../../services/theme/theme-service';
import { AttendanceRecord, AttendanceService } from '../../services/attendance/attendance-service';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    PageStructure,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './attendance.html',
  styleUrl: './attendance.scss',
})
export class Attendance implements AfterViewInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly snackBar = inject(MatSnackBar);

  public readonly themeService = inject(ThemeService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public readonly displayedColumns: string[] = [
    'id',
    'kind',
    'name',
    // 'talk',
    // 'email',
    // 'phone',
    'federalCode',
    'checkedIn',
    'actions',
  ];

  public readonly dataSource = new MatTableDataSource<AttendanceRecord>([]);

  public readonly loading = signal(false);
  public readonly total = signal(0);
  public readonly page = signal(1);
  public readonly perPage = signal(10);
  public readonly search = signal('');
  public readonly sortBy = signal<string | null>('name');
  public readonly sortDirection = signal<'asc' | 'desc' | ''>('asc');

  public readonly checkedInCount = computed(
    () => this.dataSource.data.filter((item) => item.checked_in).length,
  );

  constructor() {
    effect(() => {
      this.page();
      this.perPage();
      this.search();
      this.sortBy();
      this.sortDirection();
    });

    this.loadAttendance();
  }

  public ngAfterViewInit(): void {
    this.sort.sortChange.subscribe((sort: Sort) => {
      this.sortBy.set(this.mapSortField(sort.active));
      this.sortDirection.set((sort.direction || 'asc') as 'asc' | 'desc' | '');
      this.page.set(1);
      this.loadAttendance();
    });
  }

  public loadAttendance(): void {
    this.loading.set(true);

    this.attendanceService
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

          if (this.paginator) {
            this.paginator.length = response.total;
            this.paginator.pageIndex = response.current_page - 1;
            this.paginator.pageSize = response.per_page;
          }
        },
        error: () => {
          this.snackBar.open('Erro ao carregar credenciamento.', 'Fechar', {
            duration: 3000,
          });
        },
      });
  }

  public applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.search.set(value.trim());
    this.page.set(1);
    this.loadAttendance();
  }

  public clearFilter(): void {
    this.search.set('');
    this.page.set(1);
    this.loadAttendance();
  }

  public onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.perPage.set(event.pageSize);
    this.loadAttendance();
  }

  public toggleCheckIn(row: AttendanceRecord): void {
    const nextValue = !row.checked_in;

    this.attendanceService.toggleCheckIn(row.kind, row.id, nextValue).subscribe({
      next: (updated) => {
        this.dataSource.data = this.dataSource.data.map((item) =>
          item.kind === updated.kind && item.id === updated.id ? updated : item,
        );

        this.snackBar.open(
          updated.checked_in ? 'Check-in realizado.' : 'Check-in removido.',
          'Fechar',
          { duration: 2500 },
        );
      },
      error: () => {
        this.snackBar.open('Erro ao atualizar check-in.', 'Fechar', {
          duration: 3000,
        });
      },
    });
  }

  public canCheckOut(row: AttendanceRecord | null | undefined): boolean {
    if (!row) {
      return false;
    }

    return !!row.checked_in;
  }

  public canPrintLabel(row: AttendanceRecord | null | undefined): boolean {
    if (!row) {
      return false;
    }

    // // for now:
    // // can print only after check-in
    // // and must not allow after check-out, when that field exists
    // return !!row.checked_in && !row.checked_out;
    // return !!row.checked_in && !Boolean(row.checked_out);
    // return !!row.checked_in && !Boolean((row as AttendanceRecord & { checked_out?: boolean }).checked_out);
    return !!row.checked_in;
  }

  public checkOut(row: AttendanceRecord): void {
    this.suspendedAction('Check-Out', row);
  }

  public printLabel(row: AttendanceRecord): void {
    this.suspendedAction('Imprimir etiqueta', row);
  }

  public suspendedAction(action: string, row: AttendanceRecord): void {
    this.snackBar.open(
      `${action} ainda não está disponível para ${row.name || 'registro'}.`,
      'Fechar',
      { duration: 2500 },
    );
  }

  public getTalkSummary(row: AttendanceRecord): string {
    if (row.kind !== 'speaker_talk') {
      return '—';
    }

    const parts = [row.talk_title, row.talk_shift, row.talk_subject].filter(Boolean);
    return parts.length ? parts.join(' · ') : '—';
  }

  public getKindLabel(row: AttendanceRecord): string {
    return row.kind_label || '—';
  }

  private mapSortField(field: string): string {
    switch (field) {
      case 'federalCode':
        return 'federal_code';
      case 'checkedIn':
        return 'checked_in';
      case 'talk':
        return 'talk_title';
      default:
        return field;
    }
  }
}
