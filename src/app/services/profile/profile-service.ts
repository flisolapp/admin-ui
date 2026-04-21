import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type UserRole = 'super_admin' | 'admin' | 'organizer' | 'credential' | 'user';

export interface ProfileUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface UpdateProfilePayload {
  name: string;
  email: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  public me(): Observable<ProfileUser> {
    return this.http.get<ProfileUser>(`${this.baseUrl}/me`);
  }

  public updateProfile(payload: UpdateProfilePayload): Observable<ProfileUser> {
    return this.http.put<ProfileUser>(`${this.baseUrl}/profile`, payload);
  }

  public changePassword(payload: ChangePasswordPayload): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/password`, payload);
  }
}
