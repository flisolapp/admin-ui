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
import { Talk, TalksService } from '../../../services/talks/talks-service';
import { ThemeService } from '../../../services/theme/theme-service';
import { MatTooltip } from '@angular/material/tooltip';
import { MatProgressBar } from '@angular/material/progress-bar';
import { AuthImagePipe } from '../../../pipes/auth-image/auth-image-pipe';

@Component({
  selector: 'app-talks',
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
    AuthImagePipe,
  ],
  templateUrl: './talks.html',
  styleUrl: './talks.scss',
})
export class Talks implements AfterViewInit {
  private readonly talksService = inject(TalksService);
  private readonly snackBar = inject(MatSnackBar);

  public readonly themeService = inject(ThemeService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public readonly displayedColumns: string[] = [
    'id',
    'title',
    'kind',
    'shift',
    'subject',
    'confirmed',
    // 'actions',
  ];

  public readonly columnsToDisplayWithExpand = [...this.displayedColumns, 'expand'];

  public readonly dataSource = new MatTableDataSource<Talk>([]);

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

  public expandedElement: Talk | null = null;

  public readonly pending = computed(() => this.total() - this.confirmed());
  public readonly confirmationRate = computed(() =>
    this.total() > 0 ? Math.round((this.confirmed() / this.total()) * 100) : 0,
  );

  constructor() {
    this.loadTalks();
  }

  public ngAfterViewInit(): void {
    if (this.sort) {
      this.sort.sortChange.subscribe((sort: Sort) => {
        this.sortBy.set(sort.active);
        this.sortDirection.set((sort.direction || 'desc') as 'asc' | 'desc' | '');
        this.page.set(1);
        this.loadTalks();
      });
    }
  }

  public loadTalks(): void {
    this.loading.set(true);

    this.talksService
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
          this.expandedElement = null;

          if (this.paginator) {
            this.paginator.length = response.total;
            this.paginator.pageIndex = response.current_page - 1;
            this.paginator.pageSize = response.per_page;
          }
        },
        error: () => {
          this.snackBar.open('Erro ao carregar palestras.', 'Fechar', {
            duration: 3000,
          });
        },
      });
  }

  public applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.search.set(value.trim());
    this.page.set(1);
    this.loadTalks();
  }

  public clearFilter(): void {
    this.search.set('');
    this.page.set(1);
    this.loadTalks();
  }

  public onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.perPage.set(event.pageSize);
    this.loadTalks();
  }

  public isExpanded(element: Talk): boolean {
    return this.expandedElement === element;
  }

  public toggle(element: Talk): void {
    this.expandedElement = this.isExpanded(element) ? null : element;
  }

  public toggleConfirmation(row: Talk): void {
    this.talksService.confirm(row.id, !row.confirmed).subscribe({
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

  public async downloadPhoto(img: HTMLImageElement, fileName: string = 'speaker-photo.png') {
    if (!img || !img.src) return;

    try {
      // 1. Fetch the data directly from the image's current source (the Blob/Data URL)
      const response = await fetch(img.src);
      const blob = await response.blob();

      // 2. Create a temporary download link for the blob
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;

      // 3. Trigger the browser download
      document.body.appendChild(link);
      link.click();

      // 4. Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Could not download original image:', error);
    }
  }

  public editTalk(row: Talk): void {
    console.log('edit', row);
  }

  public deleteTalk(row: Talk): void {
    this.talksService.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Palestra removida.', 'Fechar', {
          duration: 2500,
        });

        if (this.dataSource.data.length === 1 && this.page() > 1) {
          this.page.set(this.page() - 1);
        }

        this.loadTalks();
      },
      error: () => {
        this.snackBar.open('Erro ao remover palestra.', 'Fechar', {
          duration: 3000,
        });
      },
    });
  }

  public kindLabel(kind: string): string {
    return kind === 'T' ? 'Palestra' : 'Oficina';
  }

  public shiftLabel(shift: string): string {
    switch (shift) {
      case 'M':
        return 'Manhã';
      case 'A':
        return 'Tarde';
      default:
        return 'Sem preferência';
    }
  }

  public exportTalks(): void {
    this.exporting.set(true);

    const baseFilters = {
      editionId: this.editionId(),
      perPage: 100,
      search: this.search(),
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
    };

    this.talksService
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
              this.talksService.getAll({
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
              const allTalks: Talk[] = [
                ...firstPageResponse.data,
                ...otherPagesResponses.flatMap((response) => response.data),
              ];

              this.downloadCsv(allTalks);
            },
            error: () => {
              this.snackBar.open('Erro ao exportar palestras.', 'Fechar', {
                duration: 3000,
              });
            },
          });
        },
        error: () => {
          this.snackBar.open('Erro ao exportar palestras.', 'Fechar', {
            duration: 3000,
          });
        },
      });
  }

  private downloadCsv(rows: Talk[]): void {
    // Column order matches the database view: one row per speaker per talk.
    // Talks with no speakers produce one row with empty speaker columns.
    const headers: Record<keyof ExportTalkRow, string> = {
      id: 'ID',
      edition_id: 'Edição ID',
      title: 'Título',
      description: 'Descrição',
      shift: 'Turno',
      kind: 'Tipo',
      talk_subject_id: 'Tema ID',
      talk_subject_name: 'Tema',
      slide_file: 'Slide (arquivo)',
      slide_url: 'Slide (URL)',
      speaker_id: 'Palestrante ID',
      speaker_name: 'Nome Palestrante',
      federal_code: 'CPF',
      email: 'E-mail',
      phone: 'Telefone',
      photo: 'Foto',
    };

    const exportRows: ExportTalkRow[] = [];

    for (const talk of rows) {
      const base = {
        id: talk.id,
        edition_id: talk.edition_id,
        title: talk.title,
        description: talk.description ?? '',
        shift: this.shiftLabel(talk.shift),
        kind: this.kindLabel(talk.kind),
        talk_subject_id: talk.talk_subject_id?.toString() ?? '',
        talk_subject_name: talk.talk_subject_name ?? '',
        slide_file: talk.slide_file_url ?? '',
        slide_url: talk.slide_url ?? '',
      };

      if (talk.speakers.length === 0) {
        exportRows.push({
          ...base,
          speaker_id: '',
          speaker_name: '',
          federal_code: '',
          email: '',
          phone: '',
          photo: '',
        });
      } else {
        for (const speaker of talk.speakers) {
          exportRows.push({
            ...base,
            speaker_id: speaker.id.toString(),
            speaker_name: speaker.name,
            federal_code: speaker.federal_code ?? '',
            email: speaker.email,
            phone: speaker.phone,
            photo: speaker.photo_url ?? '',
          });
        }
      }
    }

    const csvLines: string[] = [];

    csvLines.push(
      Object.values(headers)
        .map((value) => this.escapeCsv(value))
        .join(';'),
    );

    for (const row of exportRows) {
      csvLines.push(
        Object.keys(headers)
          .map((key) => this.escapeCsv(row[key as keyof ExportTalkRow]))
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

    return `talks_${yyyy}-${mm}-${dd}_${hh}-${mi}.csv`;
  }
}

interface ExportTalkRow {
  id: number;
  edition_id: number;
  title: string;
  description: string;
  shift: string;
  kind: string;
  talk_subject_id: string;
  talk_subject_name: string;
  slide_file: string;
  slide_url: string;
  speaker_id: string;
  speaker_name: string;
  federal_code: string;
  email: string;
  phone: string;
  photo: string;
}
