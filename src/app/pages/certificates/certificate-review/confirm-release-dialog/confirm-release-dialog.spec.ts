import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ConfirmReleaseDialog } from './confirm-release-dialog';

describe('ConfirmReleaseDialog', () => {
  let component: ConfirmReleaseDialog;
  let fixture: ComponentFixture<ConfirmReleaseDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmReleaseDialog],
      providers: [
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: MAT_DIALOG_DATA, useValue: { total: 10 } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmReleaseDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
