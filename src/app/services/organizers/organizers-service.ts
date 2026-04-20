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
  confirmed: boolean;
  editionId: number;
}

export interface OrganizerFilters {
  editionId?: number | null;
  page?: number;
  perPage?: number;
  search?: string;
  confirmed?: boolean | null;
  sortBy?: string | null;
  sortDirection?: 'asc' | 'desc' | '' | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/records/organizers`;

  public getAll(filters: OrganizerFilters = {}): Observable<PaginatedResponse<Organizer>> {
    let params = new HttpParams();

    if (filters.editionId != null) {
      params = params.set('edition_id', filters.editionId);
    } else {
      params = params.set('edition_id', 22);
    }

    if (filters.page != null) {
      params = params.set('page', filters.page);
    }

    if (filters.perPage != null) {
      params = params.set('per_page', filters.perPage);
    }

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    if (filters.confirmed != null) {
      params = params.set('confirmed', filters.confirmed);
    }

    if (filters.sortBy?.trim()) {
      params = params.set('sort_by', filters.sortBy.trim());
    }

    if (filters.sortDirection) {
      params = params.set('sort_direction', filters.sortDirection);
    }

    return this.http.get<PaginatedResponse<Organizer>>(this.baseUrl, { params });
  }

  public getById(id: number): Observable<Organizer> {
    return this.http.get<Organizer>(`${this.baseUrl}/${id}`);
  }

  public confirm(id: number, confirmed: boolean): Observable<Organizer> {
    return this.http.patch<Organizer>(`${this.baseUrl}/${id}/confirm`, {
      confirmed,
    });
  }

  public delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
