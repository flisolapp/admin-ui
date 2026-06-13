import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateReview } from './certificate-review.component';

describe('Review', () => {
  let component: CertificateReview;
  let fixture: ComponentFixture<CertificateReview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificateReview],
    }).compileComponents();

    fixture = TestBed.createComponent(CertificateReview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
