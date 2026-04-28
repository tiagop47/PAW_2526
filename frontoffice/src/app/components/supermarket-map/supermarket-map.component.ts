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
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
      this.map.setView(
        [supermercado.localizacaoGeo.coordinates[1], supermercado.localizacaoGeo.coordinates[0]],
        15,
      );
    }
  }

  private map?: L.Map;
  private mapaIniciado: boolean = false;

  private readonly COORD_PADRAO: [number, number] = [41.1579, -8.6291];
  private readonly ZOOM_PADRAO = 12;

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

    mapa.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        mapa.removeLayer(layer);
      }
    });

    // Marcador Normal (Mais visível)
    const blackIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #333; width: 16px; height: 16px; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    // Marcador de Referência (Azul)
    const favoriteIcon = L.divIcon({
      className: 'favorite-marker',
      html: `<div style="background-color: #0d6efd; width: 20px; height: 20px; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 0 12px rgba(13,110,253,0.4);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const favorito = this.supermarkets.find((s) => s._id === this.favoritoId);
    const pFav = favorito?.localizacaoGeo?.coordinates
      ? L.latLng(favorito.localizacaoGeo.coordinates[1], favorito.localizacaoGeo.coordinates[0])
      : null;

    const markers: L.LatLngExpression[] = [];

    this.supermarkets.forEach((s) => {
      if (!s.localizacaoGeo?.coordinates) return;

      const lat = s.localizacaoGeo.coordinates[1];
      const lng = s.localizacaoGeo.coordinates[0];
      const pos = L.latLng(lat, lng);
      const isFav = s._id === this.favoritoId;
      markers.push([lat, lng]);

      let distHtml = '';
      if (pFav && !isFav) {
        const d = pos.distanceTo(pFav) / 1000;
        distHtml = `<div class="mt-1 mb-2 extra-small text-primary fw-bold">A ${d.toFixed(1)} KM DA REFERÊNCIA</div>`;
      } else if (isFav) {
        distHtml = `<div class="mt-1 mb-2 extra-small text-primary fw-bold">LOJA DE REFERÊNCIA</div>`;
      }

      const marker = L.marker(pos, { icon: isFav ? favoriteIcon : blackIcon }).addTo(mapa);

      const popupHtml = `
        <div class="p-1 text-center" style="min-width: 130px;">
          <div class="fw-bold extra-small text-uppercase mb-0">${s.nome}</div>
          ${distHtml}
          <a href="/supermercado/${s._id}" class="btn btn-dark btn-sm extra-small py-1 px-3 fw-bold w-100 mt-1">EXPLORAR</a>
        </div>
      `;
      marker.bindPopup(popupHtml);

      // Raio de Atuação (Reduzido para 30% da escala visual original para ser discreto)
      L.circle(pos, {
        radius: (s.raioEntregaKm || 2) * 300,
        color: isFav ? '#0d6efd' : '#999',
        weight: 1,
        dashArray: isFav ? '0' : '4, 4',
        fillColor: isFav ? '#0d6efd' : '#666',
        fillOpacity: 0.03,
      }).addTo(mapa);
    });

    if (markers.length > 0) {
      mapa.fitBounds(L.latLngBounds(markers), { padding: [50, 50] });
    }
  }
}
