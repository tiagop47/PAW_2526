import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  cartService = inject(CartService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  metodoEntrega: 'levantamento_loja' | 'entrega_domicilio' = 'levantamento_loja';
  moradaEntrega = '';
  processando = false;

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  incrementar(produtoId: string): void {
    const item = this.cartService.items().find(i => i.produtoId === produtoId);
    if (item) {
      this.cartService.updateQuantity(produtoId, item.quantidade + 1);
    }
  }

  decrementar(produtoId: string): void {
    const item = this.cartService.items().find(i => i.produtoId === produtoId);
    if (item) {
      this.cartService.updateQuantity(produtoId, item.quantidade - 1);
    }
  }

  removerItem(produtoId: string): void {
    this.cartService.removeItem(produtoId);
    this.notificationService.showSuccess('Item removido do carrinho.');
  }

  limparCarrinho(): void {
    if (confirm('Tem a certeza que deseja limpar todo o carrinho?')) {
      this.cartService.clearCart();
      this.notificationService.showInfo('Carrinho vazio.');
    }
  }

  finalizarEncomenda(): void {
    if (!this.isLoggedIn) {
      this.notificationService.showInfo('Por favor, faça login para finalizar a encomenda.');
      this.router.navigate(['/login']);
      return;
    }

    const items = this.cartService.items();
    const supermercadoId = this.cartService.supermarketId();

    if (items.length === 0 || !supermercadoId) {
      this.notificationService.showError('O carrinho está vazio.');
      return;
    }

    if (this.metodoEntrega === 'entrega_domicilio' && !this.moradaEntrega.trim()) {
      this.notificationService.showError('A morada de entrega é obrigatória.');
      return;
    }

    this.processando = true;

    const dados = {
      supermercadoId,
      produtos: items.map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
      metodoEntrega: this.metodoEntrega,
      moradaEntrega: this.metodoEntrega === 'entrega_domicilio' ? this.moradaEntrega : undefined
    };

    this.orderService.criarEncomenda(dados).subscribe({
      next: () => {
        this.notificationService.showSuccess('Encomenda criada com sucesso!');
        this.cartService.clearCart();
        this.processando = false;
        setTimeout(() => this.router.navigate(['/orders']), 1000);
      },
      error: (err) => {
        this.notificationService.showError(err.error?.erro || 'Erro ao criar encomenda.');
        this.processando = false;
      }
    });
  }
}
