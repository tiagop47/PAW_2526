# Refatorização e Melhorias — Backoffice PAW 2526

## Segurança

### CSRF — GET destrutivos convertidos para POST
- `GET /admin/supermercados/bloquear/:id` → `POST`
- `GET /admin/utilizadores/eliminar/:id` → `POST`
- Views atualizadas: `<a href>` substituídos por `<form method="POST"><button>`

### Exposição de dados sensíveis
- `.select('-password')` adicionado em `getUsersDocumentos` e `getEstafetasDocumentos`
- `autenticarUtilizador` faz `toObject()` + `delete userObj.password` antes de devolver o user
- `UserDTO` removido do backoffice — mapeamento de campos feito no `controllers/api/authController.js`

### Acesso indevido
- Clientes bloqueados no login do backoffice — erro 403 com view EJS
- Rota `/cliente` e `views/cliente/` removidas do backoffice
- Admin não pode editar nem eliminar outro administrador (proteção na view e no controller)
- Opção "Administrador" removida do `<select>` de edição de utilizador

---

## Correções de Bugs

### Validação antes do save
- `authService.registarUtilizador`: validação de `latitude/longitude` movida para **antes** do `novoUser.save()` — evitava utilizador órfão na BD em caso de erro

### Race condition em `alternarBloqueio`
- Substituído padrão read→write por dois `findOneAndUpdate` condicionais atómicos

### Transação em `eliminarUser`
- Deleção de User, Supermarket e Products envolvida numa sessão MongoDB com `commitTransaction` / `abortTransaction`

### `authMiddleware.verificarAprovacaoSupermercado`
- Corrigida referência a `supermarketService.verificarEstadoAprovacao` (inexistente) substituída por `supermarketService.getSupermercado`

---

## Arquitetura e Separação de Responsabilidades

### Lógica retirada das rotas API
- `routes/api/authRoutes.js` — lógica movida para `controllers/api/authController.js`

### `registarUtilizador` refatorizado
- Função dividida em duas privadas:
  - `atribuirCupoesCliente(novoUser, morada)` — lógica de cupões
  - `criarSupermercado(userId, userData)` — criação do documento Supermarket

### `inicializarAdmin` movido
- Removido do callback `mongoose.connect` em `app.js`
- Chamado no topo de `controllers/auth.js` ao carregar o módulo — responsabilidade do controller de auth

### `gerarTokenRecuperacao` simplificado
- Devolve apenas o `token` (o `user` era destruturado mas nunca usado)
- `enviarEmailRecuperacao` passou a receber `host` em vez do objeto `req` inteiro

### Roles centralizados em `userValidator.js`
- `rolesPublicas` atualizado para incluir `'clientes'`
- `rolesBackoffice` adicionado: `['administrador', 'supermercados', 'estafetas']`
- Fallback em `registarUtilizador` usa `rolesPublicas[0]` em vez de string hardcoded

---

## Rotas e Coesão de Parâmetros

### `router.param` generalizado em `admin.js`
Todos os IDs de recursos passam por middleware de parâmetro que valida existência e injeta em `req`:

| Param | `req.*` | Modelos |
|---|---|---|
| `:userId` | `req.targetUser` | `User` |
| `:supermarketId` | `req.targetSupermercado` | `Supermarket` |
| `:orderId` | `req.targetEncomenda` | `Order` (populado) |
| `:categoriaId` | `req.targetCategoria` | `Category` |

- `:id` em `/categorias/eliminar` renomeado para `:categoriaId`
- Controllers usam `req.target*` — sem `req.params` espalhados

### Rotas de utilizadores coesas
- Todas as operações em `/admin/utilizadores/:userId/...`
- `eliminarUser` e `editarUser` usam `req.targetUser._id`

---

## CRUD Completo de Utilizadores

- Adicionado `GET /admin/utilizadores/:userId/editar` e `POST /admin/utilizadores/:userId/editar`
- Criada view `views/admin/editarUtilizador.ejs`
- Botão "Editar" adicionado em `exibirUtilizadores.ejs`
- Ações de editar/eliminar ocultadas para utilizadores com role `administrador`

---

## Código Morto Removido

- `models/UserDTO.js` — apagado
- `routes/cliente.js` — apagado
- `views/cliente/` — apagada
- Comentário `// (Removido por duplicação...)` em `supermarketService.js`
- `user` destruturado mas não usado em `processarRecuperarPassword`
- `req` inteiro passado ao service quando só `host` era necessário

---

## API Frontoffice (Angular)

### Segurança no registo
- `controllers/api/authController.js` — extrai apenas os campos do `RegisterDTO` do Angular em vez de `...req.body` (proteção contra mass assignment)

### Separação de contratos
- Service devolve `user` sem password via `toObject()` + `delete`
- Controller API não faz mapeamento de campos — o frontoffice aplica o seu próprio DTO
