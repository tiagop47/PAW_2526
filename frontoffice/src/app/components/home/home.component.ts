/** ID: FIX_HOME_TEMPLATE_001 */
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupermarketService } from '../../services/supermarket.service';
import { ProductListComponent } from '../product-list/product-list.component';
import { CategoryDTO } from '../../models/category.dto';
import { CouponDTO } from '../../models/coupon.dto';
import { StorePromotionDTO } from '../../models/home-promotions.dto';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProductListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  @ViewChild('productList') productList!: ProductListComponent;

  constructor(private supermarketService: SupermarketService) {}
  
  categories: CategoryDTO[] = [];
  lojasPromocao: StorePromotionDTO[] = [];
  cupoes: CouponDTO[] = [];
  
  searchQuery = '';
  selectedCategory = '';
  sortBy = 'discount'; 

  ngOnInit(): void {
    this.supermarketService.getCategorias().subscribe(data => this.categories = data);
    
    this.supermarketService.getPromocoes().subscribe({
      next: (data) => {
        this.lojasPromocao = data.lojas;
        this.cupoes = data.cupoes;
      },
      error: (err) => console.error('Erro ao carregar promocoes:', err)
    });
  }

  onFilterChange(): void {
    if (this.productList) {
      this.productList.applyFilters({
        query: this.searchQuery,
        categoryId: this.selectedCategory,
        sortBy: this.sortBy
      });
    }
  }

  limparFiltros(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.sortBy = 'discount';
    this.onFilterChange();
  }
}
