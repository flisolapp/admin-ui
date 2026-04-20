import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeSelector } from './theme-selector';

describe('ThemeSelector', () => {
  let component: ThemeSelector;
  let fixture: ComponentFixture<ThemeSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
