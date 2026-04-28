import { Injectable, signal, computed } from '@angular/core';
import { CartItem } from '../models/cart-item.dto';
import { ProductDTO } from '../models/product.dto';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly STORAGE_KEY = 'cart';

  /** Signal reativo com os itens do carrinho (sempre da mesma loja) */
  items = signal<CartItem[]>(this.loadFromStorage());

  /** Dados do cupão ativo */
  cupao = signal<{ codigo: string; percentagem: number } | null>(this.loadCupao());

  /** Número total de itens no carrinho */
  totalItems = computed(() => this.items().reduce((sum, item) => sum + item.quantidade, 0));

  /** Supermercado atual do carrinho */
  activeSupermarketId = computed(() => {
    const items = this.items();
    return items.length > 0 ? items[0].supermercadoId : null;
  });

  activeSupermarketNome = computed(() => {
    const items = this.items();
    return items.length > 0 ? items[0].supermercadoNome : null;
  });

  /** Subtotal puro (sem cupão) */
  subtotalPrice = computed(() =>
    this.items().reduce((s, item) => s + item.preco * item.quantidade, 0),
  );

  /** Valor deduzido pelo cupão */
  discountValue = computed(() => {
    const subtotal = this.subtotalPrice();
    const cupaoAtual = this.cupao();
    return cupaoAtual ? subtotal * (cupaoAtual.percentagem / 100) : 0;
  });

  /** Valor total final */
  totalPrice = computed(() => this.subtotalPrice() - this.discountValue());

  addItem(item: CartItem): { sucesso: boolean; erro?: string } {
    if (item.stockDisponivel <= 0) {
      return { sucesso: false, erro: 'Este produto não tem stock disponível.' };
    }

    const currentItems = this.items();

    // Regra: Apenas um supermercado no carrinho
    if (currentItems.length > 0 && currentItems[0].supermercadoId !== item.supermercadoId) {
      return {
        sucesso: false,
        erro: `Só pode adicionar produtos de um supermercado de cada vez. Finalize ou limpe o carrinho atual.`,
      };
    }

    const existingIndex = currentItems.findIndex((i) => i.produtoId === item.produtoId);

    if (existingIndex >= 0) {
      const existing = currentItems[existingIndex];
      const novaQuantidade = existing.quantidade + item.quantidade;

      if (novaQuantidade > item.stockDisponivel) {
        return {
          sucesso: false,
          erro: `Stock insuficiente. Disponível: ${item.stockDisponivel}.`,
        };
      }

      const updated = currentItems.slice();
      updated[existingIndex] = Object.assign({}, existing, { quantidade: novaQuantidade });
      this.items.set(updated);
    } else {
      this.items.set(currentItems.concat([Object.assign({}, item)]));
    }

    this.saveToStorage();
    return { sucesso: true };
  }

  updateQuantity(produtoId: string, quantidade: number): void {
    const currentItems = this.items();
    const index = currentItems.findIndex((i) => i.produtoId === produtoId);
    if (index < 0) {
      return;
    }

    const item = currentItems[index];

    if (quantidade <= 0) {
      this.removeItem(produtoId);
      return;
    }

    if (quantidade > item.stockDisponivel) return;

    const updated = currentItems.slice();
    updated[index] = Object.assign({}, item, { quantidade: quantidade });
    this.items.set(updated);
    this.saveToStorage();
  }

  removeItem(produtoId: string): void {
    const updated = this.items().filter((i) => i.produtoId !== produtoId);
    this.items.set(updated);
    if (updated.length === 0) this.cupao.set(null);
    this.saveToStorage();
  }

  clearCart(): void {
    this.items.set([]);
    this.cupao.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_KEY + '_cupao');
  }

  applyCoupon(codigo: string, percentagem: number) {
    this.cupao.set({ codigo, percentagem });
    this.saveToStorage();
  }

  removeCoupon() {
    this.cupao.set(null);
    this.saveToStorage();
  }

  /**
   * Método centralizado para adicionar um ProductDTO ao carrinho.
   * Evita duplicação de lógica de conversão nos componentes.
   */
  addProduct(product: ProductDTO, supermercadoNome?: string): { sucesso: boolean; erro?: string } {
    const smId = typeof product.supermercadoId === 'string'
      ? product.supermercadoId
      : product.supermercadoId?._id;

    if (!smId) {
      return { sucesso: false, erro: 'Não foi possível identificar o supermercado deste produto.' };
    }

    const smNome = supermercadoNome
      || (typeof product.supermercadoId === 'string' ? 'Supermercado' : product.supermercadoId?.nome || 'Supermercado');

    return this.addItem({
      produtoId: product._id,
      nome: product.nome,
      imagem: product.imagem,
      preco: product.preco,
      quantidade: 1,
      stockDisponivel: product.stockDisponivel,
      supermercadoId: smId,
      supermercadoNome: smNome,
    });
  }

  private saveToStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items()));
    const cupaoAtual = this.cupao();
    if (cupaoAtual) {
      localStorage.setItem(this.STORAGE_KEY + '_cupao', JSON.stringify(cupaoAtual));
    } else {
      localStorage.removeItem(this.STORAGE_KEY + '_cupao');
    }
  }

  private loadFromStorage(): CartItem[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private loadCupao(): { codigo: string; percentagem: number } | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY + '_cupao');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}
