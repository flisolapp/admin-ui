import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ── Models ────────────────────────────────────────────────────────────────────

export interface CertificatePreviewItem {
  id: number;
  person_id: number;
  name: string;
  email: string;
  federal_code: string | null;
  role: string;
  certificate_type: string;
  edition_id: number;
  edition_year: string;
  role_record_id: number | null;
  talk_id: number | null;
  talk_title: string | null;
  presented_at: string | null;
  already_released: boolean;
  cert_id: number | null;
  cert_code: string | null;
  cert_sent_at: string | null;
}

export interface CertificatePreviewResponse {
  edition_id: number;
  edition_year: string;
  total: number;
  data: CertificatePreviewItem[];
}

export interface CertificateReleaseResponse {
  message: string;
}

export interface CertificateSendResponse {
  message: string;
  edition_id: number;
  person: {
    id: number;
    name: string;
    email: string;
  };
  certificates_sent: number;
  certificates: Array<{
    id: number;
    code: string;
    sent_at: string;
  }>;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root',
})
export class CertificatesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/certificates`;

  /** GET /api/admin/certificates/preview */
  public getPreview(): Observable<CertificatePreviewResponse> {
    return this.http.get<CertificatePreviewResponse>(`${this.baseUrl}/preview`);
  }

  /** GET /api/admin/certificates/release */
  public release(): Observable<CertificateReleaseResponse> {
    return this.http.get<CertificateReleaseResponse>(`${this.baseUrl}/release`);
  }

  /** GET /api/admin/certificates/{code}/send */
  public sendMail(code: string): Observable<CertificateSendResponse> {
    return this.http.get<CertificateSendResponse>(`${this.baseUrl}/${code}/send`);
  }
}
