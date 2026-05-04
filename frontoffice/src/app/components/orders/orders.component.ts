import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { AvaliacaoService } from '../../services/avaliacao.service';
import { NotificationService } from '../../services/notification.service';
import { Order } from '../../models/order';
import { DetalhesEncomenda } from '../../detalhes-encomenda/detalhes-encomenda';
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
  jaAvaliadas = new Set<string>();
  selectedOrder: Order | null = null;

  abrirDetalhes(order: Order): void {
    this.selectedOrder = order;
  }

  onAvaliouEncomenda(orderId: string): void {
    this.jaAvaliadas = new Set([...this.jaAvaliadas, orderId]);
  }

  fecharDetalhes(): void {
    this.selectedOrder = null;
  }

  constructor(
    private orderService: OrderService,
    private avaliacaoService: AvaliacaoService,
    private notificationService: NotificationService,
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
        this.notificationService.showError('Não foi possível carregar as encomendas.');
        this.loading = false;
      },
    });
  }

  cancelarEncomenda(order: Order): void {
    if (!order.podeCancelar()) return;
    if (!confirm('Tem a certeza que deseja cancelar esta encomenda?')) return;

    this.orderService.cancelarEncomenda(order.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Encomenda cancelada com sucesso.');
        this.carregarEncomendas();
      },
      error: (err) => this.notificationService.showError(err.error?.erro || 'Erro ao cancelar.'),
    });
  }

  confirmarRececao(orderId: string): void {
    this.orderService.confirmarRececao(orderId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Entrega confirmada com sucesso!');
        this.carregarEncomendas();
      },
      error: (err) => this.notificationService.showError(err.error?.erro || 'Erro ao confirmar.'),
    });
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

