import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="product-detail-container" *ngIf="product">
      <a routerLink="/" class="back-link">← Voltar à Lista</a>
      
      <div class="product-info">
        <img [src]="'http://localhost:3000' + product.imagem" [alt]="product.nome" style="max-width: 300px;">
        <h1>{{ product.nome }}</h1>
        <p class="description">{{ product.descricao }}</p>
        <span class="price">{{ product.preco | currency:'EUR' }}</span>
        
        <div class="meta" *ngIf="product.categoriaId">
          <strong>Categoria:</strong> {{ product.categoriaId.nome }}
        </div>
      </div>
    </div>
    <div *ngIf="loading">Carregando detalhes...</div>
    <div *ngIf="error" class="error">{{ error }}</div>
  `,
  styles: [`
    .product-detail-container { padding: 20px; }
    .back-link { display: inline-block; margin-bottom: 20px; text-decoration: none; color: #007bff; }
    .price { font-size: 1.5rem; font-weight: bold; display: block; margin-top: 15px; }
    .error { color: red; margin-top: 20px; }
  `]
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productService.getProduct(id).subscribe({
        next: (data) => {
          this.product = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Não foi possível carregar os detalhes do produto.';
          this.loading = false;
        }
      });
    }
  }
}
