import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { ProductDTO, ProductComparacaoDTO } from '../../models/product.dto';

interface OfertaMercado {
  produtoId: string;
  supermercadoId: string;
  supermercadoNome: string;
  supermercadoLocalizacao: string;
  preco: number;
  stockDisponivel: number;
  imagem: string;
  nome: string;
  iva: number;
  isMaisBarato: boolean;
  poupancaFaceMaisCaro: number;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  produtoBase: ProductDTO | null = null;
  ofertas: OfertaMercado[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private rest: ProductService,
    private cartService: CartService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) this.carregar(id);
    });
  }

  private carregar(id: string): void {
    this.loading = true;
    this.error = null;

    this.rest.getProduct(id).subscribe({
      next: (produto: ProductDTO) => {
        this.produtoBase = produto;
        this.rest.compararPorNome(produto.nome).subscribe({
          next: (resultados) => {
            this.ofertas = this.construirOfertas(produto, resultados);
            this.loading = false;
          },
          error: () => {
            this.ofertas = this.construirOfertas(produto, []);
            this.loading = false;
          },
        });
      },
      error: () => {
        this.error = 'Produto não encontrado.';
        this.loading = false;
      },
    });
  }

  private construirOfertas(produto: ProductDTO, comparacao: ProductComparacaoDTO[]): OfertaMercado[] {
    const toOferta = (p: ProductDTO | ProductComparacaoDTO): OfertaMercado => ({
      produtoId: p._id,
      supermercadoId: p.supermercadoId._id,
      supermercadoNome: p.supermercadoId.nome,
      supermercadoLocalizacao: p.supermercadoId.localizacao,
      preco: p.preco,
      stockDisponivel: p.stockDisponivel,
      imagem: p.imagem,
      nome: p.nome,
      iva: p.iva,
      isMaisBarato: false,
      poupancaFaceMaisCaro: 0,
    });

    const vistos = new Set<string>();
    const lista = [produto, ...comparacao]
      .filter((p) => {
        const id = p.supermercadoId._id;
        return vistos.has(id) ? false : !!vistos.add(id);
      })
      .map(toOferta)
      .sort((a, b) => a.preco - b.preco);

    if (lista.length > 0) {
      const precoMaisCaro = lista[lista.length - 1].preco;
      lista[0].isMaisBarato = true;
      lista.forEach((o) => (o.poupancaFaceMaisCaro = precoMaisCaro - o.preco));
    }

    return lista;
  }

  adicionarAoCarrinho(oferta: OfertaMercado): void {
    const resultado = this.cartService.addItem({
      produtoId: oferta.produtoId,
      nome: oferta.nome,
      imagem: oferta.imagem,
      preco: oferta.preco,
      quantidade: 1,
      stockDisponivel: oferta.stockDisponivel,
      supermercadoId: oferta.supermercadoId,
      supermercadoNome: oferta.supermercadoNome,
      iva: oferta.iva,
    });

    if (resultado.sucesso) {
      this.notificationService.showSuccess(`"${oferta.nome}" adicionado ao carrinho!`);
    } else {
      this.notificationService.showError(resultado.erro || 'Erro ao adicionar.');
    }
  }
}
