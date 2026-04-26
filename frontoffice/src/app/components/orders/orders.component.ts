import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order';
import { AvaliacaoModalComponent } from '../avaliacao-modal/avaliacao-modal.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, AvaliacaoModalComponent],
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

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.carregarEncomendas();
  }

  carregarEncomendas(): void {
    this.loading = true;
    this.orderService.listarEncomendas().subscribe({
      next: (encomendas: Order[]) => {
        this.orders = encomendas;
        this.loading = false;
      },
      error: (err) => {
        this.erro = 'Não foi possível carregar as suas encomendas. Por favor, tente mais tarde.';
        this.loading = false;
        console.error('Erro ao listar encomendas:', err);
      }
    });
  }

  cancelarEncomenda(orderId: string): void {
    if (!confirm('Tem a certeza que deseja cancelar esta encomenda?')) return;

    this.orderService.cancelarEncomenda(orderId).subscribe(() => {
      this.mensagem = 'Encomenda cancelada com sucesso.';
      this.carregarEncomendas();
    });
  }

  confirmarRececao(orderId: string): void {
    this.orderService.confirmarRececao(orderId).subscribe(() => {
      this.mensagem = 'Entrega confirmada com sucesso!';
      this.carregarEncomendas();
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
