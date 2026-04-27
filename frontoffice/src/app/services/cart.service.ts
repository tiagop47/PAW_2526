import { Injectable, signal, computed } from '@angular/core';
import { CartItem } from '../models/cart-item.dto';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'cart';

  /** Signal reativo com TODOS os itens do carrinho */
  items = signal<CartItem[]>(this.loadFromStorage());

  /** Supermercado que está ATIVO na view da direita / faturação */
  activeSupermarketId = signal<string | null>(this.loadActiveSupermarketId());

  /** Dados do cupão ativo, se algum para a loja em causa */
  cupao = signal<{ codigo: string, percentagem: number } | null>(this.loadCupao());

  /** Número total de itens no carrinho (global) */
  totalItems = computed(() => this.items().reduce((sum, item) => sum + item.quantidade, 0));

  /** Elementos da loja ATIVA para facturação */
  activeItems = computed(() => {
    const smId = this.activeSupermarketId();
    if (!smId) return [];
    return this.items().filter(i => i.supermercadoId === smId);
  });

  cartGroups = computed(() => {
    const map = new Map<string, CartItem[]>();
    for (const item of this.items()) {
      if (!map.has(item.supermercadoId)) {
        map.set(item.supermercadoId, []);
      }
      map.get(item.supermercadoId)!.push(item);
    }
    return map;
  });

  /** Valor total da loja ativa COM o cupão já deduzido */
  totalPrice = computed(() => {
    const sum = this.activeItems().reduce((s, item) => s + item.preco * item.quantidade, 0);
    const cupaoAtual = this.cupao();
    if (cupaoAtual) {
      return sum - (sum * (cupaoAtual.percentagem / 100));
    }
    return sum;
  });

  /** Subtotal puro da loja activa (sem cupão) */
  subtotalPrice = computed(() => this.activeItems().reduce((s, item) => s + item.preco * item.quantidade, 0));

  /** Valor deduzido pelo cupão para a loja activa */
  discountValue = computed(() => {
    const subtotal = this.subtotalPrice();
    const cupaoAtual = this.cupao();
    return cupaoAtual ? subtotal * (cupaoAtual.percentagem / 100) : 0;
  });

  addItem(item: CartItem): { sucesso: boolean; erro?: string } {
    if (item.stockDisponivel <= 0) {
      return { sucesso: false, erro: 'Este produto não tem stock disponível.' };
    }

    const currentItems = this.items();
    const existingIndex = currentItems.findIndex(i => i.produtoId === item.produtoId);

    if (existingIndex >= 0) {
      const existing = currentItems[existingIndex];
      const novaQuantidade = existing.quantidade + item.quantidade;

      if (novaQuantidade > item.stockDisponivel) {
        return { sucesso: false, erro: `Stock insuficiente. Disponível: ${item.stockDisponivel}, no carrinho: ${existing.quantidade}.` };
      }

      const updated = currentItems.slice();
      updated[existingIndex] = Object.assign({}, existing, { quantidade: novaQuantidade });
      this.items.set(updated);
    } else {
      this.items.set(currentItems.concat([Object.assign({}, item)]));
    }

    // Se o cliente adicionar produto, vamos saltar o checkout auto para lá
    if (this.activeSupermarketId() !== item.supermercadoId) {
      this.setActiveSupermarket(item.supermercadoId);
    }

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

    // Se o carrinho activo ficar vazio, reset!
    if (this.activeItems().length === 0) {
       this.cupao.set(null);
       const remainingGroups = this.cartGroups();
       if (remainingGroups.size > 0) {
          // Selecionar o primeiro supermercado que existe
          this.activeSupermarketId.set(Array.from(remainingGroups.keys())[0]);
       } else {
          this.activeSupermarketId.set(null);
       }
    }
    
    this.saveToStorage();
  }

  clearActiveCart(): void {
    const active = this.activeSupermarketId();
    if (!active) return;
    const updated = this.items().filter(i => i.supermercadoId !== active);
    this.items.set(updated);
    this.cupao.set(null);
    
    const remainingGroups = this.cartGroups();
    if (remainingGroups.size > 0) {
      this.activeSupermarketId.set(Array.from(remainingGroups.keys())[0]);
    } else {
      this.activeSupermarketId.set(null);
    }
    
    localStorage.removeItem(this.STORAGE_KEY + '_cupao');
    this.saveToStorage();
  }

  clearCart(): void {
    this.items.set([]);
    this.activeSupermarketId.set(null);
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

  setActiveSupermarket(smId: string) {
    if (this.activeSupermarketId() !== smId) {
      this.activeSupermarketId.set(smId);
      this.cupao.set(null); // perdem-se cupoes entre mudanças por clareza!
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items()));
    const smId = this.activeSupermarketId();
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

  private loadActiveSupermarketId(): string | null {
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
