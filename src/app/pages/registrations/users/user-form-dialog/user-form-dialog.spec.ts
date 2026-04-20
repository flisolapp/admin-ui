import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserFormDialog } from './user-form-dialog';

describe('UserFormDialog', () => {
  let component: UserFormDialog;
  let fixture: ComponentFixture<UserFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFormDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
