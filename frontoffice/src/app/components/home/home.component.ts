import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupermarketService } from '../../services/supermarket.service';
import { AuthService } from '../../services/auth.service';
import { SupermarketDTO } from '../../models/supermarket.dto';
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
  availableZones: string[] = [];
  selectedZone: string = '';
  searchQuery: string = '';

  constructor(
    public authService: AuthService,
    private supermarketService: SupermarketService,
    private router: Router
  ) {}

  get filteredSupermarkets(): SupermarketDTO[] {
    return this.allSupermarkets.filter(s => {
      var matchesZone = !this.selectedZone || s.localizacao === this.selectedZone;
      var matchesQuery = !this.searchQuery || s.nome.toLowerCase().includes(this.searchQuery.toLowerCase()) || s.localizacao.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesZone && matchesQuery;
    });
  }

  ngOnInit(): void {
    this.supermarketService.getSupermarkets().subscribe((data: SupermarketDTO[]) => {
      this.allSupermarkets = data;
      this.availableZones = [...new Set(data.map(s => s.localizacao).filter(Boolean))].sort();
    });
  }

  initial(name: string): string {
    return name.trim().charAt(0).toUpperCase();
  }

  navigateToProducts(id: string): void {
    this.router.navigate(['/products', id]);
  }
}
