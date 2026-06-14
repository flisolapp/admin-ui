import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { CertificateSend, SendableItem } from './certificate-send.component';
import {
  CertificatePreviewItem,
  CertificateSendResponse,
  CertificatesService,
} from '../../../services/certificates/certificates-service';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeItem(
  overrides: Partial<CertificatePreviewItem> & { cert_code: string },
): SendableItem {
  return {
    id: 1,
    person_id: 1,
    name: 'Test User',
    email: 'test@example.com',
    federal_code: null,
    role: 'Participante',
    certificate_type: 'participation',
    edition_id: 1,
    edition_year: '2024',
    role_record_id: null,
    talk_id: null,
    talk_title: null,
    presented_at: null,
    already_released: true,
    cert_id: 1,
    cert_sent_at: null,
    sendStatus: undefined,
    ...overrides,
  };
}

/**
 * Builds a CertificateSendResponse matching the real API shape:
 *   { message, edition_id, person, certificates_sent, certificates[{id,code,sent_at}] }
 * Cascade logic is keyed exclusively on certificates[].code.
 */
function makeSendResponse(codes: string[]): CertificateSendResponse {
  return {
    message: 'Certificate availability email sent successfully.',
    edition_id: 1,
    person: { id: 1, name: 'Test User', email: 'test@example.com' },
    certificates_sent: codes.length,
    certificates: codes.map((code, i) => ({
      id: i + 1,
      code,
      sent_at: '2026-06-13T11:13:10.000000Z',
    })),
  };
}

const EMPTY_PREVIEW = { edition_id: 1, edition_year: '2024', total: 0, data: [] };

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('CertificateSend', () => {
  let component: CertificateSend;
  let fixture: ComponentFixture<CertificateSend>;
  let service: jasmine.SpyObj<CertificatesService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj<CertificatesService>('CertificatesService', [
      'getPreview',
      'release',
      'sendMail',
    ]);
    spy.getPreview.and.returnValue(of(EMPTY_PREVIEW));

    await TestBed.configureTestingModule({
      imports: [CertificateSend, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CertificatesService, useValue: spy },
      ],
    }).compileComponents();

    service = TestBed.inject(CertificatesService) as jasmine.SpyObj<CertificatesService>;
    fixture = TestBed.createComponent(CertificateSend);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Cascade via certificate codes — startSending ─────────────────────────

  describe('cascade marking on startSending (keyed by certificate code)', () => {
    it('marks every code returned by the API as sent, regardless of person or email', fakeAsync(() => {
      // CODE-A and CODE-B belong to the same person; CODE-C to a different one.
      // The API responds to the CODE-A call with [CODE-A, CODE-B], simulating
      // the server-side "mark all certs for this person" behaviour.
      const itemA = makeItem({ cert_code: 'CODE-A', person_id: 1 });
      const itemB = makeItem({ cert_code: 'CODE-B', person_id: 1 });
      const itemC = makeItem({ cert_code: 'CODE-C', person_id: 2, email: 'other@example.com' });

      component.items.set([itemA, itemB, itemC]);

      service.sendMail.and.callFake((code: string) => {
        if (code === 'CODE-A') return of(makeSendResponse(['CODE-A', 'CODE-B']));
        return of(makeSendResponse(['CODE-C']));
      });

      component.startSending();
      tick(0); // resolve sendMail(CODE-A)

      // Both A and B must be marked immediately; C is still pending.
      const afterFirst = component.items();
      expect(afterFirst.find((i) => i.cert_code === 'CODE-A')?.sendStatus).toBe(true);
      expect(afterFirst.find((i) => i.cert_code === 'CODE-B')?.sendStatus).toBe(true);
      expect(afterFirst.find((i) => i.cert_code === 'CODE-C')?.sendStatus).toBeUndefined();

      // sentCount reflects both A and B
      expect(component.sentCount()).toBe(2);

      tick(6000); // SEND_DELAY_MS → processNext fires for CODE-C
      tick(0);

      expect(component.items().find((i) => i.cert_code === 'CODE-C')?.sendStatus).toBe(true);
      expect(component.sentCount()).toBe(3);
      expect(component.sending()).toBe(false);
      expect(component.allSentSuccessfully()).toBe(true);
    }));

    it('does not call sendMail for codes already cascade-marked as sent', fakeAsync(() => {
      // API returns both codes on the first call → CODE-B must never be requested.
      const itemA = makeItem({ cert_code: 'CODE-A' });
      const itemB = makeItem({ cert_code: 'CODE-B' });

      component.items.set([itemA, itemB]);

      service.sendMail.and.returnValue(of(makeSendResponse(['CODE-A', 'CODE-B'])));

      component.startSending();
      tick(0);
      tick(6000); // processNext runs again — must find no pending items
      tick(0);

      expect(service.sendMail).toHaveBeenCalledTimes(1);
      expect(service.sendMail).toHaveBeenCalledWith('CODE-A');
      expect(component.allSentSuccessfully()).toBe(true);
    }));

    it('does not cascade codes that are NOT in the API response', fakeAsync(() => {
      // API returns only CODE-A; CODE-B must remain pending for its own call.
      const itemA = makeItem({ cert_code: 'CODE-A' });
      const itemB = makeItem({ cert_code: 'CODE-B' });

      component.items.set([itemA, itemB]);

      service.sendMail.and.callFake((code: string) => of(makeSendResponse([code])));

      component.startSending();
      tick(0); // CODE-A sent

      expect(component.items().find((i) => i.cert_code === 'CODE-B')?.sendStatus).toBeUndefined();

      tick(6000); // CODE-B sent
      tick(0);

      expect(service.sendMail).toHaveBeenCalledTimes(2);
      expect(component.allSentSuccessfully()).toBe(true);
    }));

    it('stops on error and leaves unprocessed items as pending', fakeAsync(() => {
      const itemA = makeItem({ cert_code: 'CODE-A' });
      const itemB = makeItem({ cert_code: 'CODE-B' });

      component.items.set([itemA, itemB]);

      service.sendMail.and.callFake((code: string) => {
        if (code === 'CODE-A') {
          return throwError(() => ({ error: { error: 'rate limit', details: null } }));
        }
        return of(makeSendResponse([code]));
      });

      component.startSending();
      tick(0);

      expect(component.sending()).toBe(false);
      expect(component.sendError()?.message).toBe('rate limit');
      // CODE-B must remain untouched — it was never sent
      expect(component.items().find((i) => i.cert_code === 'CODE-B')?.sendStatus).toBeUndefined();
    }));
  });

  // ── Cascade via certificate codes — sendSingle ───────────────────────────

  describe('cascade marking on sendSingle (keyed by certificate code)', () => {
    it('marks all codes from the API response as sent', fakeAsync(() => {
      const itemA = makeItem({ cert_code: 'CODE-A' });
      const itemB = makeItem({ cert_code: 'CODE-B' });

      component.items.set([itemA, itemB]);

      service.sendMail.and.returnValue(of(makeSendResponse(['CODE-A', 'CODE-B'])));

      component.sendSingle(itemA);
      tick(0);

      expect(component.items().find((i) => i.cert_code === 'CODE-A')?.sendStatus).toBe(true);
      expect(component.items().find((i) => i.cert_code === 'CODE-B')?.sendStatus).toBe(true);
      expect(component.sentCount()).toBe(2);
    }));

    it('does not cascade codes absent from the API response', fakeAsync(() => {
      const itemA = makeItem({ cert_code: 'CODE-A' });
      const itemB = makeItem({ cert_code: 'CODE-B' });

      component.items.set([itemA, itemB]);

      // Server only confirms CODE-A
      service.sendMail.and.returnValue(of(makeSendResponse(['CODE-A'])));

      component.sendSingle(itemA);
      tick(0);

      expect(component.items().find((i) => i.cert_code === 'CODE-A')?.sendStatus).toBe(true);
      expect(component.items().find((i) => i.cert_code === 'CODE-B')?.sendStatus).toBeUndefined();
      expect(component.sentCount()).toBe(1);
    }));

    it('does not call sendMail when item already has sendStatus set', fakeAsync(() => {
      const itemA: SendableItem = { ...makeItem({ cert_code: 'CODE-A' }), sendStatus: true };

      component.items.set([itemA]);
      service.sendMail.and.returnValue(of(makeSendResponse(['CODE-A'])));

      component.sendSingle(itemA);
      tick(0);

      expect(service.sendMail).not.toHaveBeenCalled();
    }));
  });

  // ── Eligibility guard ────────────────────────────────────────────────────

  describe('pendingItems computed', () => {
    it('excludes items with sendStatus === true', () => {
      component.items.set([
        makeItem({ cert_code: 'CODE-A' }),
        { ...makeItem({ cert_code: 'CODE-B' }), sendStatus: true },
      ]);

      expect(component.pendingItems().length).toBe(1);
      expect(component.pendingItems()[0].cert_code).toBe('CODE-A');
    });
  });

  // ── List ordering after cascade ──────────────────────────────────────────

  describe('list ordering after cascade', () => {
    it('moves all cascade-marked items to the end, pending items stay first', fakeAsync(() => {
      const itemA = makeItem({ cert_code: 'CODE-A', person_id: 1 });
      const itemB = makeItem({ cert_code: 'CODE-B', person_id: 1 });
      const itemC = makeItem({ cert_code: 'CODE-C', person_id: 2, email: 'other@example.com' });

      component.items.set([itemA, itemB, itemC]);

      service.sendMail.and.callFake((code: string) => {
        if (code === 'CODE-A') return of(makeSendResponse(['CODE-A', 'CODE-B']));
        return of(makeSendResponse([code]));
      });

      component.startSending();
      tick(0);

      const order = component.items().map((i) => i.cert_code);
      // C (still pending) must appear before A and B (both sent)
      expect(order.indexOf('CODE-C')).toBeLessThan(order.indexOf('CODE-A'));
      expect(order.indexOf('CODE-C')).toBeLessThan(order.indexOf('CODE-B'));
    }));
  });
});
