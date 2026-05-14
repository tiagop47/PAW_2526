import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrecoComparacao } from './preco-comparacao';

describe('PrecoComparacao', () => {
  let component: PrecoComparacao;
  let fixture: ComponentFixture<PrecoComparacao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrecoComparacao],
    }).compileComponents();

    fixture = TestBed.createComponent(PrecoComparacao);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
