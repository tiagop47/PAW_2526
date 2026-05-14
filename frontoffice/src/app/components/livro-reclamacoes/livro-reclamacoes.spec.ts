import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivroReclamacoes } from './livro-reclamacoes';

describe('LivroReclamacoes', () => {
  let component: LivroReclamacoes;
  let fixture: ComponentFixture<LivroReclamacoes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LivroReclamacoes],
    }).compileComponents();

    fixture = TestBed.createComponent(LivroReclamacoes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
