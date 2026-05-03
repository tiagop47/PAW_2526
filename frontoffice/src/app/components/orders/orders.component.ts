import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { AvaliacaoService } from '../../services/avaliacao.service';
import { Order } from '../../models/order';
import { DetalhesEncomenda } from '../../detalhes-encomenda/detalhes-encomenda';
import { ProductDTO } from '../../models/product.dto';
import { OrderItemDTO } from '../../models/order.dto';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, DetalhesEncomenda],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  erro: string | null = null;
  mensagem: string | null = null;
  orderParaAvaliar: Order | null = null;
  jaAvaliadas = new Set<string>();
  encomendaExpandida: string | null = null;

  constructor(
    private router: Router,
    private orderService: OrderService,
    private avaliacaoService: AvaliacaoService,
  ) {}

  ngOnInit(): void {
    this.carregarEncomendas();
  }

 

  carregarEncomendas(): void {
    this.loading = true;
    forkJoin({
      encomendas: this.orderService.listarEncomendas(),
      avaliacoes: this.avaliacaoService.getMinhasAvaliacoes(),
    }).subscribe({
      next: ({ encomendas, avaliacoes }) => {
        this.orders = encomendas;
        this.jaAvaliadas = new Set(avaliacoes.map((a) => a.encomendaId));
        this.loading = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar as suas encomendas. Por favor, tente mais tarde.';
        this.loading = false;
      },
    });
  }

  cancelarEncomenda(order: Order): void {
    if (!order.podeCancelar()) {
      this.erro = 'O tempo limite de 5 minutos para cancelamento expirou.';
      return;
    }

    if (!confirm('Tem a certeza que deseja cancelar esta encomenda?')) return;

    this.orderService.cancelarEncomenda(order.id).subscribe({
      next: () => {
        this.mensagem = 'Encomenda cancelada com sucesso.';
        this.carregarEncomendas();
      },
      error: (err) => {
        this.erro = err.error?.erro || 'Não foi possível cancelar a encomenda.';
      },
    });
  }

  confirmarRececao(orderId: string): void {
    this.orderService.confirmarRececao(orderId).subscribe({
      next: () => {
        this.mensagem = 'Entrega confirmada com sucesso!';
        this.carregarEncomendas();
      },
      error: (err) => {
        this.erro = err.error?.erro || 'Não foi possível confirmar a receção.';
      },
    });
  }

  abrirAvaliacao(order: Order): void {
    this.orderParaAvaliar = order;
  }

  fecharAvaliacao(): void {
    this.orderParaAvaliar = null;
  }

  onAvaliacaoSubmetida(orderId: string): void {
    this.jaAvaliadas.add(orderId);
    this.orderParaAvaliar = null;
    this.mensagem = 'Avaliação enviada, obrigado!';
  }

  podeAvaliar(order: Order): boolean {
    return order.podeAvaliar() && !this.jaAvaliadas.has(order.id);
  }


  details(order: Order): void {
    this.router.navigate(['/order', order.id]);
  }

  getProdutoNome(item: OrderItemDTO): string {
    if (typeof item.produtoId === 'string') {
      return item.produtoId;
    }

    return item.produtoId.nome;
  }

  getProdutoImagem(item: OrderItemDTO): string {
    if (typeof item.produtoId === 'string') {
      return '';
    }

    return item.produtoId.imagem;
  }

}
