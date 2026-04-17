import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupermarketService } from '../../services/supermarket.service';
import { Supermarket } from '../../models/supermarket.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  supermarkets = signal<Supermarket[]>([]);

  constructor(
    private supermarketService: SupermarketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.supermarketService.getSupermarkets().subscribe({
      next: (data) => this.supermarkets.set(data),
      error: (err) => console.error('Erro ao carregar supermercados na Home', err)
    });
  }

  select(id: string): void {
    this.router.navigate(['/products', id]);
  }
}
