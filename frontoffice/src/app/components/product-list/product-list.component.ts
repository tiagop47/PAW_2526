import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { SupermarketService } from '../../services/supermarket.service';
import { ProductDetailComponent } from '../product-detail/product-detail.component';
import { ProductDTO } from '../../models/product.dto';
import { CategoryDTO } from '../../models/category.dto';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProductDetailComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private rest: ProductService,
    private supermarketService: SupermarketService,
  ) {}

  allProducts: ProductDTO[] = [];
  filteredProducts: ProductDTO[] = [];
  loading: boolean = true;
  supermarketId: string = '';
  selectedProductId: string | null = null;

  categories: CategoryDTO[] = [];
  searchQuery = '';
  selectedCategory = '';
  sortBy = 'discount';

  abrirDetalhe(productId: string): void {
    this.selectedProductId = productId;
  }

  fecharDetalhe(): void {
    this.selectedProductId = null;
  }

  ngOnInit(): void {
    this.supermarketService.getCategorias().subscribe(data => this.categories = data);

    this.route.params.subscribe((params) => {
      this.supermarketId = params['supermarketId'] || '';
      this.loadProducts();
    });
  }

  onFilterChange(): void {
    this.applyFilters({
      query: this.searchQuery,
      categoryId: this.selectedCategory,
      sortBy: this.sortBy,
    });
  }

  loadProducts(): void {
    this.loading = true;

    this.rest.getProducts(this.supermarketId).subscribe({
      next: (data: ProductDTO[]) => {
        this.allProducts = data;
        this.onFilterChange();
        this.loading = false;
      },

      error: () => {
        this.loading = false;
      },
    });
  }

  applyFilters(filters: { query?: string; categoryId?: string; sortBy?: string }): void {
    let list = this.allProducts.slice();

    if (filters.query) {
      const q = filters.query.toLowerCase();
      list = list.filter((p) => p.nome.toLowerCase().includes(q));
    }

    if (filters.categoryId) {
      list = list.filter((p) => p.categoriaId?._id === filters.categoryId);
    }

    if (filters.sortBy === 'discount') {
      list.sort((a, b) => (b.precoAntigo || 0) - b.preco - ((a.precoAntigo || 0) - a.preco));
    } else if (filters.sortBy === 'price_asc') {
      list.sort((a, b) => a.preco - b.preco);
    } else if (filters.sortBy === 'price_desc') {
      list.sort((a, b) => b.preco - a.preco);
    }

    this.filteredProducts = list;
  }
}
