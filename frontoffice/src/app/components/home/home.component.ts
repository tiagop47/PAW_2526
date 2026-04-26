import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { SupermarketService } from '../../services/supermarket.service';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { SupermarketDTO } from '../../models/supermarket.dto';
import { ProductDTO } from '../../models/product.dto';
import { SupermarketMapComponent } from '../supermarket-map/supermarket-map.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SupermarketMapComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  allSupermarkets: SupermarketDTO[] = [];
  cheapestProducts: any[] = [];
  availableZones: string[] = [];
  selectedZone: string = '';
  loadingProducts = true;
  supermercadoNoMapa: string | null = null;

  constructor(
    public authService: AuthService,
    private supermarketService: SupermarketService,
    private productService: ProductService,
    private router: Router
  ) {}

  get favoritoId(): string | null {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user?.supermercadoFavorito || null;
  }

  get filteredSupermarkets(): any[] {
    const favId = this.favoritoId;

    const filtered = this.allSupermarkets.filter(s => {
      return !this.selectedZone || s.localizacao === this.selectedZone;
    });

    const favorito = this.allSupermarkets.find(s => s._id === favId);
    const pFav = (favorito?.localizacaoGeo?.coordinates) 
      ? L.latLng(favorito.localizacaoGeo.coordinates[1], favorito.localizacaoGeo.coordinates[0]) 
      : null;

    return filtered.map(s => {
      let distRef: number | null = null;
      
      if (pFav && s._id !== favId && s.localizacaoGeo?.coordinates) {
        const p2 = L.latLng(s.localizacaoGeo.coordinates[1], s.localizacaoGeo.coordinates[0]);
        distRef = pFav.distanceTo(p2) / 1000;
      }

      return { 
        ...s, 
        isFavorito: s._id === favId,
        distanciaRef: distRef 
      };
    });
  }

  ngOnInit(): void {
    this.supermarketService.getSupermarkets().subscribe((data: SupermarketDTO[]) => {
      this.allSupermarkets = data;
      this.availableZones = [...new Set(data.map(s => s.localizacao).filter(Boolean))].sort();
    });

    this.carregarComparativo();
  }

  carregarComparativo(): void {
    this.productService.getProducts().subscribe((products: ProductDTO[]) => {
      const groups = new Map<string, ProductDTO[]>();
      products.forEach(p => {
        const key = p.codigoBarras || p.nome.toLowerCase().trim();
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(p);
      });

      const pFav = this.getLatLngFavorito();

      this.cheapestProducts = Array.from(groups.values())
        .map(group => {
          const uniqueSupermarkets: any[] = [];
          const seenSm = new Set<string>();
          
          [...group].sort((a, b) => a.preco - b.preco).forEach(p => {
            const smId = typeof p.supermercadoId === 'string' ? p.supermercadoId : p.supermercadoId._id;
            if (!seenSm.has(smId)) {
              seenSm.add(smId);
              
              let distRef = null;
              const smObj = this.allSupermarkets.find(s => s._id === smId);
              if (pFav && smObj?.localizacaoGeo?.coordinates) {
                distRef = pFav.distanceTo(L.latLng(smObj.localizacaoGeo.coordinates[1], smObj.localizacaoGeo.coordinates[0])) / 1000;
              }

              uniqueSupermarkets.push({ ...p, distanciaRef: distRef });
            }
          });
          return uniqueSupermarkets;
        })
        .filter(group => group.length > 1)
        .map(group => {
          const sorted = group.sort((a, b) => a.preco - b.preco);
          return {
            principal: sorted[0],
            poupanca: sorted[1].preco - sorted[0].preco
          };
        })
        .sort((a, b) => b.poupanca - a.poupanca)
        .slice(0, 4);

      this.loadingProducts = false;
    });
  }

  private getLatLngFavorito(): L.LatLng | null {
    const favId = this.favoritoId;
    const favorito = this.allSupermarkets.find(s => s._id === favId);
    if (favorito?.localizacaoGeo?.coordinates) {
      return L.latLng(favorito.localizacaoGeo.coordinates[1], favorito.localizacaoGeo.coordinates[0]);
    }
    return null;
  }

  initial(name: string): string {
    return name.trim().charAt(0).toUpperCase();
  }

  navigateToProducts(id: string): void {
    this.router.navigate(['/products', id]);
  }

  verNoMapa(id: string): void {
    this.supermercadoNoMapa = null;
    setTimeout(() => {
      this.supermercadoNoMapa = id;
      document.querySelector('.map-section')?.scrollIntoView({ behavior: 'instant' });
    });
  }
}
