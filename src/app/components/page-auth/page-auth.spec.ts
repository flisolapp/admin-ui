import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageAuth } from './page-auth';

describe('PageAuth', () => {
  let component: PageAuth;
  let fixture: ComponentFixture<PageAuth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageAuth],
    }).compileComponents();

    fixture = TestBed.createComponent(PageAuth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
