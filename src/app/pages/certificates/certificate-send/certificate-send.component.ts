import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { PageStructure } from '../../../components/page-structure/page-structure';
import { ThemeService } from '../../../services/theme/theme-service';
import {
  CertificatePreviewItem,
  CertificatesService,
} from '../../../services/certificates/certificates-service';

export interface SendableItem extends CertificatePreviewItem {
  /** undefined = pending, true = sent OK this session, false = failed */
  sendStatus?: boolean;
}

@Component({
  selector: 'app-send',
  standalone: true,
  imports: [
    CommonModule,
    PageStructure,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './certificate-send.component.html',
  styleUrl: './certificate-send.component.scss',
})
export class CertificateSend {
  private readonly certificatesService = inject(CertificatesService);
  private readonly snackBar = inject(MatSnackBar);

  public readonly themeService = inject(ThemeService);

  public readonly loading = signal(false);
  public readonly sending = signal(false);

  /** cert_code of the item currently being sent individually (null = none) */
  public readonly sendingCode = signal<string | null>(null);

  /** Items with code != null, sent_at == null (fetched via preview, filtered client-side) */
  public readonly items = signal<SendableItem[]>([]);

  /** Counter signals for progress display */
  public readonly sentCount = signal(0);
  public readonly failedCount = signal(0);
  public readonly currentIndex = signal(0);

  /** Error message shown when sending stops */
  public readonly sendError = signal<string | null>(null);

  /** True when sending finished with no errors */
  public readonly allSentSuccessfully = signal(false);

  public readonly total = computed(() => this.items().length);

  /** Items still pending (no sendStatus set) */
  public readonly pendingItems = computed(() =>
    this.items().filter((i) => i.sendStatus === undefined),
  );

  /** Items sent successfully this session */
  public readonly sentItems = computed(() => this.items().filter((i) => i.sendStatus === true));

  constructor() {
    this.loadPending();
  }

  /** Load preview and filter to only items eligible for sending */
  public loadPending(): void {
    this.loading.set(true);
    this.sendError.set(null);
    this.allSentSuccessfully.set(false);
    this.sentCount.set(0);
    this.failedCount.set(0);
    this.currentIndex.set(0);

    this.certificatesService
      .getPreview()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          // Eligible for sending: code != null AND sent_at == null AND already_released == true
          const sendable = response.data.filter(
            (i) => i.cert_code !== null && i.cert_sent_at === null && i.already_released,
          ) as SendableItem[];

          this.items.set(sendable);
        },
        error: () => {
          this.snackBar.open('Erro ao carregar certificados pendentes de envio.', 'Fechar', {
            duration: 4000,
          });
        },
      });
  }

  public startSending(): void {
    if (this.sending()) {
      return;
    }

    const pending = this.pendingItems();

    if (pending.length === 0) {
      this.snackBar.open('Nenhum certificado pendente para enviar.', 'Fechar', { duration: 3000 });
      return;
    }

    this.sendError.set(null);
    this.allSentSuccessfully.set(false);
    this.sending.set(true);
    this.sentCount.set(0);
    this.failedCount.set(0);

    this.processnext();
  }

  private processnext(): void {
    // Find first item with no sendStatus (pending)
    const allItems = this.items();
    const nextIndex = allItems.findIndex((i) => i.sendStatus === undefined);

    if (nextIndex === -1) {
      // All done
      this.sending.set(false);
      this.allSentSuccessfully.set(true);
      return;
    }

    const item = allItems[nextIndex];
    this.currentIndex.set(this.sentCount() + 1);

    if (!item.cert_code) {
      // Skip items without a code (should not happen given the filter, but guard anyway)
      this.markItemStatus(item, true);
      this.processnext();
      return;
    }

    this.certificatesService.sendMail(item.cert_code).subscribe({
      next: () => {
        // Mark sent, move to end of list visually
        this.markItemStatus(item, true);
        this.moveToEnd(item);
        this.sentCount.update((n) => n + 1);

        // Wait 2s between requests to respect server rate limit (120 req/min)
        setTimeout(() => this.processnext(), 2000);
      },
      error: (err) => {
        const message =
          err?.error?.error || err?.error?.message || 'Erro desconhecido ao enviar certificado.';

        this.failedCount.update((n) => n + 1);
        this.sending.set(false);
        this.sendError.set(message);

        this.snackBar.open(`Envio interrompido: ${message}`, 'Fechar', { duration: 8000 });
      },
    });
  }

  private markItemStatus(item: SendableItem, success: boolean): void {
    this.items.update((all) =>
      all.map((i) =>
        i.cert_code === item.cert_code && i.person_id === item.person_id && i.role === item.role
          ? { ...i, sendStatus: success }
          : i,
      ),
    );
  }

  private moveToEnd(item: SendableItem): void {
    this.items.update((all) => {
      const idx = all.findIndex(
        (i) =>
          i.cert_code === item.cert_code && i.person_id === item.person_id && i.role === item.role,
      );
      if (idx === -1) return all;
      const copy = [...all];
      const [removed] = copy.splice(idx, 1);
      copy.push(removed);
      return copy;
    });
  }

  /** Send a single item individually (e.g. for testing) */
  public sendSingle(item: SendableItem): void {
    if (!item.cert_code || this.sending() || this.sendingCode() !== null) {
      return;
    }

    this.sendingCode.set(item.cert_code);
    this.sendError.set(null);

    this.certificatesService.sendMail(item.cert_code).subscribe({
      next: () => {
        this.markItemStatus(item, true);
        this.moveToEnd(item);
        this.sentCount.update((n) => n + 1);
        this.sendingCode.set(null);

        this.snackBar.open(`Certificado enviado para ${item.email}`, 'Fechar', { duration: 4000 });
      },
      error: (err) => {
        const message =
          err?.error?.error || err?.error?.message || 'Erro desconhecido ao enviar certificado.';

        this.sendingCode.set(null);
        this.sendError.set(message);

        this.snackBar.open(`Falha ao enviar: ${message}`, 'Fechar', { duration: 8000 });
      },
    });
  }

  public trackByItem(_: number, item: SendableItem): string {
    return `${item.role}-${item.person_id}-${item.cert_code}`;
  }
}
