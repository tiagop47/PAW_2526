import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupermarketService } from '../../services/supermarket.service';
import { ProductListComponent } from '../product-list/product-list.component';
import { CouponDTO } from '../../models/coupon.dto';
import { StorePromotionDTO } from '../../models/home-promotions.dto';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  constructor(private supermarketService: SupermarketService, public authService: AuthService) {}

  lojasPromocao: StorePromotionDTO[] = [];
  cupoes: CouponDTO[] = [];

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.supermarketService.getPromocoes().subscribe({
        next: (data) => {
          this.lojasPromocao = data.lojas;
          this.cupoes = data.cupoes.filter(c => c.supermercadoId != null);
        },
        error: (err) => console.error('Erro ao carregar promocoes:', err),
      });
    }
  }
}
