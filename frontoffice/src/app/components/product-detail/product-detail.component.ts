import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { ProductDTO, ProductComparacaoDTO } from '../../models/product.dto';
import { NavbarComponent } from '../navbar/navbar.component';

interface OfertaMercado {
  produtoId: string;
  supermercadoId: string;
  supermercadoNome: string;
  supermercadoLocalizacao: string;
  preco: number;
  stockDisponivel: number;
  imagem: string;
  nome: string;
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
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      this.carregar(id);
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

  private construirOfertas(
    produto: ProductDTO,
    comparacao: ProductComparacaoDTO[],
  ): OfertaMercado[] {
    const map = new Map<string, OfertaMercado>();

    const smBaseId =
      typeof produto.supermercadoId === 'string'
        ? produto.supermercadoId
        : produto.supermercadoId?._id;
    const smBaseNome =
      typeof produto.supermercadoId === 'string' ? '' : produto.supermercadoId?.nome || '';
    const smBaseLoc =
      typeof produto.supermercadoId === 'string' ? '' : produto.supermercadoId?.localizacao || '';

    if (smBaseId) {
      map.set(smBaseId, {
        produtoId: produto._id,
        supermercadoId: smBaseId,
        supermercadoNome: smBaseNome,
        supermercadoLocalizacao: smBaseLoc,
        preco: produto.preco,
        stockDisponivel: produto.stockDisponivel,
        imagem: produto.imagem,
        nome: produto.nome,
        isMaisBarato: false,
        poupancaFaceMaisCaro: 0,
      });
    }

    comparacao.forEach((c) => {
      const smId = c.supermercadoId?._id;
      if (!smId || map.has(smId)) return;
      map.set(smId, {
        produtoId: c._id,
        supermercadoId: smId,
        supermercadoNome: c.supermercadoId.nome,
        supermercadoLocalizacao: c.supermercadoId.localizacao,
        preco: c.preco,
        stockDisponivel: c.stockDisponivel,
        imagem: c.imagem,
        nome: c.nome,
        isMaisBarato: false,
        poupancaFaceMaisCaro: 0,
      });
    });

    const lista = Array.from(map.values()).sort((a, b) => a.preco - b.preco);
    if (lista.length === 0) return lista;

    const precoMaisCaro = lista[lista.length - 1].preco;
    lista[0].isMaisBarato = true;
    lista.forEach((o) => {
      o.poupancaFaceMaisCaro = precoMaisCaro - o.preco;
    });

    return lista;
  }

  adicionarAoCarrinho(oferta: OfertaMercado): void {
    if (oferta.stockDisponivel <= 0) {
      this.notificationService.showError('Sem stock neste supermercado.');
      return;
    }

    const result = this.cartService.addItem({
      produtoId: oferta.produtoId,
      nome: oferta.nome,
      imagem: 'http://localhost:3000' + oferta.imagem,
      preco: oferta.preco,
      quantidade: 1,
      stockDisponivel: oferta.stockDisponivel,
      supermercadoId: oferta.supermercadoId,
      supermercadoNome: oferta.supermercadoNome,
    });

    if (result.sucesso) {
      this.notificationService.showSuccess(
        `Adicionado ao carrinho (${oferta.supermercadoNome}).`,
      );
    } else {
      this.notificationService.showError(result.erro || 'Erro ao adicionar.');
    }
  }

  get melhorPreco(): number {
    return this.ofertas.length > 0 ? this.ofertas[0].preco : 0;
  }

  get desconto(): number | null {
    const p = this.produtoBase;
    if (!p || !p.precoAntigo || p.precoAntigo <= 0) return null;
    return Math.round((1 - p.preco / p.precoAntigo) * 100);
  }
}
