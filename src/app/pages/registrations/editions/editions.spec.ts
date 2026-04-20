import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Editions } from './editions';

describe('Editions', () => {
  let component: Editions;
  let fixture: ComponentFixture<Editions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Editions],
    }).compileComponents();

    fixture = TestBed.createComponent(Editions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
