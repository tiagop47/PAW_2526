import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { OrderDTO } from '../../models/order.dto';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {
  private orderService = inject(OrderService);

  orders = signal<OrderDTO[]>([]);
  loading = signal(true);
  erro = signal<string | null>(null);
  mensagem = signal<string | null>(null);

  readonly estadoLabels: Record<string, string> = {
    pendente: 'Pendente',
    confirmada: 'Confirmada',
    preparacao: 'Em Preparação',
    em_entrega: 'Em Entrega',
    entregue: 'Entregue',
    cancelada: 'Cancelada'
  };

  readonly estadoClasses: Record<string, string> = {
    pendente: 'badge-pendente',
    confirmada: 'badge-confirmada',
    preparacao: 'badge-preparacao',
    em_entrega: 'badge-entrega',
    aguarda_confirmacao: 'badge-aguarda',
    entregue: 'badge-entregue',
    cancelada: 'badge-cancelada'
  };

  ngOnInit(): void {
    this.carregarEncomendas();
  }

  carregarEncomendas(): void {
    this.orderService.listarEncomendas().subscribe({
      next: (encomendas) => {
        this.orders.set(encomendas);
        this.loading.set(false);
      },
      error: () => {
        this.erro.set('Erro ao carregar as encomendas.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Regra b): O cliente pode cancelar uma encomenda até 5 minutos após a confirmação.
   * Se pendente, pode sempre cancelar. Se confirmada, só dentro dos 5 minutos.
   */
  podeCancelar(order: OrderDTO): boolean {
    if (order.estado === 'pendente') return true;

    if (order.estado === 'confirmada' && order.confirmadaEm) {
      const agora = new Date().getTime();
      const confirmada = new Date(order.confirmadaEm).getTime();
      const cincoMinutosMs = 5 * 60 * 1000;
      return (agora - confirmada) < cincoMinutosMs;
    }

    return false;
  }

  tempoRestanteCancelamento(order: OrderDTO): string | null {
    if (order.estado !== 'confirmada' || !order.confirmadaEm) return null;

    const agora = new Date().getTime();
    const confirmada = new Date(order.confirmadaEm).getTime();
    const cincoMinutosMs = 5 * 60 * 1000;
    const restante = cincoMinutosMs - (agora - confirmada);

    if (restante <= 0) return null;

    const minutos = Math.floor(restante / 60000);
    const segundos = Math.floor((restante % 60000) / 1000);
    return `${minutos}m ${segundos}s`;
  }

  podeConfirmarRececao(order: OrderDTO): boolean {
    return false;
  }

  cancelarEncomenda(orderId: string): void {
    if (!confirm('Tem a certeza que deseja cancelar esta encomenda?')) return;

    this.orderService.cancelarEncomenda(orderId).subscribe({
      next: () => {
        this.mensagem.set('Encomenda cancelada com sucesso.');
        this.carregarEncomendas();
      },
      error: (err) => {
        this.erro.set(err.error?.erro || 'Erro ao cancelar encomenda.');
      }
    });
  }

  confirmarRececao(orderId: string): void {
    this.orderService.confirmarRececao(orderId).subscribe({
      next: () => {
        this.mensagem.set('Entrega confirmada com sucesso!');
        this.carregarEncomendas();
      },
      error: (err) => {
        this.erro.set(err.error?.erro || 'Erro ao confirmar receção.');
      }
    });
  }

  getMetodoEntregaLabel(metodo: string): string {
    return metodo === 'entrega_domicilio' ? 'Entrega ao Domicílio' : 'Levantamento em Loja';
  }
}
