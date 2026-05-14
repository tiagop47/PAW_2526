import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { NotificationService } from '../../services/notification.service';
import { Order } from '../../models/order';
import { OrderItemDTO } from '../../models/order.dto';
import { getPageNumbers, getTotalPages, paginate } from '../../utils/pagination';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  currentPage = 1;
  pageSize = 5;
  pageSizeOptions = [5, 10, 20];

  get totalPages(): number {
    return getTotalPages(this.orders.length, this.pageSize);
  }

  get paginatedOrders(): Order[] {
    return paginate(this.orders, this.currentPage, this.pageSize);
  }

  get pageNumbers(): number[] {
    return getPageNumbers(this.orders.length, this.pageSize);
  }

  verDetalhes(orderId: string): void {
    this.router.navigate(['/order', orderId]);
  }

  constructor(
    private orderService: OrderService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.carregarEncomendas();
  }

  carregarEncomendas(): void {
    this.loading = true;
    this.orderService.listarEncomendas().subscribe({
      next: (encomendas) => {
        this.orders = encomendas;
        this.currentPage = 1;
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

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }
}
