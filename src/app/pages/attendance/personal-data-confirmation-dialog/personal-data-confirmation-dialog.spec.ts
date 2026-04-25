import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalDataConfirmationDialog } from './personal-data-confirmation-dialog';

describe('PersonalDataConfirmationDialog', () => {
  let component: PersonalDataConfirmationDialog;
  let fixture: ComponentFixture<PersonalDataConfirmationDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalDataConfirmationDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonalDataConfirmationDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
