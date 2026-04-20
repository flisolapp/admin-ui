import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDeleteDialog } from './user-delete-dialog';

describe('UserDeleteDialog', () => {
  let component: UserDeleteDialog;
  let fixture: ComponentFixture<UserDeleteDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDeleteDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDeleteDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
