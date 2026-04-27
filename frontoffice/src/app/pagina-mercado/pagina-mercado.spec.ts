import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginaMercado } from './pagina-mercado';

describe('PaginaMercado', () => {
  let component: PaginaMercado;
  let fixture: ComponentFixture<PaginaMercado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginaMercado],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginaMercado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
