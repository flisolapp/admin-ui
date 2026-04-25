import { TestBed } from '@angular/core/testing';

import { EditionPlacesService } from './edition-places-service';

describe('EditionPlacesService', () => {
  let service: EditionPlacesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EditionPlacesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
