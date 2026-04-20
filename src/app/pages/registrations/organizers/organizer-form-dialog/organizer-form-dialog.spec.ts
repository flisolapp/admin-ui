import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizerFormDialog } from './organizer-form-dialog';

describe('OrganizerFormDialog', () => {
  let component: OrganizerFormDialog;
  let fixture: ComponentFixture<OrganizerFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizerFormDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizerFormDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
