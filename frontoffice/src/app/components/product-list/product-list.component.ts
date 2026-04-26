import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { ProductDTO } from '../../models/product.dto';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit {
  products: ProductDTO[] = [];
  loading: boolean = true;
  error: string | null = null;
  supermarketId: string = "";

  constructor(
    private route: ActivatedRoute,
    private rest: ProductService,
    public cartService: CartService,
  ) {}

  ngOnInit(): void {
    const idTemp = this.route.snapshot.params['supermarketId'];
    this.supermarketId = idTemp;

    if (this.supermarketId) {
      this.rest.getProducts(this.supermarketId).subscribe((data: ProductDTO[]) => {
        this.products = data;
        this.loading = false;
      });
    } else {
      this.error = 'Nenhum supermercado selecionado.';
      this.loading = false;
    }
  }

  addToCart(product: ProductDTO): void {
    if (!this.supermarketId) {
      return;
    }

    this.cartService.addItem(
      {
        produtoId: product._id,
        nome: product.nome,
        imagem: 'http://localhost:3000' + product.imagem,
        preco: product.preco,
        quantidade: 1,
        stockDisponivel: product.stockDisponivel,
      },
      this.supermarketId,
    );
  }

  isOutOfStock(product: ProductDTO): boolean {
    return product.stockDisponivel <= 0;
  }
}
