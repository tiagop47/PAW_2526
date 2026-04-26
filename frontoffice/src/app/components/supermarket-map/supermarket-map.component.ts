import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import { SupermarketDTO } from '../../models/supermarket.dto';

const iconDefault = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-supermarket-map',
  standalone: true,
  templateUrl: './supermarket-map.component.html',
  styleUrl: './supermarket-map.component.css'
})
export class SupermarketMapComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Input() supermarkets: SupermarketDTO[] = [];
  @Input() favoritoId: string | null = null;
  @Input() set focarSupermercado(id: string | null) {
    if (!id || !this.map) return;
    const s = this.supermarkets.find(s => s._id === id);
    if (s?.localizacaoGeo?.coordinates) {
      this.map.setView([s.localizacaoGeo.coordinates[1], s.localizacaoGeo.coordinates[0]], 15);
    }
  }

  private map?: L.Map;
  private mapaIniciado: boolean = false;

  private readonly COORD_PADRAO: [number, number] = [41.2777, -8.2814];
  private readonly ZOOM_PADRAO = 11;

  constructor() {}

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['supermarkets'] || changes['favoritoId']) && this.mapaIniciado) {
      this.adicionarMarcadores();
    }
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.mapaIniciado = true;
    if (this.supermarkets && this.supermarkets.length > 0) {
      this.adicionarMarcadores();
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement).setView(this.COORD_PADRAO, this.ZOOM_PADRAO);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(this.map);
  }

  private adicionarMarcadores(): void {
    const mapa = this.map;
    if (!mapa) return;

    mapa.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        mapa.removeLayer(layer);
      }
    });

    const comCoordenadas = this.supermarkets.filter(s => s.localizacaoGeo?.coordinates);
    const favorito = this.supermarkets.find(s => s._id === this.favoritoId);
    const pFav = (favorito?.localizacaoGeo?.coordinates) 
      ? L.latLng(favorito.localizacaoGeo.coordinates[1], favorito.localizacaoGeo.coordinates[0]) 
      : null;

    comCoordenadas.forEach(s => {
      const coords = s.localizacaoGeo?.coordinates;
      if (!coords) return;

      const currentLatLng = L.latLng(coords[1], coords[0]);
      const raioM = (s.raioEntregaKm ?? 1) * 500;

      // Distância ao favorito para o popup
      let distFavHtml = '';
      if (pFav && s._id !== this.favoritoId) {
        const d = currentLatLng.distanceTo(pFav) / 1000;
        distFavHtml = `<div style="color:#000; font-weight:bold; margin-top:5px; font-size:0.75rem;">A ${d.toFixed(1)} KM DO SEU FAVORITO</div>`;
      } else if (s._id === this.favoritoId) {
        distFavHtml = `<div style="background:#000; color:#fff; padding:2px 5px; margin-top:5px; font-size:0.7rem; text-align:center;">O MEU FAVORITO</div>`;
      }

      // Calcular distâncias para os outros vizinhos
      const distancias = comCoordenadas
        .filter(other => other._id !== s._id)
        .map(other => {
          const d = currentLatLng.distanceTo(L.latLng(other.localizacaoGeo!.coordinates[1], other.localizacaoGeo!.coordinates[0]));
          return { nome: other.nome, dist: d / 1000 };
        })
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 2);

      let distHtml = '';
      if (distancias.length > 0) {
        distHtml = '<div style="margin-top:8px; border-top:1px solid #eee; padding-top:5px;"><small><strong>Mais próximos:</strong><br>';
        distancias.forEach(d => {
          distHtml += `• ${d.nome}: ${d.dist.toFixed(1)} km<br>`;
        });
        distHtml += '</small></div>';
      }

      L.marker([coords[1], coords[0]])
        .addTo(mapa!)
        .bindPopup(`
          <div style="text-transform:uppercase; font-family:sans-serif;">
            <strong>${s.nome}</strong><br>
            <span style="color:#666; font-size:0.75rem;">${s.localizacao}</span><br>
            ${distFavHtml}
            ${distHtml}
          </div>
        `);

      L.circle([coords[1], coords[0]], {
        radius: raioM,
        color: s._id === this.favoritoId ? '#000' : '#444',
        fillColor: '#000',
        fillOpacity: 0.08,
        weight: s._id === this.favoritoId ? 2 : 1,
      }).addTo(mapa!);
    });

    if (comCoordenadas.length > 0) {
      const bounds = comCoordenadas.map(s => [s.localizacaoGeo!.coordinates[1], s.localizacaoGeo!.coordinates[0]] as [number, number]);
      mapa.fitBounds(bounds, { padding: [40, 40] });
    }
  }
}
