# Guia: Implementar "Eliminar Produto" (passo a passo)

O objetivo é: na lista de produtos, ter um botão "Eliminar" que apaga o produto da base de dados.

---

## O que vais criar/alterar

| Ficheiro | O que fazer |
|---|---|
| `routes/supermercado.js` | Adicionar rota POST `/produtos/eliminar/:id` |
| `Controllers/supermercado.js` | Criar função `eliminarProduto` |
| `views/supermercado/produtos.ejs` | Adicionar botão "Eliminar" em cada produto |

---

## Passo 1 — A Rota

Ficheiro: `routes/supermercado.js`

Adiciona uma nova rota POST, ao lado das que já existem:

```js
router.post('/produtos/eliminar/:id', supermarketController.eliminarProduto);
```

**Porquê POST e não GET?** Porque apagar dados é uma ação destrutiva. GETs são só para ver coisas.

**O que é o `:id`?** É um parâmetro dinâmico. Quando alguém faz POST para `/produtos/eliminar/abc123`, o `req.params.id` no controller vai ser `"abc123"`.

---

## Passo 2 — O Controller

Ficheiro: `Controllers/supermercado.js`

Cria a função que vai à BD apagar o produto:

```js
const eliminarProduto = async (req, res) => {
    try {
        // req.params.id vem do :id na rota
        await Product.findByIdAndDelete(req.params.id);

        // Depois de apagar, redireciona para a lista
        res.redirect('/supermercado/produtos');
    } catch (err) {
        res.status(500).send('Erro ao eliminar produto.');
    }
};
```

**Não te esqueças** de adicioná-la ao `module.exports` no final do ficheiro:

```js
module.exports = {
    exibirDashboard,
    exibirProdutos,
    exibirFormularioNovo,
    exibirDetalhes,
    exibirFormularioEditar,
    criarProduto,
    atualizarProduto,
    pesquisarProdutos,
    eliminarProduto          // ← adicionar aqui
};
```

---

## Passo 3 — O Botão na View

Ficheiro: `views/supermercado/produtos.ejs`

Na tabela de produtos, ao lado dos botões "Ver" e "Editar", adiciona um mini-formulário com um botão:

```html
<form action="/supermercado/produtos/eliminar/<%= produto._id %>" method="POST" style="display:inline;">
    <button type="submit" class="btn btn-sm btn-outline-danger"
            onclick="return confirm('Tens a certeza?')">
        Eliminar
    </button>
</form>
```

**Porquê um `<form>` e não um `<a>`?** Porque precisamos de fazer POST. Links (`<a>`) só fazem GET.

**O que faz o `confirm()`?** Mostra uma caixa de confirmação antes de apagar. Se o user clicar "Cancelar", o `return false` impede o submit.

---

## Resumo do Fluxo

```
User clica "Eliminar"
  → confirm('Tens a certeza?')
    → Sim → form faz POST /supermercado/produtos/eliminar/abc123
      → Route aponta para eliminarProduto
        → Controller faz Product.findByIdAndDelete('abc123')
          → res.redirect('/supermercado/produtos')
            → Página recarrega sem o produto
```

---

## Checklist

- [ ] Rota adicionada em `routes/supermercado.js`
- [ ] Função criada em `Controllers/supermercado.js`
- [ ] Função adicionada ao `module.exports`
- [ ] Botão adicionado na view `produtos.ejs`
- [ ] Testar: criar um produto, depois eliminá-lo
