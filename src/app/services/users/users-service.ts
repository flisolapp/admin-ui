import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type UserRole = 'super_admin' | 'admin' | 'organizer' | 'credential';

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: string | null;
}

export interface UserFilters {
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

export interface CreateUserPayload {
  name: string;
  email: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface UserPasswordResponse {
  user: UserRecord;
  generated_password: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/records/users`;

  public getAll(filters: UserFilters = {}): Observable<PaginatedResponse<UserRecord>> {
    let params = new HttpParams();

    if (filters.page != null) {
      params = params.set('page', filters.page);
    }

    if (filters.perPage != null) {
      params = params.set('perPage', filters.perPage);
    }

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    if (filters.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }

    if (filters.sortDirection) {
      params = params.set('sortDirection', filters.sortDirection);
    }

    return this.http.get<PaginatedResponse<UserRecord>>(this.baseUrl, { params });
  }

  public create(payload: CreateUserPayload): Observable<UserPasswordResponse> {
    return this.http.post<UserPasswordResponse>(this.baseUrl, payload);
  }

  public update(id: number, payload: UpdateUserPayload): Observable<UserRecord> {
    return this.http.put<UserRecord>(`${this.baseUrl}/${id}`, payload);
  }

  public delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  public resetPassword(id: number): Observable<UserPasswordResponse> {
    return this.http.patch<UserPasswordResponse>(`${this.baseUrl}/${id}/reset-password`, {});
  }
}
