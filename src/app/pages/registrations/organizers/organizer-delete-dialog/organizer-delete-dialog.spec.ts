import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizerDeleteDialog } from './organizer-delete-dialog';

describe('OrganizerDeleteDialog', () => {
  let component: OrganizerDeleteDialog;
  let fixture: ComponentFixture<OrganizerDeleteDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizerDeleteDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizerDeleteDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
