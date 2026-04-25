import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { EditionPlaceDeleteDialog } from './edition-place-delete-dialog';

describe('EditionPlaceDeleteDialog', () => {
  let component: EditionPlaceDeleteDialog;
  let fixture: ComponentFixture<EditionPlaceDeleteDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditionPlaceDeleteDialog, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { name: 'Sala 1.1' } },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditionPlaceDeleteDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
