import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { SupermarketService } from '../../services/supermarket.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { SupermarketDTO } from '../../models/supermarket.dto';

interface CupaoDisponivel {
  codigo: string;
  percentagemDesconto: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit {
  constructor(
    public cartService: CartService,
    private orderService: OrderService,
    private supermarketService: SupermarketService,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
  ) {}

  metodoEntrega: any = null;
  metodoPagamento: 'cartao' | 'mbway' | 'dinheiro' = 'cartao';
  moradaEntrega = '';
  processando = false;
  supermercadoId!: string;
  supermercado?: SupermarketDTO;
  metodosCusto: { tipo: string; custo: number }[] = [];
  cupoesCliente: CupaoDisponivel[] = [];
  cupoesSupermercado: CupaoDisponivel[] = [];

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  ngOnInit(): void {
    this.supermercadoId = this.cartService.activeSupermarketId() || '';

    if (this.supermercadoId) {
      this.supermarketService.getSupermarket(this.supermercadoId).subscribe((s) => {
        this.supermercado = s;
      });

      this.supermarketService.getMetodosCusto(this.supermercadoId).subscribe((res: any) => {
        if (res && !Array.isArray(res)) {
          this.metodosCusto = Object.entries(res).map(([tipo, custo]) => ({
            tipo: tipo,
            custo: (custo as number) || 0,
          }));
        } else {
          this.metodosCusto = res || [];
        }

        // Seleciona o primeiro disponível por defeito se nada estiver selecionado
        if (this.metodosCusto.length > 0 && !this.metodoEntrega) {
          this.metodoEntrega = this.metodosCusto[0];
        } else if (this.metodoEntrega) {
          const atualizado = this.metodosCusto.find((m) => m.tipo === this.metodoEntrega.tipo);
          if (atualizado) this.metodoEntrega = atualizado;
        }

        this.atualizarCustoEntrega();
      });
    }

    if (this.isLoggedIn) {
      this.carregarCupoes();
    }
  }

  atualizarCustoEntrega(): void {
    if (this.metodoEntrega) {
      this.cartService.custoEntrega.set(this.metodoEntrega.custo);
    }
  }

  getLabelCusto(tipo: string): string {
    const m = this.metodosCusto.find((metodo) => metodo.tipo === tipo);
    if (!m) return 'Grátis';
    return m.custo > 0 ? `${m.custo.toFixed(2)}€` : 'Grátis';
  }

  getMetodoLabel(tipo: string): string {
    const labels: { [key: string]: string } = {
      levantamento_loja: 'Levantamento em Loja',
      entrega_domicilio: 'Entrega ao Domicílio',
    };
    return labels[tipo] || tipo.replace(/_/g, ' ');
  }

  carregarCupoes(): void {
    this.orderService.meusCupoes().subscribe((cupoes) => {
      this.cupoesCliente = cupoes
        .filter((c) => !c.expirado && (c.supermercadoId === null || c.supermercadoId === this.supermercadoId))
        .map((c) => ({ codigo: c.codigo, percentagemDesconto: c.percentagemDesconto }));

      if (this.supermercadoId) {
        this.supermarketService.getCupoes(this.supermercadoId).subscribe((sCupoes) => {
          this.cupoesSupermercado = sCupoes
            .filter((c) => !this.cupoesCliente.some((cc) => cc.codigo === c.codigo))
            .map((c) => ({
              codigo: c.codigo,
              percentagemDesconto: c.percentagemDesconto,
            }));
        });
      }
    });
  }

  selecionarCupao(cupao: CupaoDisponivel): void {
    if (this.cartService.cupao()?.codigo === cupao.codigo) {
      this.cartService.removeCoupon();
      return;
    }

    this.orderService.validarCupao(cupao.codigo, this.supermercadoId).subscribe({
      next: (res) => {
        if (res.sucesso) this.cartService.applyCoupon(cupao.codigo, res.percentagemDesconto);
      },
      error: (err) => this.notificationService.showError(err.error?.erro || 'Cupão inválido.'),
    });
  }

  limparCarrinho(): void {
    this.cartService.clearCart();
    this.cupoesCliente = [];
    this.cupoesSupermercado = [];
  }

  finalizarEncomenda(): void {
    if (!this.isLoggedIn) {
      this.notificationService.showInfo('Inicie sessão para comprar.');
      this.router.navigate(['/login']);
      return;
    }

    const items = this.cartService.items();
    if (items.length === 0) return;

    if (this.metodoEntrega?.tipo === 'entrega_domicilio' && !this.moradaEntrega.trim()) {
      this.notificationService.showError('A morada é obrigatória.');
      return;
    }

    this.processando = true;
    this.orderService
      .criarEncomenda({
        supermercadoId: this.supermercadoId!,
        produtos: items.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
        metodoEntrega: this.metodoEntrega?.tipo,
        metodoPagamento: this.metodoPagamento,
        codigoCupao: this.cartService.cupao()?.codigo,
        moradaEntrega: this.metodoEntrega?.tipo === 'entrega_domicilio' ? this.moradaEntrega : undefined,
      })
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Encomenda realizada!');
          this.cartService.clearCart();
          this.router.navigate(['/orders']);
        },
        error: (err) => {
          this.notificationService.showError(err.error?.erro || 'Erro na finalização.');
          this.processando = false;
        },
      });
  }
}
