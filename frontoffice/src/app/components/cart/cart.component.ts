import { Component } from '@angular/core';
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
  constructor(
    public cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  metodoEntrega: 'levantamento_loja' | 'entrega_domicilio' = 'levantamento_loja';
  metodoPagamento: 'cartao' | 'mbway' | 'dinheiro' = 'cartao';
  moradaEntrega = '';
  codigoCupaoInput = '';
  processando = false;

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  limparCarrinho(): void {
    if (confirm('Deseja esvaziar o carrinho?')) {
      this.cartService.clearCart();
      this.codigoCupaoInput = '';
    }
  }

  aplicarCupao(): void {
    const codigo = this.codigoCupaoInput.trim().toUpperCase();
    const smId = this.cartService.activeSupermarketId();
    if (!codigo || !smId) return;

    this.orderService.validarCupao(codigo, smId).subscribe({
      next: (res) => {
        if (res.sucesso) {
          this.cartService.applyCoupon(codigo, res.percentagemDesconto);
          this.notificationService.showSuccess('Cupão aplicado!');
          this.codigoCupaoInput = '';
        }
      },
      error: (err) => this.notificationService.showError(err.error?.erro || 'Cupão inválido.')
    });
  }

  finalizarEncomenda(): void {
    if (!this.isLoggedIn) {
      this.notificationService.showInfo('Inicie sessão para comprar.');
      this.router.navigate(['/login']);
      return;
    }

    const items = this.cartService.items();
    if (items.length === 0) return;

    if (this.metodoEntrega === 'entrega_domicilio' && !this.moradaEntrega.trim()) {
      this.notificationService.showError('A morada é obrigatória.');
      return;
    }

    this.processando = true;
    const dados = {
      supermercadoId: this.cartService.activeSupermarketId()!,
      produtos: items.map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
      metodoEntrega: this.metodoEntrega,
      metodoPagamento: this.metodoPagamento,
      codigoCupao: this.cartService.cupao()?.codigo,
      moradaEntrega: this.metodoEntrega === 'entrega_domicilio' ? this.moradaEntrega : undefined
    };

    this.orderService.criarEncomenda(dados).subscribe({
      next: () => {
        this.notificationService.showSuccess('Encomenda realizada!');
        this.cartService.clearCart();
        this.router.navigate(['/orders']);
      },
      error: (err) => {
        this.notificationService.showError(err.error?.erro || 'Erro na finalização.');
        this.processando = false;
      }
    });
  }
}
