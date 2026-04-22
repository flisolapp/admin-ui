import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabelFormDialog } from './label-form-dialog';

describe('LabelFormDialog', () => {
  let component: LabelFormDialog;
  let fixture: ComponentFixture<LabelFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabelFormDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(LabelFormDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
