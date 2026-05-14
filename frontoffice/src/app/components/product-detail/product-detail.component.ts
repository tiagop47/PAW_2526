import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { ProductDTO } from '../../models/product.dto';
import { PrecoComparacao } from '../preco-comparacao/preco-comparacao';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PrecoComparacao],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  produtoBase: ProductDTO | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private rest: ProductService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) this.carregar(id);
    });
  }

  private carregar(id: string): void {
    this.loading = true;
    this.error = null;

    this.rest.getProduct(id).subscribe({
      next: (produto: ProductDTO) => {
        this.produtoBase = produto;
        this.loading = false;
      },
      error: () => {
        this.error = 'Produto não encontrado.';
        this.loading = false;
      },
    });
  }
}
