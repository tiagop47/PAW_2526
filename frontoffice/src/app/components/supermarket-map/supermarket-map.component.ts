import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { SupermarketDTO } from '../../models/supermarket.dto';

@Component({
  selector: 'app-supermarket-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './supermarket-map.component.html',
  styleUrl: './supermarket-map.component.css',
})
export class SupermarketMapComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  @Input() supermarkets: SupermarketDTO[] = [];
  @Input() favoritoId: string | null = null;

  @Input() set focarSupermercado(id: string | null) {
    if (!id || !this.map) {
      return;
    }

    const supermercado = this.supermarkets.find((item) => item._id === id);
    if (supermercado?.localizacaoGeo?.coordinates) {
      this.map.setView([supermercado.localizacaoGeo.coordinates[1], supermercado.localizacaoGeo.coordinates[0]], 15);
    }
  }

  private map?: L.Map;
  private mapaIniciado: boolean = false;

  private readonly COORD_PADRAO: [number, number] = [41.1579, -8.6291];
  private readonly ZOOM_PADRAO = 12;

  private readonly blackIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: #333; width: 16px; height: 16px; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  private readonly favoriteIcon = L.divIcon({
    className: 'favorite-marker',
    html: `<div style="background-color: #0d6efd; width: 20px; height: 20px; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 0 12px rgba(13,110,253,0.4);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  constructor(
    private router: Router,
    private zone: NgZone,
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['supermarkets'] || changes['favoritoId']) && this.mapaIniciado) {
      this.adicionarMarcadores();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
      this.mapaIniciado = true;
      if (this.supermarkets.length > 0) {
        this.adicionarMarcadores();
      }
    }, 200);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    if (this.map) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: false,
      scrollWheelZoom: false,
    }).setView(this.COORD_PADRAO, this.ZOOM_PADRAO);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB',
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
  }

  private adicionarMarcadores(): void {
    const mapa = this.map;
    if (!mapa) return;

    this.limparMarcadores(mapa);

    const favPos = this.supermarkets.find((s) => s._id === this.favoritoId)?.localizacaoGeo?.coordinates;
    const pFav = favPos ? L.latLng(favPos[1], favPos[0]) : null;

    const bounds: L.LatLngExpression[] = [];

    this.supermarkets.forEach((s) => {
      if (!s.localizacaoGeo?.coordinates) return;

      const [lng, lat] = s.localizacaoGeo.coordinates;
      const pos = L.latLng(lat, lng);
      const isFav = s._id === this.favoritoId;
      bounds.push([lat, lng]);

      const marker = L.marker(pos, { icon: isFav ? this.favoriteIcon : this.blackIcon })
        .bindPopup(this.criarPopup(s, pos, pFav, isFav))
        .addTo(mapa);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`explorar-${s._id}`);
        if (btn) {
          btn.onclick = () => {
            this.zone.run(() => {
              this.router.navigate(['/products', s._id]);
            });
          };
        }
      });

      this.criarRaio(pos, s.raioEntregaKm, isFav).addTo(mapa);
    });

    if (bounds.length > 0) {
      mapa.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] });
    }
  }

  private limparMarcadores(mapa: L.Map): void {
    const toRemove: L.Layer[] = [];
    mapa.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        toRemove.push(layer);
      }
    });
    toRemove.forEach((layer) => mapa.removeLayer(layer));
  }

  private criarPopup(s: SupermarketDTO, pos: L.LatLng, pFav: L.LatLng | null, isFav: boolean): string {
    let distHtml = '';
    if (isFav) {
      distHtml = `<div class="mt-1 mb-2 extra-small text-primary fw-bold">LOJA DE REFERÊNCIA</div>`;
    } else if (pFav) {
      const d = (pos.distanceTo(pFav) / 1000).toFixed(1);
      distHtml = `<div class="mt-1 mb-2 extra-small text-primary fw-bold">A ${d} KM DA REFERÊNCIA</div>`;
    }

    return `
      <div class="map-popup p-1 text-center">
        <div class="fw-bold extra-small text-uppercase mb-0">${s.nome}</div>
        ${distHtml}
        <button id="explorar-${s._id}" class="btn btn-dark btn-sm extra-small py-1 px-3 fw-bold w-100 mt-1">EXPLORAR</button>
      </div>
    `;
  }

  private criarRaio(pos: L.LatLng, raioKm: number = 2, isFav: boolean): L.Circle {
    return L.circle(pos, {
      radius: raioKm * 300,
      color: isFav ? '#0d6efd' : '#999',
      weight: 1,
      dashArray: isFav ? '0' : '4, 4',
      fillColor: isFav ? '#0d6efd' : '#666',
      fillOpacity: 0.03,
    });
  }
}
