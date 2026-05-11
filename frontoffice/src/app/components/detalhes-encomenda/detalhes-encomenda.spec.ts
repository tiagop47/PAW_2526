import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalhesEncomenda } from './detalhes-encomenda';

describe('DetalhesEncomenda', () => {
  let component: DetalhesEncomenda;
  let fixture: ComponentFixture<DetalhesEncomenda>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalhesEncomenda],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalhesEncomenda);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
