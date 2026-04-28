import { Component, OnInit } from '@angular/core';
import { SupermarketDTO } from '../models/supermarket.dto';
import { ProductDTO } from '../models/product.dto';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SupermarketService } from '../services/supermarket.service';
import { ProductService } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { NotificationService } from '../services/notification.service';
import { NavbarComponent } from '../components/navbar/navbar.component';

@Component({
  selector: 'app-pagina-mercado',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pagina-mercado.html',
  styleUrl: './pagina-mercado.css',
})
export class PaginaMercado implements OnInit {
  supermercado: SupermarketDTO | null = null;
  produtos: ProductDTO[] = [];
  loading = true;
  pesquisa = '';

  constructor(
    private route: ActivatedRoute,
    private mercadoService: SupermarketService,
    private produtoService: ProductService,
    private cartService: CartService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'] || this.route.snapshot.params['supermarketId'];
    if (!id) {
      this.loading = false;
      return;
    }

    this.mercadoService.getSupermarket(id).subscribe((data) => {
      this.supermercado = data;
    });

    this.produtoService.getProducts(id).subscribe({
      next: (produtos) => {
        this.produtos = produtos;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get produtosFiltrados(): ProductDTO[] {
    const q = this.pesquisa.trim().toLowerCase();
    if (!q) return this.produtos;
    return this.produtos.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) || (p.categoriaId?.nome || '').toLowerCase().includes(q),
    );
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pesquisa = input.value;
  }

  adicionar(p: ProductDTO): void {
    const result = this.cartService.addProduct(p, this.supermercado?.nome);

    if (result.sucesso) {
      this.notificationService.showSuccess('Adicionado ao carrinho.');
    } else {
      this.notificationService.showError(result.erro || 'Erro ao adicionar.');
    }
  }
}
