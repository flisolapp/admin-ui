import { TestBed } from '@angular/core/testing';

import { LabelPrinterService } from './label-printer-service';

describe('LabelPrinterService', () => {
  let service: LabelPrinterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LabelPrinterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
