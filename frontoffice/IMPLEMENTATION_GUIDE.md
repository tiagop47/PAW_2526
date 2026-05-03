# Guia de Implementação: Detalhes da Encomenda (Frontoffice)

Este guia serve de roteiro para terminares a implementação da página de detalhes de encomenda de forma independente.

## 1. Criar o Componente
Executa o comando no terminal (dentro da pasta `frontoffice`):
```bash
ng generate component components/order-detail
```

## 2. Configurar a Rota
No ficheiro `src/app/app.routes.ts`, adiciona o caminho dinâmico:
```typescript
{ 
  path: 'orders/:id', 
  component: OrderDetailComponent, 
  canActivate: [AuthGuard] 
}
```

## 3. Lógica do Componente (`order-detail.component.ts`)
O objetivo é capturar o ID da URL e carregar os dados:

- **Imports:** `ActivatedRoute`, `OrderService`, `Order`.
- **Variáveis:** `order?: Order` e `loading = true`.
- **No ngOnInit:** 
    1. Usa `this.route.snapshot.paramMap.get('id')` para obter o ID.
    2. Chama `this.orderService.detalhesEncomenda(id)`.
    3. No `next`, guarda o resultado em `this.order`.

## 4. Estrutura HTML (`order-detail.component.html`)
Usa as propriedades do objeto `Order` para preencher a página:

- **Cabeçalho:** Mostra o ID formatado (`order.id.substring(18).toUpperCase()`).
- **Lista de Produtos:** Faz um `*ngFor="let item of order.produtos"`.
- **Imagens:** Usa `[src]="item.produtoId.imagem"`.
- **Preços:** Usa o pipe de moeda `| currency:'EUR'`.
- **Estados:** Podes reutilizar a lógica de cores (`[ngClass]`) que corrigimos no `orders.component.html`.

## 5. Ligar as Páginas
No ficheiro `orders.component.html` (a lista geral), adiciona o link em cada card:

```html
<a [routerLink]="['/orders', order.id]" class="btn btn-outline-dark btn-sm fw-bold">
  DETALHES
</a>
```

## Dicas Úteis
- **Campos do Modelo:** Verifica `src/app/models/order.ts` para ver que métodos podes usar (ex: `order.estadoLabel`).
- **Loading:** Não esqueças de mostrar um spinner ou mensagem enquanto `loading` for `true`.
- **Botão Voltar:** Adiciona um `<a routerLink="/orders">` para facilitar a navegação.

---
*Bom trabalho! Se tiveres dúvidas sobre a lógica do Angular ou os estilos do Bootstrap, estou aqui.*
