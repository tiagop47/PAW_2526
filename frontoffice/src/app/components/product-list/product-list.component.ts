import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { ProductDTO } from '../../models/product.dto';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  products = signal<ProductDTO[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  private supermarketId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    public cartService: CartService
  ) {}

  ngOnInit(): void {
    this.supermarketId = this.route.snapshot.paramMap.get('supermarketId');

    if (this.supermarketId) {
      this.loadProducts(this.supermarketId);
    } else {
      this.error.set('Nenhum supermercado selecionado.');
      this.loading.set(false);
    }
  }

  loadProducts(supermarketId: string): void {
    this.productService.getProducts(supermarketId).subscribe({
      next: (data) => {
        this.products.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Erro ao carregar produtos deste supermercado.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Regra d): Produtos sem stock não podem ser adicionados ao carrinho.
   * Regra a): Só produtos de um supermercado por encomenda.
   */
  addToCart(product: ProductDTO): void {
    if (!this.supermarketId) return;

    const resultado = this.cartService.addItem({
      produtoId: product._id,
      nome: product.nome,
      imagem: 'http://localhost:3000' + product.imagem,
      preco: product.preco,
      quantidade: 1,
      stockDisponivel: product.stockDisponivel
    }, this.supermarketId);

    if (resultado.sucesso) {
      this.showToast('Produto adicionado ao carrinho!', 'success');
    } else {
      this.showToast(resultado.erro!, 'error');
    }
  }

  isOutOfStock(product: ProductDTO): boolean {
    return product.stockDisponivel <= 0;
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }
}

