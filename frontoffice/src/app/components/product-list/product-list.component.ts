import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
  // Usar Signals garante que o Angular detete a mudança imediatamente
  products = signal<Product[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    console.log('A tentar carregar produtos (Signal Mode)...');
    this.productService.getProducts().subscribe({
      next: (data) => {
        console.log('Produtos recebidos com sucesso:', data);
        this.products.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro na subscrição:', err);
        this.error.set('Erro ao carregar produtos. Backend desligado?');
        this.loading.set(false);
      }
    });
  }
}
