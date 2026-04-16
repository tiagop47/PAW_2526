import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  products = signal<Product[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute, // Para ler a URL
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    // Lemos o 'supermarketId' que definimos nas rotas
    const id = this.route.snapshot.paramMap.get('supermarketId');
    
    if (id) {
      this.loadProducts(id);
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
}
