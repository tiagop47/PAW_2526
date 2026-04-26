import { Component, OnInit, OnDestroy, AfterViewInit, Input, ElementRef, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { SupermarketDTO } from '../../models/supermarket.dto';

// Fix Leaflet marker icons broken by webpack
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
  template: `<div #mapContainer class="map-container"></div>`,
  styles: [`
    .map-container {
      width: 100%;
      height: 420px;
      border-radius: 8px;
      border: 1px solid #e5e5e5;
    }
  `]
})
export class SupermarketMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Input() supermarkets: SupermarketDTO[] = [];

  private map?: L.Map;

  private readonly COORD_PADRAO: [number, number] = [41.2777, -8.2814];
  private readonly ZOOM_PADRAO = 11;
  private readonly MULTIPLIER_RAIO = 1000; // km -> metros

  ngAfterViewInit(): void {
    this.initMap();
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

    const comCoordenadas = this.supermarkets.filter(s => s.localizacaoGeo?.coordinates);

    comCoordenadas.forEach(s => {
      const [lng, lat] = s.localizacaoGeo!.coordinates;
      const raioM = (s.raioEntregaKm ?? 5) * this.MULTIPLIER_RAIO;

      L.marker([lat, lng])
        .addTo(this.map!)
        .bindPopup(`
          <strong>${s.nome}</strong><br>
          ${s.localizacao}<br>
          <small>Raio de entrega: ${s.raioEntregaKm ?? 5} km</small>
        `);

      L.circle([lat, lng], {
        radius: raioM,
        color: '#111111',
        fillColor: '#111111',
        fillOpacity: 0.08,
        weight: 1.5,
      }).addTo(this.map!);
    });

    if (comCoordenadas.length > 0) {
      const bounds = comCoordenadas.map(s => {
        const [lng, lat] = s.localizacaoGeo!.coordinates;
        return [lat, lng] as [number, number];
      });
      this.map.fitBounds(bounds, { padding: [40, 40] });
    }
  }
}
