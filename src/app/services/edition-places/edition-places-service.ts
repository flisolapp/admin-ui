import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { QrCodeService } from '../qr-code/qr-code.service';

export type EditionPlaceKind =
  | 'room'
  | 'lab'
  | 'main_space'
  | 'talk_room'
  | 'food_area'
  | 'support'
  | 'closing';

export interface EditionPlace {
  id: number;
  _id: string;
  editionId: number;
  kind: EditionPlaceKind;
  name: string;
  description: string | null;
  floor: string | null;
  capacity: number | null;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface EditionPlaceFilters {
  editionId?: number | null;
  kind?: EditionPlaceKind | null;
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: string | null;
  sortDirection?: 'asc' | 'desc' | '';
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CreateEditionPlacePayload {
  edition_id: number;
  kind: EditionPlaceKind;
  name: string;
  description?: string | null;
  floor?: string | null;
  capacity?: number | null;
  active?: boolean;
}

export type UpdateEditionPlacePayload = Partial<CreateEditionPlacePayload>;

@Injectable({ providedIn: 'root' })
export class EditionPlacesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/records/edition-places`;
  private readonly qrCodeService = inject(QrCodeService);
  private readonly qrCodeBaseUrl = 'https://play.flisol.app';

  public getAll(filters: EditionPlaceFilters = {}): Observable<PaginatedResponse<EditionPlace>> {
    let params = new HttpParams();

    if (filters.editionId != null) params = params.set('edition_id', filters.editionId);
    if (filters.kind) params = params.set('kind', filters.kind);
    if (filters.page != null) params = params.set('page', filters.page);
    if (filters.perPage != null) params = params.set('per_page', filters.perPage);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.sortBy) params = params.set('sort_by', filters.sortBy);
    if (filters.sortDirection) params = params.set('sort_direction', filters.sortDirection);

    return this.http.get<PaginatedResponse<EditionPlace>>(this.baseUrl, { params });
  }

  public create(payload: CreateEditionPlacePayload): Observable<EditionPlace> {
    return this.http.post<EditionPlace>(this.baseUrl, payload);
  }

  public update(id: number, payload: UpdateEditionPlacePayload): Observable<EditionPlace> {
    return this.http.put<EditionPlace>(`${this.baseUrl}/${id}`, payload);
  }

  public delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  public getByUuid(uuid: string): Observable<EditionPlace> {
    return this.http.get<EditionPlace>(`${this.baseUrl}/public/${uuid}`);
  }

  public printQrCode(place: EditionPlace, kindLabel: string): boolean {
    if (!place._id) {
      return false;
    }

    const qrCodeUrl = `${this.qrCodeBaseUrl}/${place._id}`;

    const canvas = document.createElement('canvas');
    this.qrCodeService.draw(canvas, qrCodeUrl);

    const qrCodeImage = canvas.toDataURL('image/png');

    const name = place.name ?? '';
    const level = place.floor?.trim() ? `Andar ${place.floor.trim()}` : null;

    const printWindow = window.open('', '_blank', 'width=600,height=800');

    if (!printWindow) {
      return false;
    }

    printWindow.document.open();
    printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>QR Code - ${this.escapeHtml(name)}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }

          html,
          body {
            width: 100%;
            height: 100%;
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
          }

          body {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .print-card {
            text-align: center;
            width: 100%;
          }

          .name {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 12px;
          }

          .kind,
          .level {
            font-size: 20px;
            margin-bottom: 8px;
          }

          .qr-code {
            width: 460px;
            height: 460px;
            margin-top: 24px;
          }
        </style>
      </head>

      <body>
        <div class="print-card">
          <div class="name">${this.escapeHtml(name)}</div>
          <div class="kind">${this.escapeHtml(kindLabel)}</div>
          ${level ? `<div class="level">${this.escapeHtml(level)}</div>` : ''}

          <img class="qr-code" src="${qrCodeImage}" alt="QR Code" />

          <!-- <div class="url">${this.escapeHtml(qrCodeUrl)}</div> -->
        </div>

        <script>
          window.onload = function () {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `);
    printWindow.document.close();

    return true;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
