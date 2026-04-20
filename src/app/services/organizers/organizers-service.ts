import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Organizer {
  id: number;
  name: string;
  email: string;
  phone: string;
  federalCode: string | null;
  editionId: number;
  presentedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OrganizerFilters {
  editionId?: number | null;
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

export interface CreateOrganizerPayload {
  name: string;
  email: string;
  phone: string;
  federal_code?: string | null;
  edition_id: number;
}

export interface UpdateOrganizerPayload {
  name?: string;
  email?: string;
  phone?: string;
  federal_code?: string | null;
  edition_id?: number;
  presented_at?: string | null;
}

@Injectable({ providedIn: 'root' })
export class OrganizersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/records/organizers`;

  public getAll(filters: OrganizerFilters = {}): Observable<PaginatedResponse<Organizer>> {
    let params = new HttpParams();

    if (filters.editionId != null) {
      params = params.set('edition_id', filters.editionId);
    }

    if (filters.page != null) {
      params = params.set('page', filters.page);
    }

    if (filters.perPage != null) {
      params = params.set('per_page', filters.perPage);
    }

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    if (filters.sortBy) {
      params = params.set('sort_by', filters.sortBy);
    }

    if (filters.sortDirection) {
      params = params.set('sort_direction', filters.sortDirection);
    }

    return this.http.get<PaginatedResponse<Organizer>>(this.baseUrl, { params });
  }

  public create(payload: CreateOrganizerPayload): Observable<Organizer> {
    payload.edition_id = 22;
    return this.http.post<Organizer>(this.baseUrl, payload);
  }

  public update(id: number, payload: UpdateOrganizerPayload): Observable<Organizer> {
    return this.http.put<Organizer>(`${this.baseUrl}/${id}`, payload);
  }

  public delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
