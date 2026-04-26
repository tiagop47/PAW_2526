import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvaliacaoModalComponent } from './avaliacao-modal.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Order } from '../../models/order';

describe('AvaliacaoModalComponent', () => {
  let component: AvaliacaoModalComponent;
  let fixture: ComponentFixture<AvaliacaoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvaliacaoModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvaliacaoModalComponent);
    component = fixture.componentInstance;
    
    // Mock minimal order for initialization
    component.order = new Order({
      _id: '123',
      supermercadoId: { _id: 's1', nome: 'Test', localizacao: 'Loc' },
      clienteId: 'c1',
      produtos: [],
      valorTotal: 0,
      estado: 'entregue',
      metodoEntrega: 'levantamento_loja',
      criadoEm: new Date().toISOString()
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
