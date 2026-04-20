import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Talks } from './talks';

describe('Talks', () => {
  let component: Talks;
  let fixture: ComponentFixture<Talks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Talks],
    }).compileComponents();

    fixture = TestBed.createComponent(Talks);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
