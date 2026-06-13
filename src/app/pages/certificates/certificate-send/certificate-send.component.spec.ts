import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateSend } from './certificate-send.component';

describe('Send', () => {
  let component: CertificateSend;
  let fixture: ComponentFixture<CertificateSend>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificateSend],
    }).compileComponents();

    fixture = TestBed.createComponent(CertificateSend);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
