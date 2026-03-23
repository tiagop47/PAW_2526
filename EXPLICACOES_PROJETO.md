# Fluxo Completo do Projeto — PAW Marketplace

## 1. Arquitetura Geral

```
Browser (EJS + Bootstrap 5)
    │
    ▼
Express.js (app.js)
    │
    ├── Middlewares globais (morgan, cookieParser, injetarUserNasViews)
    │
    ├── Routes ──► Controllers ──► Services/Models ──► MongoDB Atlas
    │
    └── Views (EJS templates com partials)
```

**Padrão:** MVC (Model-View-Controller) com camada de Services para lógica de negócio.

**Stack:**
- **Runtime:** Node.js
- **Framework:** Express.js v4
- **Template Engine:** EJS
- **Base de Dados:** MongoDB Atlas (Mongoose v9)
- **Autenticação:** JWT (jsonwebtoken) em cookies HttpOnly
- **Hashing:** bcrypt (12 salt rounds)
- **Anti-bot:** Google reCAPTCHA v3
- **CSS:** Bootstrap 5.3 + CSS customizado (`estilos.css`)

---

## 2. Estrutura de Ficheiros

```
PAW_2526/
├── app.js                          # Ponto de entrada — configura Express, liga MongoDB, monta rotas
├── bin/www                         # Servidor HTTP (porta)
├── .env                            # Variáveis de ambiente (MongoDB URI, JWT secret, CAPTCHA keys)
│
├── models/                         # Schemas Mongoose
│   ├── UserModel.js                # Utilizadores (todos os roles)
│   ├── SupermarketModel.js         # Dados do supermercado (ligado ao User por userId)
│   ├── ProductModel.js             # Produtos (ligado ao Supermarket por supermercadoId)
│   └── OrderModel.js               # Encomendas/Vendas (produtos, cliente, estado)
│
├── Controllers/                    # Lógica dos pedidos HTTP
│   ├── auth.js                     # Login, registo, logout, recuperar password
│   ├── admin.js                    # Dashboard admin, aprovar/rejeitar supermercados
│   └── supermercado.js             # Dashboard, CRUD de produtos
│
├── routes/                         # Definição de rotas (URL → Controller)
│   ├── auth.js                     # /auth/*
│   ├── admin.js                    # /admin/*    (protegido: role administrador)
│   ├── supermercado.js             # /supermercado/*  (protegido: role supermercados + aprovação)
│   ├── estafeta.js                 # /estafeta/*  (protegido: role estafetas)
│   ├── cliente.js                  # /cliente/*   (protegido: role clientes)
│   └── users.js                    # /users/*     (placeholder)
│
├── services/
│   └── authService.js              # Lógica de negócio: registo, login, captcha
│
├── middlewares/
│   └── authMiddleware.js           # JWT decode, verificação de auth/role/aprovação
│
├── utils/
│   └── userValidator.js            # Validações de email, password, telefone (regex)
│
├── views/                          # Templates EJS
│   ├── partials/
│   │   ├── head.ejs                # <head> global (meta, Bootstrap CSS/JS, ícones)
│   │   └── navbar.ejs              # Header dinâmico (links mudam por role)
│   ├── loginRegisto/
│   │   ├── login.ejs
│   │   ├── registar.ejs
│   │   └── recuperarPassword.ejs
│   ├── admin/
│   │   ├── dashboard.ejs
│   │   └── supermercadosPendentes.ejs
│   ├── supermercado/
│   │   ├── dashboard.ejs
│   │   ├── produtos.ejs
│   │   ├── novoProduto.ejs
│   │   ├── editarProduto.ejs
│   │   ├── detalhesProduto.ejs
│   │   └── aguardandoAprovacao.ejs
│   ├── estafeta/dashboard.ejs
│   ├── cliente/dashboard.ejs
│   └── error.ejs
│
└── public/                         # Ficheiros estáticos
    ├── stylesheets/estilos.css     # CSS customizado
    ├── javascript/                 # Scripts client-side
    │   ├── authValidations.js
    │   ├── validacoes.js
    │   ├── mostrarPassword.js
    │   ├── adminActions.js
    │   ├── estafetaActions.js
    │   ├── produtoCreateUpdate.js
    │   └── recaptcha.js
    └── images/                     # Imagens estáticas
```

---

## 3. Cadeia de Middlewares (Ordem de Execução)

Cada pedido HTTP passa por esta cadeia, na ordem:

```
1. morgan('dev')                    → Log do pedido no terminal
2. express.json()                   → Parse de body JSON
3. express.urlencoded()             → Parse de body de formulários
4. cookieParser()                   → Parse dos cookies
5. express.static('public/')        → Servir ficheiros estáticos
6. injetarUserNasViews              → Descodifica o JWT do cookie e coloca em res.locals.user
   │                                  (disponível em TODAS as views EJS como `user`)
   ▼
7. Router match (/auth, /admin, etc.)
   │
   ├── /auth/*                      → Sem proteção adicional (páginas públicas)
   │
   ├── /admin/*
   │   ├── verificarAutenticacao    → Redireciona para login se não tiver JWT válido
   │   └── verificarRole(['admin']) → 403 se não for admin
   │
   ├── /supermercado/*
   │   ├── verificarAutenticacao
   │   ├── verificarRole(['supermercados'])
   │   └── verificarAprovacaoSupermercado  → Mostra página "Aguardando" se não aprovado
   │
   ├── /estafeta/*
   │   ├── verificarAutenticacao
   │   └── verificarRole(['estafetas'])
   │
   └── /cliente/*
       ├── verificarAutenticacao
       └── verificarRole(['clientes'])
```

---

## 4. Modelos de Dados (MongoDB)

### User
```
{
  nome:      String (min 3)
  email:     String (único, validado por regex)
  password:  String (hash bcrypt, min 8 chars, 1 maiúsc, 1 minúsc, 1 número)
  telefone:  String (min 9 dígitos)
  morada:    String (min 5)
  role:      'clientes' | 'supermercados' | 'estafetas' | 'administrador'
  criadoEm:  Date
}
```

### Supermarket (ligado a User via `userId`)
```
{
  userId:                ObjectId → User
  nome:                  String
  descricao:             String
  localizacao:           String
  horarioFuncionamento:  String
  metodosEntrega:        [String]  (default: ['levantamento em loja'])
  custoEntrega:          Number    (default: 0)
  estadoAprovacao:       'Pendente' | 'Aprovado' | 'Rejeitado'
  criadoEm:              Date
}
```

### Product (ligado a Supermarket via `supermercadoId`)
```
{
  supermercadoId:   ObjectId → Supermarket
  nome:             String
  descricao:        String
  categoria:        String
  preco:            Number (min 0)
  stockDisponivel:  Number (min 0)
  imagem:           String (path do ficheiro)
  criadoEm:         Date
}
```

### Order (ligado a Supermarket e User)
```
{
  supermercadoId:  ObjectId → Supermarket
  clienteId:       ObjectId → User
  produtos:        [{ produtoId, quantidade, precoUnitario }]
  valorTotal:      Number
  estado:          'pendente' | 'confirmada' | 'em preparação' | 'em entrega' | 'entregue' | 'cancelada'
  metodoEntrega:   String (default: 'levantamento em loja')
  criadoEm:        Date
}
```

### Relações:
```
User (role=supermercados) ──1:1──► Supermarket
Supermarket ──1:N──► Product
Supermarket ──1:N──► Order
User (role=clientes)  ──1:N──► Order
Order ──N:N──► Product (via array de OrderItems)
```

---

## 5. Fluxos de Utilizador

### 5.1 Registo de Conta

```
Browser                          Servidor
  │                                 │
  ├── GET /auth/registar ──────────►│ authController.exibirRegisto
  │◄──── render registar.ejs ───────┤ (envia siteKey do reCAPTCHA)
  │                                 │
  │  [User preenche formulário]     │
  │  [reCAPTCHA v3 gera token]      │
  │                                 │
  ├── POST /auth/registar ─────────►│ authController.registar
  │                                 ├── authService.verificarCaptcha()  → Google API
  │                                 ├── authService.registarUtilizador()
  │                                 │     ├── validarRegisto() (formato dos campos)
  │                                 │     ├── verificar email único
  │                                 │     ├── bcrypt.hash(password)
  │                                 │     ├── User.create()
  │                                 │     └── SE role=supermercados → Supermarket.create(estado=Pendente)
  │◄──── redirect /auth/login ──────┤
```

**Roles disponíveis no registo público:** `clientes`, `supermercados`, `estafetas`
- O role `administrador` **não pode** ser criado pelo formulário (filtrado por `rolesPublicas`).

### 5.2 Login

```
Browser                          Servidor
  │                                 │
  ├── POST /auth/login ────────────►│ authController.login
  │                                 ├── authService.autenticarUtilizador()
  │                                 │     ├── User.findOne({ email })
  │                                 │     ├── bcrypt.compare(password, hash)
  │                                 │     └── jwt.sign({ id, role, nome })  →  token (24h)
  │                                 │
  │◄──── Set-Cookie: token ─────────┤
  │◄──── redirect → dashboard ──────┤  (getDashboardUrl baseado no role)
```

**Destinos por role:**
| Role | Dashboard URL |
|------|--------------|
| administrador | `/admin/dashboard` |
| supermercados | `/supermercado/dashboard` |
| estafetas | `/estafeta/dashboard` |
| clientes | `/cliente/dashboard` |

### 5.3 Fluxo do Supermercado

```
Registo → Login → [Middleware verifica aprovação]
                         │
                    ┌─────┴──────┐
                    │            │
              Não Aprovado    Aprovado
                    │            │
            Página "Aguardando"  │
                                 ▼
                          Dashboard
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
              Listar      Criar      Ver/Editar
              Produtos    Produto    Produto
```

**Rotas do supermercado:**
| Método | Rota | Ação |
|--------|------|------|
| GET | `/supermercado/dashboard` | Dashboard |
| GET | `/supermercado/produtos` | Listar todos os produtos |
| GET | `/supermercado/produtos/novo` | Formulário novo produto |
| GET | `/supermercado/produtos/:id` | Detalhes de um produto |
| GET | `/supermercado/produtos/editar/:id` | Formulário editar produto |
| POST | `/supermercado/produtos` | Guardar novo produto |
| POST | `/supermercado/produtos/editar/:id` | Guardar edição |

### 5.4 Fluxo do Administrador

```
Login → Dashboard (nº users, supermercados pendentes)
            │
            ▼
    Supermercados Pendentes
            │
      ┌─────┴──────┐
      ▼            ▼
   Aprovar      Rejeitar
```

**Rotas do admin:**
| Método | Rota | Ação |
|--------|------|------|
| GET | `/admin/dashboard` | Dashboard com estatísticas |
| GET | `/admin/supermercados/pendentes` | Lista de supermercados à espera |
| POST | `/admin/supermercados/aprovar/:id` | Aprovar um supermercado |
| POST | `/admin/supermercados/rejeitar/:id` | Rejeitar um supermercado |

### 5.5 Estafeta e Cliente

Atualmente têm **apenas um dashboard stub** — sem funcionalidades implementadas.

---

## 6. Segurança

| Mecanismo | Implementação |
|---|---|
| **Passwords** | Hash com `bcrypt` (12 salt rounds), nunca guardadas em texto |
| **Autenticação** | JWT com 24h de validade, guardado em cookie `HttpOnly` (não acessível por JS) |
| **Autorização** | Middleware `verificarRole()` bloqueia acesso a áreas de outros roles |
| **Anti-bot** | reCAPTCHA v3 da Google no registo (score mínimo 0.5) |
| **Validação** | Dupla: client-side (JS nos formulários) + server-side (Mongoose schemas + `userValidator.js`) |
| **Aprovação** | Supermercados só acedem ao sistema após aprovação do Admin |

---

## 7. Como as Views Funcionam (EJS)

Todas as páginas seguem este padrão:

```html
<!DOCTYPE html>
<html>
<head>
    <%- include('../partials/head') %>     <!-- Bootstrap + CSS + meta -->
</head>
<body>
    <%- include('../partials/navbar') %>   <!-- Header dinâmico por role -->

    <!-- Conteúdo específico da página -->

</body>
</html>
```

A navbar mostra links diferentes conforme o `user.role`:
- **Supermercado:** Início, Gerir Produtos, Encomendas
- **Admin:** Início, Utilizadores
- **Sem login:** Botão "Entrar"

A variável `user` está disponível em **todas as views** graças ao middleware `injetarUserNasViews` que coloca o JWT descodificado em `res.locals.user`.

---

## 8. Variáveis de Ambiente (.env)

| Variável | Uso |
|---|---|
| `MONGODB_URI` | Connection string do MongoDB Atlas |
| `SALT_ROUNDS` | Número de rounds para o bcrypt (12) |
| `JWT_SECRET` | Chave secreta para assinar JWTs |
| `CAPTCHA_API_KEY` | Site key do reCAPTCHA v3 (público) |
| `CAPTCHA_API_SECRET` | Secret key do reCAPTCHA v3 (servidor) |
| `CAPTCHA_MIN_SCORE` | Score mínimo aceite (0.5) |

---

## 9. Scripts Client-Side (public/javascript/)

| Ficheiro | Função |
|---|---|
| `authValidations.js` | Validação em tempo real nos formulários de login/registo |
| `validacoes.js` | Funções auxiliares de validação (email, password) |
| `mostrarPassword.js` | Toggle de visibilidade da password |
| `recaptcha.js` | Integração com o reCAPTCHA v3 |
| `adminActions.js` | Ações de aprovação/rejeição no painel admin |
| `estafetaActions.js` | Ações no painel do estafeta |
| `produtoCreateUpdate.js` | Validação nos formulários de produto |

---

## 10. Como Executar

```bash
# Instalar dependências
npm install

# Modo desenvolvimento (com hot-reload via nodemon)
npm run dev

# Modo produção
npm start
```

O servidor inicia em `http://localhost:3000` (porta definida em `bin/www`).
