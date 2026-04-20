import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Organizers } from './organizers';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ThemeService } from '../../../services/theme/theme-service';

class ThemeServiceStub {
  public darkMode(): boolean {
    return false;
  }
}

describe('Organizers', () => {
  let component: Organizers;
  let fixture: ComponentFixture<Organizers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Organizers, NoopAnimationsModule],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: ThemeService, useClass: ThemeServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Organizers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
