import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type AttendanceKind = 'participant' | 'collaborator' | 'organizer' | 'speaker_talk';

export interface PeopleRecord {
  id: number | null;
  name: string | null;
  federalCode: string | null;
  email: string | null;
  phone: string | null;
}

export interface AttendanceRecord {
  id: number;
  kind: AttendanceKind;
  kind_label: string;
  edition_id: number | null;
  people_id: number | null;
  talk_id: number | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  federal_code: string | null;
  talk_title: string | null;
  talk_kind: string | null;
  talk_shift: string | null;
  talk_subject: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  // checked_out?: boolean;
  // checked_out_at?: string | null;
}

export interface AttendanceListResponse {
  data: AttendanceRecord[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AttendanceFilters {
  editionId?: number | null;
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: string | null;
  sortDirection?: 'asc' | 'desc' | '' | null;
}

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/attendance`;

  public getAll(filters: AttendanceFilters = {}): Observable<AttendanceListResponse> {
    let params = new HttpParams();

    if (filters.editionId != null) {
      params = params.set('edition_id', String(filters.editionId));
    }

    if (filters.page != null) {
      params = params.set('page', String(filters.page));
    }

    if (filters.perPage != null) {
      params = params.set('per_page', String(filters.perPage));
    }

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    if (filters.sortBy?.trim()) {
      params = params.set('sort_by', filters.sortBy.trim());
    }

    if (filters.sortDirection) {
      params = params.set('sort_direction', filters.sortDirection);
    }

    return this.http.get<AttendanceListResponse>(this.baseUrl, { params });
  }

  public toggleCheckIn(
    kind: AttendanceKind,
    id: number,
    checkedIn: boolean,
    data?: any,
  ): Observable<AttendanceRecord> {
    return this.http.patch<AttendanceRecord>(`${this.baseUrl}/${kind}/${id}/check-in`, {
      checked_in: checkedIn,
      data: data,
    });
  }
}
