import { AfterViewInit, Component, computed, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize, forkJoin } from 'rxjs';

import { PageStructure } from '../../../components/page-structure/page-structure';
import { Organizer, OrganizersService } from '../../../services/organizers/organizers-service';
import { ThemeService } from '../../../services/theme/theme-service';
import { MatTooltip } from '@angular/material/tooltip';
import { MatProgressBar } from '@angular/material/progress-bar';

@Component({
  selector: 'app-organizers',
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
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltip,
    MatProgressBar,
  ],
  templateUrl: './organizers.html',
  styleUrl: './organizers.scss',
})
export class Organizers implements AfterViewInit {
  private readonly organizersService = inject(OrganizersService);
  private readonly snackBar = inject(MatSnackBar);

  public readonly themeService = inject(ThemeService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public readonly displayedColumns: string[] = [
    'id',
    'name',
    'email',
    'phone',
    'federalCode',
    // 'confirmed',
  ];

  public readonly dataSource = new MatTableDataSource<Organizer>([]);

  public readonly loading = signal(false);
  public readonly exporting = signal(false);
  public readonly total = signal(0);
  public readonly confirmed = signal(0);

  public readonly editionId = signal<number | null>(22);
  public readonly page = signal(1);
  public readonly perPage = signal(10);
  public readonly search = signal('');
  public readonly lastPage = signal(1);
  public readonly sortBy = signal<string | null>('id');
  public readonly sortDirection = signal<'asc' | 'desc' | ''>('desc');

  public readonly pending = computed(() => this.total() - this.confirmed());
  public readonly confirmationRate = computed(() =>
    this.total() > 0 ? Math.round((this.confirmed() / this.total()) * 100) : 0,
  );

  constructor() {
    this.loadOrganizers();
  }

  public ngAfterViewInit(): void {
    if (this.sort) {
      this.sort.sortChange.subscribe((sort: Sort) => {
        this.sortBy.set(this.mapSortField(sort.active));
        this.sortDirection.set((sort.direction || 'desc') as 'asc' | 'desc' | '');
        this.page.set(1);
        this.loadOrganizers();
      });
    }
  }

  public loadOrganizers(): void {
    this.loading.set(true);

    this.organizersService
      .getAll({
        editionId: this.editionId(),
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
          this.confirmed.set(response.data.filter((item) => item.confirmed).length);

          if (this.paginator) {
            this.paginator.length = response.total;
            this.paginator.pageIndex = response.current_page - 1;
            this.paginator.pageSize = response.per_page;
          }
        },
        error: () => {
          this.snackBar.open('Erro ao carregar organizadores.', 'Fechar', {
            duration: 3000,
          });
        },
      });
  }

  public applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.search.set(value.trim());
    this.page.set(1);
    this.loadOrganizers();
  }

  public clearFilter(): void {
    this.search.set('');
    this.page.set(1);
    this.loadOrganizers();
  }

  public onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.perPage.set(event.pageSize);
    this.loadOrganizers();
  }

  public toggleConfirmation(row: Organizer): void {
    this.organizersService.confirm(row.id, !row.confirmed).subscribe({
      next: (updated) => {
        const nextData = this.dataSource.data.map((item) =>
          item.id === updated.id ? updated : item,
        );

        this.dataSource.data = nextData;
        this.confirmed.set(nextData.filter((item) => item.confirmed).length);

        this.snackBar.open('Confirmação atualizada.', 'Fechar', {
          duration: 2500,
        });
      },
      error: () => {
        this.snackBar.open('Erro ao atualizar confirmação.', 'Fechar', {
          duration: 3000,
        });
      },
    });
  }

  public deleteOrganizer(row: Organizer): void {
    this.organizersService.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Organizador removido.', 'Fechar', {
          duration: 2500,
        });

        if (this.dataSource.data.length === 1 && this.page() > 1) {
          this.page.set(this.page() - 1);
        }

        this.loadOrganizers();
      },
      error: () => {
        this.snackBar.open('Erro ao remover organizador.', 'Fechar', {
          duration: 3000,
        });
      },
    });
  }

  public exportOrganizers(): void {
    this.exporting.set(true);

    const baseFilters = {
      editionId: this.editionId(),
      perPage: 100,
      search: this.search(),
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
    };

    this.organizersService
      .getAll({
        ...baseFilters,
        page: 1,
      })
      .subscribe({
        next: (firstPageResponse) => {
          const requests = [];

          for (let page = 2; page <= firstPageResponse.last_page; page++) {
            requests.push(
              this.organizersService.getAll({
                ...baseFilters,
                page,
              }),
            );
          }

          if (requests.length === 0) {
            this.exporting.set(false);
            this.downloadCsv(firstPageResponse.data);
            return;
          }

          forkJoin(requests)
            .pipe(finalize(() => this.exporting.set(false)))
            .subscribe({
              next: (otherPagesResponses) => {
                const allOrganizers: Organizer[] = [
                  ...firstPageResponse.data,
                  ...otherPagesResponses.flatMap((response) => response.data),
                ];

                this.downloadCsv(allOrganizers);
              },
              error: () => {
                this.snackBar.open('Erro ao exportar organizadores.', 'Fechar', {
                  duration: 3000,
                });
              },
            });
        },
        error: () => {
          this.exporting.set(false);
          this.snackBar.open('Erro ao exportar organizadores.', 'Fechar', {
            duration: 3000,
          });
        },
      });
  }

  private downloadCsv(rows: Organizer[]): void {
    const headers: Record<keyof ExportOrganizerRow, string> = {
      id: 'ID',
      name: 'Nome',
      email: 'E-mail',
      phone: 'Telefone',
      federalCode: 'CPF',
      confirmed: 'Confirmado',
    };

    const exportRows: ExportOrganizerRow[] = rows.map((organizer) => ({
      id: organizer.id,
      name: organizer.name ?? '',
      email: organizer.email ?? '',
      phone: organizer.phone ?? '',
      federalCode: organizer.federalCode ?? '',
      confirmed: organizer.confirmed ? 'Sim' : 'Não',
    }));

    const csvLines: string[] = [];

    csvLines.push(
      Object.values(headers)
        .map((value) => this.escapeCsv(value))
        .join(';'),
    );

    for (const row of exportRows) {
      csvLines.push(
        Object.keys(headers)
          .map((key) => this.escapeCsv(row[key as keyof ExportOrganizerRow]))
          .join(';'),
      );
    }

    const csvContent = '\uFEFF' + csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = this.buildExportFileName();
    link.click();

    URL.revokeObjectURL(url);

    this.snackBar.open('CSV exportado com sucesso.', 'Fechar', {
      duration: 2500,
    });
  }

  private escapeCsv(value: string | number): string {
    const stringValue = String(value ?? '');
    const escapedValue = stringValue.replace(/"/g, '""');
    return `"${escapedValue}"`;
  }

  private buildExportFileName(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');

    return `organizers_${yyyy}-${mm}-${dd}_${hh}-${mi}.csv`;
  }

  private mapSortField(active: string): string {
    switch (active) {
      case 'federalCode':
        return 'federal_code';
      default:
        return active;
    }
  }
}

interface ExportOrganizerRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  federalCode: string;
  confirmed: string;
}
