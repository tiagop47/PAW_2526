import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { SupermarketService } from '../../services/supermarket.service';
import { AuthService } from '../../services/auth.service';
import { ProductDTO } from '../../models/product.dto';
import { SupermarketDTO } from '../../models/supermarket.dto';
import { NavbarComponent } from '../navbar/navbar.component';

interface ProdutoAgrupado {
  chave: string;
  nome: string;
  imagem: string;
  categoria: string;
  precoMin: number;
  precoMax: number;
  poupanca: number;
  numMercados: number;
  produtoIdMaisBarato: string;
  supermercadoMaisBaratoNome: string;
  stockTotal: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  produtosAgrupados: ProdutoAgrupado[] = [];
  todasCategorias: string[] = [];
  todasZonas: string[] = [];
  supermercados: SupermarketDTO[] = [];

  loading = true;
  pesquisa = '';
  categoriaSelecionada = '';
  zonaSelecionada = '';
  ordenarPor: 'preco' | 'poupanca' | 'nome' = 'poupanca';

  constructor(
    public authService: AuthService,
    private productService: ProductService,
    private supermarketService: SupermarketService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.supermarketService.getSupermarkets().subscribe((sms) => {
      this.supermercados = sms;
      this.todasZonas = Array.from(new Set(sms.map((s) => s.localizacao).filter(Boolean))).sort();
    });

    this.productService.getProducts().subscribe((produtos: ProductDTO[]) => {
      this.produtosAgrupados = this.agrupar(produtos);
      this.todasCategorias = Array.from(
        new Set(produtos.map((p) => p.categoriaId?.nome).filter(Boolean)),
      ).sort();
      this.loading = false;
    });
  }

  private agrupar(produtos: ProductDTO[]): ProdutoAgrupado[] {
    const groups = new Map<string, ProductDTO[]>();
    produtos.forEach((p) => {
      const key = p.codigoBarras || p.nome.toLowerCase().trim();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    });

    const agrupados: ProdutoAgrupado[] = [];
    groups.forEach((grupo, chave) => {
      const ordenado = grupo.slice().sort((a, b) => a.preco - b.preco);
      const maisBarato = ordenado[0];
      const maisCaro = ordenado[ordenado.length - 1];
      const smNome =
        typeof maisBarato.supermercadoId === 'string'
          ? ''
          : maisBarato.supermercadoId?.nome || '';

      agrupados.push({
        chave,
        nome: maisBarato.nome,
        imagem: maisBarato.imagem,
        categoria: maisBarato.categoriaId?.nome || '',
        precoMin: maisBarato.preco,
        precoMax: maisCaro.preco,
        poupanca: maisCaro.preco - maisBarato.preco,
        numMercados: ordenado.length,
        produtoIdMaisBarato: maisBarato._id,
        supermercadoMaisBaratoNome: smNome,
        stockTotal: ordenado.reduce((s, p) => s + (p.stockDisponivel || 0), 0),
      });
    });

    return agrupados;
  }

  get produtosFiltrados(): ProdutoAgrupado[] {
    const q = this.pesquisa.trim().toLowerCase();
    let lista = this.produtosAgrupados.filter((p) => {
      if (q && !p.nome.toLowerCase().includes(q) && !p.categoria.toLowerCase().includes(q)) {
        return false;
      }
      if (this.categoriaSelecionada && p.categoria !== this.categoriaSelecionada) return false;
      return true;
    });

    if (this.ordenarPor === 'preco') {
      lista = lista.slice().sort((a, b) => a.precoMin - b.precoMin);
    } else if (this.ordenarPor === 'nome') {
      lista = lista.slice().sort((a, b) => a.nome.localeCompare(b.nome));
    } else {
      lista = lista.slice().sort((a, b) => b.poupanca - a.poupanca);
    }

    return lista;
  }

  get melhoresOfertas(): ProdutoAgrupado[] {
    return this.produtosAgrupados
      .filter((p) => p.numMercados > 1 && p.poupanca > 0)
      .slice()
      .sort((a, b) => b.poupanca - a.poupanca)
      .slice(0, 4);
  }

  verProduto(id: string): void {
    this.router.navigate(['/product', id]);
  }
}
