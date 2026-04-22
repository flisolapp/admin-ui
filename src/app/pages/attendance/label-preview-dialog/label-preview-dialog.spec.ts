import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabelPreviewDialog } from './label-preview-dialog';

describe('LabelPreviewDialog', () => {
  let component: LabelPreviewDialog;
  let fixture: ComponentFixture<LabelPreviewDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabelPreviewDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(LabelPreviewDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
