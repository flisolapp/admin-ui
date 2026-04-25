import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { EditionPlaceFormDialog } from './edition-place-form-dialog';

describe('EditionPlaceFormDialog', () => {
  let component: EditionPlaceFormDialog;
  let fixture: ComponentFixture<EditionPlaceFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditionPlaceFormDialog, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'create', editionId: 22 } },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditionPlaceFormDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
