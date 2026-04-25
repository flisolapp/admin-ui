import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditionPlaces } from './edition-places';

describe('EditionPlaces', () => {
  let component: EditionPlaces;
  let fixture: ComponentFixture<EditionPlaces>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditionPlaces],
    }).compileComponents();

    fixture = TestBed.createComponent(EditionPlaces);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
