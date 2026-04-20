import { AfterViewInit, Component, inject, signal, ViewChild } from '@angular/core';
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
import {
  Collaborator,
  CollaboratorsService,
} from '../../../services/collaborators/collaborators-service';
import { ThemeService } from '../../../services/theme/theme-service';
import { MatTooltip } from '@angular/material/tooltip';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Talk } from '../../../services/talks/talks-service';

@Component({
  selector: 'app-collaborators',
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
  templateUrl: './collaborators.html',
  styleUrl: './collaborators.scss',
})
export class Collaborators implements AfterViewInit {
  private readonly collaboratorsService = inject(CollaboratorsService);
  private readonly snackBar = inject(MatSnackBar);

  public readonly themeService = inject(ThemeService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public readonly displayedColumns: string[] = [
    'id',
    'name',
    'email',
    // 'phone',
    // 'federal_code',
    'approved',
    // 'confirmed',
    // 'actions',
  ];

  public readonly columnsToDisplayWithExpand = [...this.displayedColumns, 'expand'];
  public readonly dataSource = new MatTableDataSource<Collaborator>([]);

  public readonly loading = signal(false);
  public readonly exporting = signal(false);
  public readonly total = signal(0);
  public readonly approved = signal(0);
  public readonly confirmed = signal(0);

  public readonly editionId = signal<number | null>(22);
  public readonly page = signal(1);
  public readonly perPage = signal(10);
  public readonly search = signal('');
  public readonly lastPage = signal(1);
  public readonly sortBy = signal<string | null>('id');
  public readonly sortDirection = signal<'asc' | 'desc' | ''>('desc');

  public expandedElement: Collaborator | null = null;

  // public readonly pending = computed(() => this.total() - this.confirmed());
  // public readonly confirmationRate = computed(() =>
  //   this.total() > 0 ? Math.round((this.confirmed() / this.total()) * 100) : 0,
  // );

  constructor() {
    this.loadCollaborators();
  }

  public ngAfterViewInit(): void {
    if (this.sort) {
      this.sort.sortChange.subscribe((sort: Sort) => {
        this.sortBy.set(sort.active);
        this.sortDirection.set((sort.direction || 'desc') as 'asc' | 'desc' | '');
        this.page.set(1);
        this.loadCollaborators();
      });
    }
  }

  public loadCollaborators(): void {
    this.loading.set(true);

    this.collaboratorsService
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
          this.approved.set(response.data.filter((item) => item.approved).length);
          this.confirmed.set(response.data.filter((item) => item.confirmed).length);
          this.expandedElement = null;

          if (this.paginator) {
            this.paginator.length = response.total;
            this.paginator.pageIndex = response.current_page - 1;
            this.paginator.pageSize = response.per_page;
          }
        },
        error: () => {
          this.snackBar.open('Erro ao carregar colaboradores.', 'Fechar', {
            duration: 3000,
          });
        },
      });
  }

  public applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.search.set(value.trim());
    this.page.set(1);
    this.loadCollaborators();
  }

  public clearFilter(): void {
    this.search.set('');
    this.page.set(1);
    this.loadCollaborators();
  }

  public onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.perPage.set(event.pageSize);
    this.loadCollaborators();
  }

  public isExpanded(element: Collaborator): boolean {
    return this.expandedElement === element;
  }

  public toggle(element: Collaborator): void {
    this.expandedElement = this.isExpanded(element) ? null : element;
  }

  public toggleApproval(row: Talk): void {
    this.collaboratorsService.approve(row.id, !row.approved).subscribe({
      next: (updated) => {
        const nextData = this.dataSource.data.map((item) =>
          item.id === updated.id ? updated : item,
        );

        this.dataSource.data = nextData;
        this.approved.set(nextData.filter((item) => item.approved).length);

        this.snackBar.open('Aprovação atualizada.', 'Fechar', {
          duration: 2500,
        });
      },
      error: () => {
        this.snackBar.open('Erro ao atualizar aprovação.', 'Fechar', {
          duration: 3000,
        });
      },
    });
  }

  public toggleConfirmation(row: Collaborator): void {
    this.collaboratorsService.confirm(row.id, !row.confirmed).subscribe({
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

  public editCollaborator(row: Collaborator): void {
    console.log('edit', row);
  }

  public deleteCollaborator(row: Collaborator): void {
    this.collaboratorsService.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Colaborador removido.', 'Fechar', {
          duration: 2500,
        });

        if (this.dataSource.data.length === 1 && this.page() > 1) {
          this.page.set(this.page() - 1);
        }

        this.loadCollaborators();
      },
      error: () => {
        this.snackBar.open('Erro ao remover colaborador.', 'Fechar', {
          duration: 3000,
        });
      },
    });
  }

  public exportCollaborators(): void {
    this.exporting.set(true);

    const baseFilters = {
      editionId: this.editionId(),
      perPage: 100,
      search: this.search(),
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
    };

    this.collaboratorsService
      .getAll({
        ...baseFilters,
        page: 1,
      })
      .pipe(finalize(() => this.exporting.set(false)))
      .subscribe({
        next: (firstPageResponse) => {
          const requests = [];

          for (let page = 2; page <= firstPageResponse.last_page; page++) {
            requests.push(
              this.collaboratorsService.getAll({
                ...baseFilters,
                page,
              }),
            );
          }

          if (requests.length === 0) {
            this.downloadCsv(firstPageResponse.data);
            return;
          }

          forkJoin(requests).subscribe({
            next: (otherPagesResponses) => {
              const allCollaborators: Collaborator[] = [
                ...firstPageResponse.data,
                ...otherPagesResponses.flatMap((response) => response.data),
              ];

              this.downloadCsv(allCollaborators);
            },
            error: () => {
              this.snackBar.open('Erro ao exportar colaboradores.', 'Fechar', {
                duration: 3000,
              });
            },
          });
        },
        error: () => {
          this.snackBar.open('Erro ao exportar colaboradores.', 'Fechar', {
            duration: 3000,
          });
        },
      });
  }

  private downloadCsv(rows: Collaborator[]): void {
    const headers: Record<keyof ExportCollaboratorRow, string> = {
      id: 'ID',
      edition_id: 'Edição ID',
      name: 'Nome',
      email: 'E-mail',
      phone: 'Telefone',
      federal_code: 'CPF',
      approved: 'Aprovado',
      approved_at: 'Aprovado em',
      confirmed: 'Confirmado',
      confirmed_at: 'Confirmado em',
      areas: 'Áreas',
      shifts: 'Turnos',
    };

    const exportRows: ExportCollaboratorRow[] = rows.map((row) => ({
      id: row.id,
      edition_id: row.edition_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      federal_code: row.federal_code ?? '',
      approved: row.approved ? 'Sim' : 'Não',
      approved_at: row.approved_at ?? '',
      confirmed: row.confirmed ? 'Sim' : 'Não',
      confirmed_at: row.confirmed_at ?? '',
      areas: row.areas.map((area) => area.name).join(', '),
      shifts: row.shifts.map((shift) => shift.name).join(', '),
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
          .map((key) => this.escapeCsv(row[key as keyof ExportCollaboratorRow]))
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

    return `collaborators_${yyyy}-${mm}-${dd}_${hh}-${mi}.csv`;
  }
}

interface ExportCollaboratorRow {
  id: number;
  edition_id: number;
  name: string;
  email: string;
  phone: string;
  federal_code: string;
  approved: string;
  approved_at: string;
  confirmed: string;
  confirmed_at: string;
  areas: string;
  shifts: string;
}
