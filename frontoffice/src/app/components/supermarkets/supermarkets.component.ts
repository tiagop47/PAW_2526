import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { SupermarketService } from '../../services/supermarket.service';
import { AuthService } from '../../services/auth.service';
import { SupermarketDTO } from '../../models/supermarket.dto';
import { SupermarketMapComponent } from '../supermarket-map/supermarket-map.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-supermarkets',
  standalone: true,
  imports: [CommonModule, RouterModule, SupermarketMapComponent, NavbarComponent],
  templateUrl: './supermarkets.component.html',
})
export class SupermarketsComponent implements OnInit {
  allSupermarkets: SupermarketDTO[] = [];
  availableZones: string[] = [];
  selectedZone: string = '';
  supermercadoNoMapa: string | null = null;

  constructor(
    public authService: AuthService,
    private supermarketService: SupermarketService,
    private router: Router,
  ) {}

  get favoritoId(): string | null {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user?.supermercadoFavorito || null;
  }

  get filteredSupermarkets(): any[] {
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
      });
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

  navigateToMercado(id: string): void {
    this.router.navigate(['/supermercado', id]);
  }

  verNoMapa(id: string): void {
    this.supermercadoNoMapa = null;
    this.supermercadoNoMapa = id;
    document.querySelector('.map-section')?.scrollIntoView({ behavior: 'instant' });
  }
}
