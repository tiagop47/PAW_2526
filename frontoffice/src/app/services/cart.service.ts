import { Injectable, signal, computed } from '@angular/core';
import { CartItem } from '../models/cart-item.dto';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'cart';

  /** Signal reativo com os itens do carrinho */
  items = signal<CartItem[]>(this.loadFromStorage());

  /** Supermercado ao qual os itens do carrinho pertencem (regra a: só 1 supermercado por encomenda) */
  supermarketId = signal<string | null>(this.loadSupermarketId());

  /** Dados do cupão ativo, se algum (repescado ou recém submetido) */
  cupao = signal<{ codigo: string, percentagem: number } | null>(this.loadCupao());

  /** Número total de itens no carrinho */
  totalItems = computed(() => this.items().reduce((sum, item) => sum + item.quantidade, 0));

  /** Valor total do carrinho COM o cupão já deduzido */
  totalPrice = computed(() => {
    const sum = this.items().reduce((sum, item) => sum + item.preco * item.quantidade, 0);
    const cupaoAtual = this.cupao();
    if (cupaoAtual) {
      return sum - (sum * (cupaoAtual.percentagem / 100));
    }
    return sum;
  });

  /** Valor puro só dos items (sem cupão) */
  subtotalPrice = computed(() => this.items().reduce((sum, item) => sum + item.preco * item.quantidade, 0));
  
  /** Valor deduzido pelo cupão */
  discountValue = computed(() => {
    const subtotal = this.subtotalPrice();
    const cupaoAtual = this.cupao();
    return cupaoAtual ? subtotal * (cupaoAtual.percentagem / 100) : 0;
  });

  /**
   * Regra a): Só podem ser adicionados produtos de um supermercado.
   */
  addItem(item: CartItem, supermercadoId: string): { sucesso: boolean; erro?: string } {
    // Regra d): Verificar stock
    if (item.stockDisponivel <= 0) {
      return { sucesso: false, erro: 'Este produto não tem stock disponível.' };
    }

    const currentSupermarketId = this.supermarketId();

    // Regra a): Se já há itens de outro supermercado, bloquear
    if (currentSupermarketId && currentSupermarketId !== supermercadoId) {
      return {
        sucesso: false,
        erro: 'Só pode encomendar produtos de um supermercado por encomenda. Limpa o carrinho para escolher outro supermercado.'
      };
    }

    const currentItems = this.items();
    const existingIndex = currentItems.findIndex(i => i.produtoId === item.produtoId);

    if (existingIndex >= 0) {
      const existing = currentItems[existingIndex];
      const novaQuantidade = existing.quantidade + item.quantidade;

      if (novaQuantidade > item.stockDisponivel) {
        return {
          sucesso: false,
          erro: `Stock insuficiente. Disponível: ${item.stockDisponivel}, no carrinho: ${existing.quantidade}.`
        };
      }

      const updated = currentItems.slice();
      updated[existingIndex] = Object.assign({}, existing, { quantidade: novaQuantidade });
      this.items.set(updated);
    } else {
      this.items.set(currentItems.concat([Object.assign({}, item)]));
    }

    this.supermarketId.set(supermercadoId);
    this.saveToStorage();
    return { sucesso: true };
  }

  updateQuantity(produtoId: string, quantidade: number): void {
    const currentItems = this.items();
    const index = currentItems.findIndex(i => i.produtoId === produtoId);
    if (index < 0) return;

    const item = currentItems[index];

    if (quantidade <= 0) {
      this.removeItem(produtoId);
      return;
    }

    if (quantidade > item.stockDisponivel) {
      return;
    }

    const updated = currentItems.slice();
    updated[index] = Object.assign({}, item, { quantidade });
    this.items.set(updated);
    this.saveToStorage();
  }

  removeItem(produtoId: string): void {
    const updated = this.items().filter(i => i.produtoId !== produtoId);
    this.items.set(updated);

    if (updated.length === 0) {
      this.supermarketId.set(null);
      this.cupao.set(null);
    }
    this.saveToStorage();
  }

  clearCart(): void {
    this.items.set([]);
    this.supermarketId.set(null);
    this.cupao.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_KEY + '_supermarket');
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

  private saveToStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items()));
    const smId = this.supermarketId();
    if (smId) {
      localStorage.setItem(this.STORAGE_KEY + '_supermarket', smId);
    } else {
      localStorage.removeItem(this.STORAGE_KEY + '_supermarket');
    }
    
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

  private loadSupermarketId(): string | null {
    return localStorage.getItem(this.STORAGE_KEY + '_supermarket');
  }

  private loadCupao(): { codigo: string, percentagem: number } | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY + '_cupao');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}
