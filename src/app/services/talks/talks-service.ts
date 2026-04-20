import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TalkSpeaker {
  id: number;
  name: string;
  federal_code: string | null;
  email: string;
  phone: string;
  bio: string | null;
  website: string | null;
  photo_url: string | null;
}

export interface Talk {
  id: number;
  edition_id: number;
  title: string;
  description: string | null;
  shift: 'M' | 'A' | 'W';
  kind: 'T' | 'W';
  confirmed: boolean;
  talk_subject_id: number | null;
  talk_subject_name: string | null;
  slide_file_url: string | null;
  slide_url: string | null;
  created_at: string;
  updated_at: string;
  removed_at: string | null;
  speakers: TalkSpeaker[];
}

export interface TalkFilters {
  editionId?: number | null;
  page?: number;
  perPage?: number;
  search?: string;
  kind?: 'T' | 'W' | null;
  shift?: 'M' | 'A' | 'W' | null;
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
export class TalksService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/records/talks`;

  public getAll(filters: TalkFilters = {}): Observable<PaginatedResponse<Talk>> {
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

    if (filters.kind != null) {
      params = params.set('kind', filters.kind);
    }

    if (filters.shift != null) {
      params = params.set('shift', filters.shift);
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

    return this.http.get<PaginatedResponse<Talk>>(this.baseUrl, { params });
  }

  public getById(id: number): Observable<Talk> {
    return this.http.get<Talk>(`${this.baseUrl}/${id}`);
  }

  public confirm(id: number, confirmed: boolean): Observable<Talk> {
    return this.http.patch<Talk>(`${this.baseUrl}/${id}/confirm`, { confirmed });
  }

  public delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
