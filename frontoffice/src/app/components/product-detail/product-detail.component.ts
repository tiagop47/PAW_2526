import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { ProductDTO, ProductComparacaoDTO } from '../../models/product.dto';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  product: ProductDTO | null = null;
  comparacao: ProductComparacaoDTO[] = [];
  loading = true;
  error: string | null = null;
  mensagemSucesso: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private rest: ProductService,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    const idTemp = this.route.snapshot.params['id'];
    this.rest.getProduct(idTemp).subscribe({
      next: (data: ProductDTO) => {
        this.product = data;
        this.loading = false;
        this.rest.compararPorNome(data.nome).subscribe((resultados) => {
          this.comparacao = resultados.filter((p) => p._id !== data._id);
        });
      },
      error: (err) => {
        this.error = 'Produto não encontrado.';
        this.loading = false;
      },
    });
  }

  addToCart(): void {
    const p = this.product;
    if (!p) return;

    const result = this.cartService.addItem(
      {
        produtoId: p._id,
        nome: p.nome,
        imagem: 'http://localhost:3000' + p.imagem,
        preco: p.preco,
        quantidade: 1,
        stockDisponivel: p.stockDisponivel,
      },
      p.supermercadoId,
    );

    if (result.sucesso) {
      this.mensagemSucesso = 'Adicionado ao carrinho!';
      setTimeout(() => (this.mensagemSucesso = null), 3000);
    } else {
      alert(result.erro || 'Erro ao adicionar.');
    }
  }

  get melhorPreco(): number {
    const todos = [this.product?.preco ?? Infinity, ...this.comparacao.map((p) => p.preco)];
    return Math.min(...todos);
  }

  get desconto(): number | null {
    const p = this.product;
    if (!p || !p.precoAntigo || p.precoAntigo <= 0) {
      return null;
    }

    return Math.round((1 - p.preco / p.precoAntigo) * 100);
  }
}
