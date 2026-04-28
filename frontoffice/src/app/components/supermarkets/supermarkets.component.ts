/** ID: FIX_SUPERMARKETS_TEMPLATE_001 */
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { SupermarketService } from '../../services/supermarket.service';
import { AuthService } from '../../services/auth.service';
import { SupermarketDTO } from '../../models/supermarket.dto';
import { SupermarketMapComponent } from '../supermarket-map/supermarket-map.component';

interface SupermarketDisplay extends SupermarketDTO {
  isFavorito: boolean;
  distanciaRef: number | null;
}

@Component({
  selector: 'app-supermarkets',
  standalone: true,
  imports: [CommonModule, RouterModule, SupermarketMapComponent],
  templateUrl: './supermarkets.component.html',
})
export class SupermarketsComponent implements OnInit {
  private supermarketService = inject(SupermarketService);
  public authService = inject(AuthService);
  private router = inject(Router);

  allSupermarkets: SupermarketDTO[] = [];
  availableZones: string[] = [];
  selectedZone: string = '';
  supermercadoNoMapa: string | null = null;

  get favoritoId(): string | null {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user?.supermercadoFavorito || null;
  }

  get filteredSupermarkets(): SupermarketDisplay[] {
    const favId = this.favoritoId;

    const filtered = this.allSupermarkets.filter((s) => {
      return !this.selectedZone || s.localizacao === this.selectedZone;
    });

    const favorito = this.allSupermarkets.find((s) => s._id === favId);
    const pFav = favorito?.localizacaoGeo?.coordinates
      ? L.latLng(favorito.localizacaoGeo.coordinates[1], favorito.localizacaoGeo.coordinates[0])
      : null;

    return filtered.map((s) => {
      let distRef: number | null = null;

      if (pFav && s._id !== favId && s.localizacaoGeo?.coordinates) {
        const p2 = L.latLng(s.localizacaoGeo.coordinates[1], s.localizacaoGeo.coordinates[0]);
        distRef = pFav.distanceTo(p2) / 1000;
      }

      return Object.assign({}, s, {
        isFavorito: s._id === favId,
        distanciaRef: distRef,
      }) as SupermarketDisplay;
    });
  }

  ngOnInit(): void {
    this.supermarketService.getSupermarkets().subscribe((data: SupermarketDTO[]) => {
      this.allSupermarkets = data;
      this.availableZones = Array.from(
        new Set(data.map((s) => s.localizacao).filter(Boolean)),
      ).sort();
    });
  }

  onZoneChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedZone = select.value;
  }

  navigateToMercado(id: string): void {
    this.router.navigate(['/products', id]);
  }

  verNoMapa(id: string): void {
    this.supermercadoNoMapa = null;
    this.supermercadoNoMapa = id;
    setTimeout(() => {
      const el = document.querySelector('app-supermarket-map');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }
}
