import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
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
  loading: boolean = true;
  erro: string | null = null;
  mensagem: string | null = null;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.carregarEncomendas();
  }

  carregarEncomendas(): void {
    this.orderService.listarEncomendas().subscribe((encomendas: Order[]) => {
      this.orders = encomendas;
      this.loading = false;
    });
  }

  cancelarEncomenda(orderId: string): void {
    if (!confirm('Tem a certeza que deseja cancelar esta encomenda?')) return;

    this.orderService.cancelarEncomenda(orderId).subscribe((encomenda: Order) => {
      this.mensagem = 'Encomenda cancelada com sucesso.';
      this.carregarEncomendas();
    });
  }

  confirmarRececao(orderId: string): void {
    this.orderService.confirmarRececao(orderId).subscribe((encomenda: Order) => {
      this.mensagem = 'Entrega confirmada com sucesso!';
      this.carregarEncomendas();
    });
  }
}
