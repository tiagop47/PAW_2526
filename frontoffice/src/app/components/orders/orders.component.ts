import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { AvaliacaoService } from '../../services/avaliacao.service';
import { Order } from '../../models/order';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  erro: string | null = null;
  mensagem: string | null = null;
  orderParaAvaliar: Order | null = null;
  jaAvaliadas = new Set<string>();

  constructor(
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

  cancelarEncomenda(orderId: string): void {
    if (!confirm('Tem a certeza que deseja cancelar esta encomenda?')) return;

    this.orderService.cancelarEncomenda(orderId).subscribe({
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
}
