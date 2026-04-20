import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPasswordDialog } from './user-password-dialog';

describe('UserPasswordDialog', () => {
  let component: UserPasswordDialog;
  let fixture: ComponentFixture<UserPasswordDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserPasswordDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(UserPasswordDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
