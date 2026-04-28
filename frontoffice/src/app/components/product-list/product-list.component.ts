import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { SupermarketService } from '../../services/supermarket.service';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { ProductDTO } from '../../models/product.dto';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private rest = inject(ProductService);
  private supermarketService = inject(SupermarketService);
  public cartService = inject(CartService);
  private notificationService = inject(NotificationService);

  allProducts: ProductDTO[] = [];
  filteredProducts: ProductDTO[] = [];
  loading: boolean = true;
  supermarketId: string = "";
  supermarketNome: string = "";

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.supermarketId = params['supermarketId'] || "";
      if (this.supermarketId) {
        this.supermarketService.getSupermarket(this.supermarketId).subscribe(s => this.supermarketNome = s.nome);
      }
      this.loadProducts();
    });
  }

  loadProducts(query?: string): void {
    this.loading = true;
    this.rest.getProducts(this.supermarketId).subscribe({
      next: (data: ProductDTO[]) => {
        this.allProducts = data;
        this.applyFilters({ query });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  applyFilters(filters: { query?: string, categoryId?: string, sortBy?: string }): void {
    let list = this.allProducts.slice();

    if (filters.query) {
      const q = filters.query.toLowerCase();
      list = list.filter(p => p.nome.toLowerCase().includes(q));
    }

    if (filters.categoryId) {
      list = list.filter(p => p.categoriaId?._id === filters.categoryId);
    }

    if (filters.sortBy === 'discount') {
      list.sort((a, b) => ((b.precoAntigo || 0) - b.preco) - ((a.precoAntigo || 0) - a.preco));
    } else if (filters.sortBy === 'price_asc') {
      list.sort((a, b) => a.preco - b.preco);
    } else if (filters.sortBy === 'price_desc') {
      list.sort((a, b) => b.preco - a.preco);
    }

    this.filteredProducts = list;
  }

  addToCart(product: ProductDTO): void {
    const smId = this.supermarketId || (typeof product.supermercadoId === 'string' ? product.supermercadoId : product.supermercadoId?._id);
    const smNome = this.supermarketNome || (typeof product.supermercadoId === 'string' ? 'Supermercado' : (product.supermercadoId?.nome || 'Supermercado'));

    const resultado = this.cartService.addItem({
      produtoId: product._id,
      nome: product.nome,
      imagem: product.imagem,
      preco: product.preco,
      quantidade: 1,
      stockDisponivel: product.stockDisponivel,
      supermercadoId: smId,
      supermercadoNome: smNome
    });

    if (resultado.sucesso) {
      this.notificationService.showSuccess(`"${product.nome}" adicionado!`);
    } else {
      this.notificationService.showError(resultado.erro || 'Erro ao adicionar.');
    }
  }
}
