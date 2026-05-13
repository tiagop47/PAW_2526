import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Input,
  Output,
  EventEmitter,
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
  
  // Modo Seleção (para o carrinho)
  @Input() modoSelecao: boolean = false;
  @Input() centroRaio?: [number, number]; // [lat, lng]
  @Input() raioMaximoKm: number = 2;
  @Input() coordenadasIniciais?: { lat: number; lng: number };

  @Output() localizacaoSelecionada = new EventEmitter<{ lat: number; lng: number }>();
  @Output() erroSelecao = new EventEmitter<string>();

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
  private layersGroup = L.layerGroup();
  private markerSelecao?: L.Marker;
  private circleRaio?: L.Circle;
  private mapaIniciado: boolean = false;
  private centroAtual?: [number, number];

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
    if (!this.mapaIniciado) return;

    if (this.modoSelecao) {
      if (changes['centroRaio'] || changes['modoSelecao']) {
        const novoCentro = changes['centroRaio']?.currentValue;
        if (
          !this.centroAtual ||
          !novoCentro ||
          this.centroAtual[0] !== novoCentro[0] ||
          this.centroAtual[1] !== novoCentro[1]
        ) {
          this.configurarModoSelecao();
        }
      }
    } else {
      if (changes['supermarkets'] || changes['favoritoId'] || changes['modoSelecao']) {
        this.adicionarMarcadores();
      }
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
      this.mapaIniciado = true;
      if (this.modoSelecao) {
        this.configurarModoSelecao();
      } else if (this.supermarkets.length > 0) {
        this.adicionarMarcadores();
      }
      this.map?.invalidateSize();
    }, 300);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.layersGroup.clearLayers();
      this.map.off();
      this.map.remove();
      this.map = undefined;
    }
  }

  private initMap(): void {
    if (this.map) return;

    const initialView = this.centroRaio ? L.latLng(this.centroRaio[0], this.centroRaio[1]) : L.latLng(this.COORD_PADRAO);

    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: false,
      scrollWheelZoom: true,
      dragging: true,
      minZoom: 3,
      maxZoom: 19,
    }).setView(initialView, this.modoSelecao ? 15 : this.ZOOM_PADRAO);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB',
    }).addTo(this.map);

    this.layersGroup.addTo(this.map);
  }

  private configurarModoSelecao(): void {
    if (!this.map || !this.centroRaio) return;

    this.centroAtual = [...this.centroRaio];

    // Limpa estado anterior garantindo que não há duplicados
    this.layersGroup.clearLayers();
    this.markerSelecao = undefined;

    const centro = L.latLng(this.centroRaio[0], this.centroRaio[1]);
    
    // Círculo do raio de entrega
    this.circleRaio = L.circle(centro, {
      radius: this.raioMaximoKm * 1000,
      color: '#0d6efd',
      weight: 1,
      fillColor: '#0d6efd',
      fillOpacity: 0.1,
      interactive: false,
    }).addTo(this.layersGroup);

    // Ajusta vista para o círculo
    this.map.fitBounds(this.circleRaio.getBounds(), { padding: [20, 20] });

    // Carrega marcador inicial se existir
    if (this.coordenadasIniciais) {
      this.markerSelecao = L.marker([this.coordenadasIniciais.lat, this.coordenadasIniciais.lng], {
        icon: this.favoriteIcon,
        interactive: false,
      }).addTo(this.layersGroup);
    }

    // Listener de clique
    this.map.off('click');
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.zone.run(() => {
        const clickPos = e.latlng;
        const distanceKm = centro.distanceTo(clickPos) / 1000;

        if (distanceKm > this.raioMaximoKm) {
          this.erroSelecao.emit(`Fora do raio de entrega (${this.raioMaximoKm.toFixed(1)}km).`);
          return;
        }

        if (this.markerSelecao) {
          this.markerSelecao.setLatLng(clickPos);
        } else {
          this.markerSelecao = L.marker(clickPos, { 
            icon: this.favoriteIcon,
            interactive: false 
          }).addTo(this.layersGroup);
        }

        this.localizacaoSelecionada.emit({ lat: clickPos.lat, lng: clickPos.lng });
      });
    });

    // Invalidação múltipla para containers dinâmicos
    setTimeout(() => this.map?.invalidateSize(), 100);
    setTimeout(() => this.map?.invalidateSize(), 500);
  }

  private adicionarMarcadores(): void {
    if (!this.map) return;

    this.layersGroup.clearLayers();

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
        .addTo(this.layersGroup);

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

      this.criarRaio(pos, s.raioEntregaKm, isFav).addTo(this.layersGroup);
    });

    if (bounds.length > 0) {
      this.map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] });
    }
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
      radius: raioKm * 1000,
      color: isFav ? '#0d6efd' : '#999',
      weight: 1,
      dashArray: isFav ? '0' : '4, 4',
      fillColor: isFav ? '#0d6efd' : '#666',
      fillOpacity: 0.03,
      interactive: false
    });
  }
}
