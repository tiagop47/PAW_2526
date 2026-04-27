import { Component, OnInit } from '@angular/core';
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
  styleUrl: './product-list.component.css',
})

export class ProductListComponent implements OnInit {
  products: ProductDTO[] = [];
  loading: boolean = true;
  error: string | null = null;
  supermarketId: string = "";

  constructor(
    private route: ActivatedRoute,
    private rest: ProductService,
    public cartService: CartService,
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.supermarketId = params['supermarketId'];

      this.route.queryParams.subscribe(queryParams => {
        const query = queryParams['q'];
        this.loadProducts(query);
      });
    });
  }

  loadProducts(query?: string): void {
    this.loading = true;
    this.rest.getProducts(this.supermarketId).subscribe({
      next: (data: ProductDTO[]) => {
        if (query) {
          this.products = data.filter(p =>
            p.nome.toLowerCase().includes(query.toLowerCase()) ||
            p.categoriaId?.nome.toLowerCase().includes(query.toLowerCase())
          );
        } else {
          this.products = data;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar produtos.';
        this.loading = false;
      }
    });
  }

  addToCart(product: ProductDTO): void {
    const smId = this.supermarketId || (typeof product.supermercadoId === 'string' ? product.supermercadoId : product.supermercadoId._id);
    const smNome = typeof product.supermercadoId === 'string' ? 'Supermercado' : product.supermercadoId.nome;

    if (!smId) {
      console.error('Supermarket ID not found for product', product);
      return;
    }

    this.cartService.addItem({
      produtoId: product._id,
      nome: product.nome,
      imagem: 'http://localhost:3000' + product.imagem,
      preco: product.preco,
      quantidade: 1,
      stockDisponivel: product.stockDisponivel,
      supermercadoId: smId,
      supermercadoNome: smNome
    });
  }

  isOutOfStock(product: ProductDTO): boolean {
    return product.stockDisponivel <= 0;
  }
}
