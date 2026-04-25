import { AfterViewInit, Component, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize, forkJoin } from 'rxjs';

import { PageStructure } from '../../../components/page-structure/page-structure';
import {
  EditionPlace,
  EditionPlaceKind,
  EditionPlacesService,
} from '../../../services/edition-places/edition-places-service';
import { ThemeService } from '../../../services/theme/theme-service';
import { MatTooltip } from '@angular/material/tooltip';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { EditionPlaceFormDialog } from './edition-place-form-dialog/edition-place-form-dialog';
import { EditionPlaceDeleteDialog } from './edition-place-delete-dialog/edition-place-delete-dialog';
import { MatDivider } from '@angular/material/list';

@Component({
  selector: 'app-edition-places',
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
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltip,
    MatProgressBar,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatDivider,
  ],
  templateUrl: './edition-places.html',
  styleUrl: './edition-places.scss',
})
export class EditionPlaces implements AfterViewInit {
  private readonly editionPlacesService = inject(EditionPlacesService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  public readonly themeService = inject(ThemeService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public readonly displayedColumns: string[] = [
    'id',
    'name',
    'kind',
    'floor',
    'capacity',
    'active',
    'actions',
  ];

  public readonly dataSource = new MatTableDataSource<EditionPlace>([]);

  public readonly loading = signal(false);
  public readonly exporting = signal(false);
  public readonly total = signal(0);

  public readonly editionId = signal<number | null>(22);
  public readonly page = signal(1);
  public readonly perPage = signal(10);
  public readonly search = signal('');
  public readonly lastPage = signal(1);
  public readonly sortBy = signal<string | null>('id');
  public readonly sortDirection = signal<'asc' | 'desc' | ''>('desc');

  constructor() {
    this.loadEditionPlaces();
  }

  public ngAfterViewInit(): void {
    if (this.sort) {
      this.sort.sortChange.subscribe((sort: Sort) => {
        this.sortBy.set(this.mapSortField(sort.active));
        this.sortDirection.set((sort.direction || 'desc') as 'asc' | 'desc' | '');
        this.page.set(1);
        this.loadEditionPlaces();
      });
    }
  }

  public loadEditionPlaces(): void {
    this.loading.set(true);

    this.editionPlacesService
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

          if (this.paginator) {
            this.paginator.length = response.total;
            this.paginator.pageIndex = response.current_page - 1;
            this.paginator.pageSize = response.per_page;
          }
        },
        error: () => {
          this.snackBar.open('Erro ao carregar locais.', 'Fechar', {
            duration: 3000,
          });
        },
      });
  }

  public applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.search.set(value.trim());
    this.page.set(1);
    this.loadEditionPlaces();
  }

  public clearFilter(): void {
    this.search.set('');
    this.page.set(1);
    this.loadEditionPlaces();
  }

  public onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.perPage.set(event.pageSize);
    this.loadEditionPlaces();
  }

  public openCreateDialog(): void {
    const editionId = this.editionId();

    if (editionId == null) {
      this.snackBar.open('Edição não informada.', 'Fechar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(EditionPlaceFormDialog, {
      width: '560px',
      data: { mode: 'create', editionId },
    });

    dialogRef.afterClosed().subscribe((payload) => {
      if (!payload) return;

      this.editionPlacesService.create(payload).subscribe({
        next: () => {
          this.snackBar.open('Local criado com sucesso.', 'Fechar', { duration: 2500 });
          this.loadEditionPlaces();
        },
        error: () => {
          this.snackBar.open('Erro ao criar local.', 'Fechar', { duration: 3000 });
        },
      });
    });
  }

  public openEditDialog(row: EditionPlace): void {
    const editionId = this.editionId();

    if (editionId == null) {
      this.snackBar.open('Edição não informada.', 'Fechar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(EditionPlaceFormDialog, {
      width: '560px',
      data: { mode: 'edit', editionId, editionPlace: row },
    });

    dialogRef.afterClosed().subscribe((payload) => {
      if (!payload) return;

      this.editionPlacesService.update(row.id, payload).subscribe({
        next: () => {
          this.snackBar.open('Local atualizado com sucesso.', 'Fechar', { duration: 2500 });
          this.loadEditionPlaces();
        },
        error: () => {
          this.snackBar.open('Erro ao atualizar local.', 'Fechar', { duration: 3000 });
        },
      });
    });
  }

  public openDeleteDialog(row: EditionPlace): void {
    const dialogRef = this.dialog.open(EditionPlaceDeleteDialog, {
      width: '420px',
      maxWidth: '95vw',
      data: row,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.editionPlacesService.delete(row.id).subscribe({
        next: () => {
          this.snackBar.open('Local removido.', 'Fechar', { duration: 2500 });

          if (this.dataSource.data.length === 1 && this.page() > 1) {
            this.page.set(this.page() - 1);
          }

          this.loadEditionPlaces();
        },
        error: () => {
          this.snackBar.open('Erro ao remover local.', 'Fechar', { duration: 3000 });
        },
      });
    });
  }

  public printQrCode(row: EditionPlace): void {
    const printed = this.editionPlacesService.printQrCode(row, this.getKindLabel(row.kind));

    if (!printed) {
      this.snackBar.open('Não foi possível gerar a impressão.', 'Fechar', {
        duration: 3000,
      });
    }
  }

  public exportEditionPlaces(): void {
    this.exporting.set(true);

    const baseFilters = {
      editionId: this.editionId(),
      perPage: 100,
      search: this.search(),
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
    };

    this.editionPlacesService
      .getAll({
        ...baseFilters,
        page: 1,
      })
      .subscribe({
        next: (firstPageResponse) => {
          const requests = [];

          for (let page = 2; page <= firstPageResponse.last_page; page++) {
            requests.push(
              this.editionPlacesService.getAll({
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
                const allPlaces: EditionPlace[] = [
                  ...firstPageResponse.data,
                  ...otherPagesResponses.flatMap((response) => response.data),
                ];

                this.downloadCsv(allPlaces);
              },
              error: () => {
                this.snackBar.open('Erro ao exportar locais.', 'Fechar', {
                  duration: 3000,
                });
              },
            });
        },
        error: () => {
          this.exporting.set(false);
          this.snackBar.open('Erro ao exportar locais.', 'Fechar', {
            duration: 3000,
          });
        },
      });
  }

  public getKindLabel(kind: EditionPlaceKind): string {
    switch (kind) {
      case 'room':
        return 'Sala';
      case 'lab':
        return 'Laboratório';
      case 'main_space':
        return 'Espaço principal';
      case 'talk_room':
        return 'Sala de palestra';
      case 'food_area':
        return 'Área de alimentação';
      case 'support':
        return 'Apoio';
      case 'closing':
        return 'Encerramento';
      default:
        return kind;
    }
  }

  private downloadCsv(rows: EditionPlace[]): void {
    const headers: Record<keyof ExportEditionPlaceRow, string> = {
      id: 'ID',
      uuid: 'UUID',
      name: 'Nome',
      kind: 'Tipo',
      description: 'Descrição',
      floor: 'Andar',
      capacity: 'Capacidade',
      active: 'Ativo',
    };

    const exportRows: ExportEditionPlaceRow[] = rows.map((place) => ({
      id: place.id,
      uuid: place._id,
      name: place.name ?? '',
      kind: this.getKindLabel(place.kind),
      description: place.description ?? '',
      floor: place.floor ?? '',
      capacity: place.capacity ?? '',
      active: place.active ? 'Sim' : 'Não',
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
          .map((key) => this.escapeCsv(row[key as keyof ExportEditionPlaceRow]))
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

    return `edition_places_${yyyy}-${mm}-${dd}_${hh}-${mi}.csv`;
  }

  private mapSortField(active: string): string {
    switch (active) {
      case 'editionId':
        return 'edition_id';
      default:
        return active;
    }
  }
}

interface ExportEditionPlaceRow {
  id: number;
  uuid: string;
  name: string;
  kind: string;
  description: string;
  floor: string;
  capacity: string | number;
  active: string;
}
