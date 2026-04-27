import { Component, OnInit } from '@angular/core';
import { SupermarketDTO } from '../models/supermarket.dto';
import { ProductDTO } from '../models/product.dto';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SupermarketService } from '../services/supermarket.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-pagina-mercado',
  imports: [CommonModule, RouterModule],
  templateUrl: './pagina-mercado.html',
  styleUrl: './pagina-mercado.css',
})
export class PaginaMercado implements OnInit {
  supermercados: SupermarketDTO[] = [];
  produtos: ProductDTO[] = [];

  constructor(
    private route: ActivatedRoute,
    private mercadoService: SupermarketService,
    private produtoService: ProductService,
  ) {}

  
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
}
