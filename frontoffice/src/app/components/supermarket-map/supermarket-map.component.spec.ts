import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupermarketMapComponent } from './supermarket-map.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('SupermarketMapComponent', () => {
  let component: SupermarketMapComponent;
  let fixture: ComponentFixture<SupermarketMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupermarketMapComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupermarketMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
