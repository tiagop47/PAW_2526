import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupermarketService } from '../../services/supermarket.service';
import { Supermarket } from '../../models/supermarket.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  allSupermarketsByZone = signal<{ zone: string, supermarkets: Supermarket[] }[]>([]);
  availableZones = signal<string[]>([]);
  selectedZone = signal<string>('');

  supermarketsByZone = computed(() => {
    const zone = this.selectedZone();
    if (!zone) return this.allSupermarketsByZone();

    return this.allSupermarketsByZone().filter(group => group.zone === zone);
  });

  constructor(
    private supermarketService: SupermarketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.supermarketService.getSupermarkets().subscribe({
      next: (data) => {
        const grouped = this.groupSupermarketsByZone(data);
        this.allSupermarketsByZone.set(grouped);
        this.availableZones.set(grouped.map(g => g.zone));
      },
      error: (err) => console.error('Erro ao carregar supermercados na Home', err)
    });
  }

  private groupSupermarketsByZone(supermarkets: Supermarket[]) {
    const map = new Map<string, Supermarket[]>();
    for (const s of supermarkets) {
      const zone = s.localizacao || 'Outras Zonas';
      if (!map.has(zone)) {
        map.set(zone, []);
      }
      map.get(zone)!.push(s);
    }
    
    return Array.from(map.entries()).map(([zone, smarks]) => ({
      zone,
      supermarkets: smarks
    })).sort((a, b) => a.zone.localeCompare(b.zone));
  }

  select(id: string): void {
    this.router.navigate(['/products', id]);
  }
}
