# 🖱️ Fluxo de Cliques — PAW Marketplace

> Documento que descreve **todos os cliques possíveis** na interface e o que acontece em cada um deles, desde o browser até ao servidor e de volta.

---

## 📋 Índice

1. [Página Inicial (Sem Login)](#1-página-inicial-sem-login)
2. [Página de Login](#2-página-de-login)
3. [Página de Registo](#3-página-de-registo)
4. [Página de Recuperar Password](#4-página-de-recuperar-password)
5. [Navbar (Após Login)](#5-navbar-após-login)
6. [Dashboard do Administrador](#6-dashboard-do-administrador)
7. [Página de Aprovação de Supermercados](#7-página-de-aprovação-de-supermercados)
8. [Dashboard do Supermercado](#8-dashboard-do-supermercado)
9. [Página de Gestão de Produtos](#9-página-de-gestão-de-produtos)
10. [Página de Novo Produto](#10-página-de-novo-produto)
11. [Página de Detalhes do Produto](#11-página-de-detalhes-do-produto)
12. [Página de Editar Produto](#12-página-de-editar-produto)
13. [Página Aguardando Aprovação](#13-página-aguardando-aprovação)
14. [Dashboard do Cliente](#14-dashboard-do-cliente)
15. [Dashboard do Estafeta](#15-dashboard-do-estafeta)

---

## 1. Página Inicial (Sem Login)

Quando o utilizador **não está autenticado**, a navbar mostra apenas o logotipo e o botão "Entrar".

### Clique: **Logotipo "PAW Market"**
```
📍 Elemento: <a href="/">PAW Market</a>
```
```
Clique ──► GET /
         ──► Express procura uma rota para "/"
         ──► (depende da configuração em app.js — tipicamente redireciona para /auth/login)
```

### Clique: **Botão "Entrar"**
```
📍 Elemento: <a href="/auth/login" class="btn btn-primary btn-sm">Entrar</a>
```
```
Clique ──► GET /auth/login
         ──► routes/auth.js → authController.exibirLogin
         ──► Controller: res.render("loginRegisto/login", { errorMessage: null })
         ──► EJS renderiza login.ejs com partials/head.ejs
         ──► 📄 Página de Login aparece
```

---

## 2. Página de Login

**URL:** `/auth/login`  
**View:** `views/loginRegisto/login.ejs`  
**Scripts carregados:** `validacoes.js`, `mostrarPassword.js`, `authValidations.js`

### Clique: **Botão "Ver" (Toggle Password)**
```
📍 Elemento: <button id="togglePassword">Ver</button>
```
```
Clique ──► mostrarPassword.js ouve o evento "click"
         ──► Verifica o tipo atual do input #password
         ──► SE type="password" → muda para type="text" + texto "Ocultar"
         ──► SE type="text" → muda para type="password" + texto "Ver"
         ──► ⚡ Sem pedido ao servidor — tudo acontece no browser
```

### Clique: **Botão "Entrar" (Submit do formulário)**
```
📍 Elemento: <button type="submit">Entrar</button>
📍 Formulário: <form action="/auth/login" method="POST">
```
```
Clique ──► authValidations.js intercepta o submit
         │
         ├── Validação client-side:
         │   ├── validarEmail(email) → verifica formato do email
         │   └── password.length < 1 → verifica se password não está vazia
         │
         ├── SE há erros → e.preventDefault() → mostra mensagens → ❌ NÃO envia
         │
         └── SE válido → POST /auth/login
              ──► routes/auth.js → authController.login
              ──► Controller:
              │   ├── const { email, password } = req.body
              │   ├── authService.autenticarUtilizador(email, password)
              │   │   ├── User.findOne({ email }) ──► MongoDB
              │   │   ├── bcrypt.compare(password, hash) → verifica password
              │   │   └── jwt.sign({ id, role, nome }) → gera token (24h)
              │   │
              │   ├── res.cookie('token', token, { httpOnly: true, ... })
              │   │
              │   └── res.redirect(getDashboardUrl(role))
              │       ├── administrador → /admin/dashboard
              │       ├── supermercados → /supermercado/dashboard
              │       ├── estafetas    → /estafeta/dashboard
              │       └── clientes     → /cliente/dashboard
              │
              └── SE erro (email/password errados):
                   ──► res.render("loginRegisto/login", { errorMessage: err.message })
                   ──► 📄 Login aparece de novo com alerta vermelho
```

### Clique: **Link "Esqueceu-se?"**
```
📍 Elemento: <a href="/auth/recuperarPassword">Esqueceu-se?</a>
```
```
Clique ──► GET /auth/recuperarPassword
         ──► routes/auth.js → authController.exibirRecuperarPassword
         ──► Controller: res.render("loginRegisto/recuperarPassword")
         ──► 📄 Página de recuperar password aparece
```

### Clique: **Link "Registe-se aqui"**
```
📍 Elemento: <a href="/auth/registar">Registe-se aqui</a>
```
```
Clique ──► GET /auth/registar
         ──► routes/auth.js → authController.exibirRegisto
         ──► Controller: res.render("loginRegisto/registar", { errorMessage: null, siteKey })
         ──► 📄 Página de registo aparece
```

---

## 3. Página de Registo

**URL:** `/auth/registar`  
**View:** `views/loginRegisto/registar.ejs`  
**Scripts carregados:** `validacoes.js`, `authValidations.js`, `recaptcha.js`, Google reCAPTCHA API

### Clique: **Seletor "Tipo de Perfil" (Mudar Role)**
```
📍 Elemento: <select id="seletor-role">
               <option value="supermercados">Supermercado</option>
               <option value="estafetas">Estafeta</option>
             </select>
```
```
Mudança ──► Script inline ouve o evento "change"
          │
          ├── SE value === "supermercados"
          │   └── #campos-supermercado.style.display = "flex"
          │       (mostra campos: Localização, Horário, Custo Entrega, Descrição)
          │
          └── SE value === "estafetas"
              └── #campos-supermercado.style.display = "none"
                  (esconde os campos extra do supermercado)
          
          ──► ⚡ Sem pedido ao servidor — apenas mostra/esconde campos no browser
```

### Clique: **Botão "Solicitar Registo" (Submit)**
```
📍 Elemento: <button type="submit">Solicitar Registo</button>
📍 Formulário: <form action="/auth/registar" method="POST" 
                     onsubmit="validarComRecaptcha(event, siteKey, 'registar')">
```
```
Clique ──► 1️⃣ authValidations.js intercepta o submit PRIMEIRO
         │   ├── Verifica nome (min 3 chars)
         │   ├── Verifica email (formato válido)
         │   ├── Verifica password (min 8 chars)
         │   └── Verifica telefone (min 9 dígitos)
         │   └── SE há erros → e.preventDefault() + e.stopImmediatePropagation()
         │                    → ❌ NÃO avança, mostra erros
         │
         └── 2️⃣ SE validação OK → validarComRecaptcha() é chamado (recaptcha.js)
              │   ├── e.preventDefault() (pausa o envio)
              │   ├── grecaptcha.ready() → pede token ao Google
              │   ├── grecaptcha.execute(siteKey, {action: 'registar'})
              │   ├── Recebe token → coloca em #g-recaptcha-response (input hidden)
              │   └── form.submit() → agora sim, envia o formulário
              │
              └── 3️⃣ POST /auth/registar
                   ──► routes/auth.js → authController.registar
                   ──► Controller:
                   │   ├── authService.verificarCaptcha(token)
                   │   │   └── Envia token ao Google → verifica score ≥ 0.5
                   │   │
                   │   ├── authService.registarUtilizador(req.body)
                   │   │   ├── validarRegisto() → valida formato de todos os campos
                   │   │   ├── Verifica se email já existe no MongoDB
                   │   │   ├── bcrypt.hash(password, 12) → hash da password
                   │   │   ├── User.create({ nome, email, password, telefone, morada, role })
                   │   │   │
                   │   │   └── SE role === "supermercados":
                   │   │       └── Supermarket.create({
                   │   │             userId, nome, localizacao, horario,
                   │   │             custoEntrega, descricao,
                   │   │             estadoAprovacao: "Pendente"  ← IMPORTANTE!
                   │   │           })
                   │   │
                   │   └── res.redirect("/auth/login")
                   │       ──► 📄 Volta para o Login com sucesso
                   │
                   └── SE erro:
                        ──► res.render("loginRegisto/registar", { errorMessage, siteKey, dados })
                        ──► 📄 Registo aparece de novo com alerta + campos preenchidos
```

### Clique: **Link "Inicie sessão"**
```
📍 Elemento: <a href="/auth/login">Inicie sessão</a>
```
```
Clique ──► GET /auth/login → 📄 Página de Login
```

---

## 4. Página de Recuperar Password

**URL:** `/auth/recuperarPassword`  
**View:** `views/loginRegisto/recuperarPassword.ejs`

### Clique: **Botão "Enviar Link"**
```
📍 Elemento: <button type="submit">Enviar Link</button>
📍 Formulário: <form action="/auth/recuperarPassword" method="POST">
```
```
Clique ──► POST /auth/recuperarPassword
         ──► ⚠️ Rota POST não implementada atualmente
         ──► (a funcionalidade de envio de email ainda não está construída)
```

### Clique: **Link "Login"**
```
📍 Elemento: <a href="/auth/login">Login</a>
```
```
Clique ──► GET /auth/login → 📄 Página de Login
```

---

## 5. Navbar (Após Login)

A navbar é renderizada pelo partial `views/partials/navbar.ejs` e é **dinâmica** conforme o role do utilizador. Aparece em **todas as páginas** após login.

### Clique: **Logotipo "PAW Market"**
```
📍 Elemento: <a href="/">PAW Market</a>
```
```
Clique ──► GET / → Página inicial da aplicação
```

### Clique: **Link "Dashboard"**
```
📍 Elemento: <a href="/[role]/dashboard">Dashboard</a>
```
```
Clique ──► GET /[admin|supermercado|estafeta|cliente]/dashboard
         ──► Middleware: verificarAutenticacao → verificarRole
         ──► Controller respetivo → renderiza dashboard do role
```

### Clique: **Link "Produtos"** *(só visível para supermercados)*
```
📍 Elemento: <a href="/supermercado/produtos">Produtos</a>
```
```
Clique ──► GET /supermercado/produtos
         ──► Middleware: verificarAutenticacao → verificarRole(['supermercados']) → verificarAprovacaoSupermercado
         ──► supermarketController.exibirProdutos
         ──► Product.find() ──► MongoDB
         ──► 📄 Página de Gestão de Produtos
```

### Clique: **Link "Encomendas"** *(só visível para supermercados)*
```
📍 Elemento: <a href="/supermercado/encomendas">Encomendas</a>
```
```
Clique ──► GET /supermercado/encomendas
         ──► ⚠️ Rota não implementada atualmente
```

### Clique: **Dropdown "Minha Conta" → "Editar Perfil"**
```
📍 Elemento: <a href="/[role]/perfil">Editar Perfil</a>
```
```
Clique ──► GET /supermercado/perfil (ou /estafeta/perfil ou /cliente/perfil)
         ──► ⚠️ Rota não implementada atualmente
```

### Clique: **Dropdown "Minha Conta" → "Definições"**
```
📍 Elemento: <a href="/definicoes">Definições</a>
```
```
Clique ──► GET /definicoes
         ──► ⚠️ Rota não implementada atualmente
```

### Clique: **Dropdown "Opções" → "Fechar Painel" (Logout)**
```
📍 Elemento: <a href="/auth/logout">Fechar Painel</a>
```
```
Clique ──► GET /auth/logout
         ──► routes/auth.js → authController.logout
         ──► Controller:
         │   ├── res.clearCookie('token')  → apaga o cookie JWT
         │   └── res.redirect('/auth/login')
         ──► 📄 Volta para a página de Login (sem sessão)
```

---

## 6. Dashboard do Administrador

**URL:** `/admin/dashboard`  
**View:** `views/admin/dashboard.ejs`  
**Proteção:** `verificarAutenticacao` + `verificarRole(['administrador'])`

### Clique: **Botão "Aprovar"**
```
📍 Elemento: <a href="/admin/supermercados/pendentes" class="btn btn-outline-primary">
               Aprovar
             </a>
```
```
Clique ──► GET /admin/supermercados/pendentes
         ──► routes/admin.js → adminController.listarPendentes
         ──► Controller:
         │   └── Supermarket.find({ estadoAprovacao: 'Pendente' }).populate('userId')
         │       ──► MongoDB: busca supermercados pendentes + dados do User associado
         ──► res.render('admin/supermercadosPendentes', { supermercados })
         ──► 📄 Página com tabela de supermercados à espera de aprovação
```

### Clique: **Botão "Gerir Utilizadores"**
```
📍 Elemento: <a href="/admin/utilizadores" class="btn btn-outline-secondary">
               Gerir Utilizadores
             </a>
```
```
Clique ──► GET /admin/utilizadores
         ──► ⚠️ Rota não implementada atualmente
```

---

## 7. Página de Aprovação de Supermercados

**URL:** `/admin/supermercados/pendentes`  
**View:** `views/admin/supermercadosPendentes.ejs`  
**Proteção:** `verificarAutenticacao` + `verificarRole(['administrador'])`

### Clique: **Botão "Aprovar" (numa linha da tabela)**
```
📍 Elemento: <form action="/admin/supermercados/aprovar/<id>" method="POST">
               <button type="submit">Aprovar</button>
             </form>
```
```
Clique ──► POST /admin/supermercados/aprovar/:id
         ──► routes/admin.js → adminController.aprovarSupermercado
         ──► Controller:
         │   └── Supermarket.findByIdAndUpdate(id, { estadoAprovacao: 'Aprovado' })
         │       ──► MongoDB: atualiza o estado para "Aprovado"
         ──► res.redirect('/admin/supermercados/pendentes')
         ──► 📄 Página recarrega — o supermercado aprovado desaparece da lista
         
         ✅ CONSEQUÊNCIA: o supermercado aprovado agora pode aceder ao seu dashboard
            (o middleware verificarAprovacaoSupermercado vai deixar passar)
```

### Clique: **Botão "Rejeitar" (numa linha da tabela)**
```
📍 Elemento: <form action="/admin/supermercados/rejeitar/<id>" method="POST">
               <button type="submit" class="text-danger">Rejeitar</button>
             </form>
```
```
Clique ──► POST /admin/supermercados/rejeitar/:id
         ──► routes/admin.js → adminController.rejeitarSupermercado
         ──► Controller:
         │   └── Supermarket.findByIdAndUpdate(id, { estadoAprovacao: 'Rejeitado' })
         │       ──► MongoDB: atualiza o estado para "Rejeitado"
         ──► res.redirect('/admin/supermercados/pendentes')
         ──► 📄 Página recarrega — o supermercado rejeitado desaparece da lista
         
         ❌ CONSEQUÊNCIA: se o supermercado tentar fazer login, verá a página
            "Aguardando Aprovação" com estado "Rejeitado"
```

### Clique: **Botão "Voltar"**
```
📍 Elemento: <a href="/admin/dashboard">Voltar</a>
```
```
Clique ──► GET /admin/dashboard → 📄 Dashboard do Admin
```

---

## 8. Dashboard do Supermercado

**URL:** `/supermercado/dashboard`  
**View:** `views/supermercado/dashboard.ejs`  
**Proteção:** `verificarAutenticacao` + `verificarRole(['supermercados'])` + `verificarAprovacaoSupermercado`

> ⚠️ **Se o supermercado NÃO estiver aprovado**, qualquer rota `/supermercado/*` é intercetada pelo middleware `verificarAprovacaoSupermercado` e mostra a [Página Aguardando Aprovação](#13-página-aguardando-aprovação).

### Clique: **Link "Adicionar Produto"**
```
📍 Elemento: <a href="/supermercado/produtos">Adicionar Produto</a>
```
```
Clique ──► GET /supermercado/produtos
         ──► Middleware: verificarAutenticacao → verificarRole → verificarAprovacaoSupermercado
         ──► supermarketController.exibirProdutos
         ──► Product.find() ──► MongoDB
         ──► 📄 Página de Gestão de Produtos (lista)
```

### Clique: **Botão "Detalhes" (na tabela de encomendas)**
```
📍 Elemento: <a href="#">Detalhes</a>
```
```
Clique ──► ⚠️ Ainda aponta para "#" — não implementado
```

---

## 9. Página de Gestão de Produtos

**URL:** `/supermercado/produtos`  
**View:** `views/supermercado/produtos.ejs`  
**Proteção:** Todos os middlewares do supermercado

### Clique: **Botão "+ Novo Produto"**
```
📍 Elemento: <a href="/supermercado/produtos/novo" class="btn btn-primary">+ Novo Produto</a>
```
```
Clique ──► GET /supermercado/produtos/novo
         ──► routes/supermercado.js → supermarketController.exibirFormularioNovo
         ──► Controller: res.render('supermercado/novoProduto')
         ──► 📄 Formulário de criação de novo produto
```

### Clique: **Nome do produto (link na tabela)**
```
📍 Elemento: <a href="/supermercado/produtos/<id>">Nome do Produto</a>
```
```
Clique ──► GET /supermercado/produtos/:id
         ──► routes/supermercado.js → supermarketController.exibirDetalhes
         ──► Controller:
         │   └── Product.findById(id) ──► MongoDB
         │       ├── SE não encontrado → res.status(404)
         │       └── SE encontrado → res.render('supermercado/detalhesProduto', { produto })
         ──► 📄 Ficha do Produto com todos os detalhes
```

### Clique: **Botão "Editar" (na tabela)**
```
📍 Elemento: <a href="/supermercado/produtos/editar/<id>">Editar</a>
```
```
Clique ──► GET /supermercado/produtos/editar/:id
         ──► routes/supermercado.js → supermarketController.exibirFormularioEditar
         ──► Controller:
         │   └── Product.findById(id) ──► MongoDB
         │       ├── SE não encontrado → res.status(404)
         │       └── SE encontrado → res.render('supermercado/editarProduto', { produto })
         ──► 📄 Formulário de edição preenchido com os dados atuais
```

### Clique: **Botão "Eliminar" (na tabela)**
```
📍 Elemento: <button class="btn btn-sm text-danger">Eliminar</button>
```
```
Clique ──► ⚠️ Botão sem ação implementada (não tem form nem onclick)
         ──► Nada acontece ao clicar
```

---

## 10. Página de Novo Produto

**URL:** `/supermercado/produtos/novo`  
**View:** `views/supermercado/novoProduto.ejs`

### Clique: **Botão "Guardar Produto" (Submit)**
```
📍 Elemento: <button type="submit">Guardar Produto</button>
📍 Formulário: <form action="/supermercado/produtos" method="POST" id="formCriar">
```
```
Clique ──► produtoCreateUpdate.js intercepta o submit (se #formCriar existe)
         │
         ├── Validação client-side:
         │   ├── nome.length < 2 → "O nome deve ter pelo menos 2 caracteres."
         │   ├── preco < 0 ou vazio → "O preço deve ser um valor positivo."
         │   └── stock < 0 ou vazio → "O stock deve ser um número positivo."
         │
         ├── SE há erros → e.preventDefault() + alert(erros) → ❌ NÃO envia
         │
         └── SE válido → POST /supermercado/produtos
              ──► routes/supermercado.js → supermarketController.criarProduto
              ──► Controller:
              │   ├── const { nome, descricao, categoria, preco, stock } = req.body
              │   └── Product.create({
              │         nome, descricao, categoria, preco,
              │         stockDisponivel: stock,
              │         supermercadoId: req.user.id  ← ID do supermercado logado
              │       })
              │       ──► MongoDB: cria novo documento na coleção Products
              │
              ──► res.redirect('/supermercado/produtos')
              ──► 📄 Lista de produtos atualizada com o novo produto
```

### Clique: **Botão "Cancelar"**
```
📍 Elemento: <a href="/supermercado/produtos">Cancelar</a>
```
```
Clique ──► GET /supermercado/produtos → 📄 Lista de produtos (volta sem guardar)
```

---

## 11. Página de Detalhes do Produto

**URL:** `/supermercado/produtos/:id`  
**View:** `views/supermercado/detalhesProduto.ejs`

### Clique: **Botão "Voltar"**
```
📍 Elemento: <a href="/supermercado/produtos">Voltar</a>
```
```
Clique ──► GET /supermercado/produtos → 📄 Lista de produtos
```

### Clique: **Botão "Editar Dados"**
```
📍 Elemento: <a href="/supermercado/produtos/editar/<id>">Editar Dados</a>
```
```
Clique ──► GET /supermercado/produtos/editar/:id
         ──► supermarketController.exibirFormularioEditar
         ──► Product.findById(id) ──► MongoDB
         ──► 📄 Formulário de edição com dados preenchidos
```

---

## 12. Página de Editar Produto

**URL:** `/supermercado/produtos/editar/:id`  
**View:** `views/supermercado/editarProduto.ejs`

### Clique: **Botão "Guardar Alterações" (Submit)**
```
📍 Elemento: <button type="submit">Guardar Alterações</button>
📍 Formulário: <form action="/supermercado/produtos/editar/<id>" method="POST">
```
```
Clique ──► POST /supermercado/produtos/editar/:id
         ──► routes/supermercado.js → supermarketController.atualizarProduto
         ──► Controller:
         │   ├── const { nome, descricao, categoria, preco, stock } = req.body
         │   └── Product.findByIdAndUpdate(id, {
         │         nome, descricao, categoria, preco,
         │         stockDisponivel: stock
         │       })
         │       ──► MongoDB: atualiza o documento existente
         │
         ──► res.redirect('/supermercado/produtos')
         ──► 📄 Lista de produtos com alterações refletidas
```

### Clique: **Botão "Cancelar"**
```
📍 Elemento: <a href="/supermercado/produtos">Cancelar</a>
```
```
Clique ──► GET /supermercado/produtos → 📄 Lista de produtos (sem alterações)
```

---

## 13. Página Aguardando Aprovação

**URL:** Qualquer rota `/supermercado/*` quando o supermercado **não está aprovado**  
**View:** `views/supermercado/aguardandoAprovacao.ejs`

> Esta página aparece automaticamente quando o middleware `verificarAprovacaoSupermercado` deteta que `estadoAprovacao !== 'Aprovado'`.

### Clique: **Botão "Sair" (header)**
```
📍 Elemento: <a href="/auth/logout">Sair</a>
```
```
Clique ──► GET /auth/logout → limpa cookie → redirect /auth/login
```

### Clique: **Botão "Voltar ao Início"**
```
📍 Elemento: <a href="/auth/logout">Voltar ao Início</a>
```
```
Clique ──► GET /auth/logout → limpa cookie → redirect /auth/login
```

---

## 14. Dashboard do Cliente

**URL:** `/cliente/dashboard`  
**View:** `views/cliente/dashboard.ejs`  
**Proteção:** `verificarAutenticacao` + `verificarRole(['clientes'])`

### Clique: **Botão "Ver Minhas Encomendas"**
```
📍 Elemento: <a href="/cliente/encomendas">Ver Minhas Encomendas</a>
```
```
Clique ──► GET /cliente/encomendas
         ──► ⚠️ Rota não implementada atualmente
```

### Clique: **Botão "Sair"**
```
📍 Elemento: <a href="/auth/logout">Sair</a>
```
```
Clique ──► GET /auth/logout → limpa cookie → redirect /auth/login
```

---

## 15. Dashboard do Estafeta

**URL:** `/estafeta/dashboard`  
**View:** `views/estafeta/dashboard.ejs`  
**Proteção:** `verificarAutenticacao` + `verificarRole(['estafetas'])`

### Clique: **Botão "Ver Entregas Disponíveis"**
```
📍 Elemento: <a href="/estafeta/entregas">Ver Entregas Disponíveis</a>
```
```
Clique ──► GET /estafeta/entregas
         ──► ⚠️ Rota não implementada atualmente
```

---

## 🔄 Pesquisa de Produtos (Fetch API)

A pesquisa de produtos usa **JavaScript assíncrono (fetch)** sem recarregar a página. Funciona via `pesquisaProdutos.js`.

### Interação: **Escrever no campo de pesquisa**
```
📍 Elemento: <input id="pesquisa-produto">
```
```
Tecla ──► pesquisaProdutos.js ouve o evento "input"
        ──► Debounce de 300ms (espera o utilizador parar de escrever)
        ──► Chama pesquisarProdutos()
        │
        ├── Constroi URLSearchParams com:
        │   ├── q = texto pesquisado
        │   └── categoria = valor do select (se existir)
        │
        ├── fetch(`/supermercado/api/produtos?q=leite&categoria=Laticinios`)
        │   ──► GET /supermercado/api/produtos (rota API)
        │   ──► supermarketController.pesquisarProdutos
        │   ──► Controller:
        │   │   ├── Constroi filtro MongoDB:
        │   │   │   ├── supermercadoId: req.user.id (só produtos deste supermercado)
        │   │   │   ├── nome: { $regex: q, $options: 'i' } (pesquisa case-insensitive)
        │   │   │   └── categoria: categoria (se fornecida)
        │   │   │
        │   │   └── Product.find(filtro).sort({ nome: 1 })
        │   │       ──► MongoDB: pesquisa + ordena por nome
        │   │
        │   └── res.json(produtos) ← devolve JSON (não HTML!)
        │
        └── atualizarTabela(produtos)
            ├── SE 0 resultados → mostra "Nenhum produto encontrado."
            └── SE resultados → reconstroi <tr> da tabela com innerHTML
                (cada linha tem links "Ver" e "Editar")
        
        ──► ⚡ A página NÃO recarrega — a tabela atualiza-se dinamicamente
```

### Interação: **Mudar o filtro de categoria**
```
📍 Elemento: <select id="filtro-categoria">
```
```
Mudança ──► pesquisaProdutos.js ouve o evento "change"
          ──► Chama pesquisarProdutos() imediatamente (sem debounce)
          ──► (mesmo fluxo da pesquisa por texto acima)
```

---

## 🗺️ Mapa Visual Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    INÍCIO (SEM LOGIN)                       │
│                                                             │
│   [Entrar] ──────────────────────────────────► LOGIN        │
└─────────────────────────────────────────────────────────────┘
                                                    │
                                        ┌───────────┴───────────┐
                                        ▼                       ▼
                                 [Registar-se]           [Esqueceu-se?]
                                        │                       │
                                        ▼                       ▼
                                    REGISTO              RECUPERAR PW
                                        │                  (stub)
                                        ▼
                                 [Solicitar Registo]
                                        │
                                        ▼
                       ┌── redirect → LOGIN ◄──────────────────────┐
                       │                                            │
                       ▼                                            │
                 [Entrar + Credenciais]                             │
                       │                                            │
          ┌────────────┼────────────┬───────────┐                   │
          ▼            ▼            ▼           ▼                   │
    ADMIN DASH    SUPER DASH   ESTAF DASH  CLIENT DASH              │
          │            │            │           │                   │
          │            │       [Entregas]  [Encomendas]             │
          │            │        (stub)      (stub)                  │
          │            │                                            │
     [Aprovar]    [Produtos]                                        │
          │            │                                            │
          ▼            ▼                                            │
    PENDENTES    LISTA PRODUTOS                                     │
     │     │       │    │    │                                      │
 [Aprovar] │  [+Novo] [Ver] [Editar]                               │
     │  [Rejeitar]  │    │      │                                   │
     │     │        ▼    ▼      ▼                                   │
     │     │     FORM   FICHA  FORM                                 │
     │     │     NOVO  DETALHE EDITAR                               │
     │     │       │      │      │                                  │
     │     │  [Guardar] [Editar] [Guardar]                          │
     │     │       │      │      │                                  │
     │     │       └──────┴──────┘                                  │
     │     │            │                                           │
     │     │            ▼                                           │
     │     │     LISTA PRODUTOS                                     │
     │     │                                                        │
     └─────┴────── [Logout] ───────────────────────────────────────┘
```

---

## ⚠️ Funcionalidades Não Implementadas (Stubs)

| Botão/Link | Destino | Estado |
|---|---|---|
| Encomendas (navbar supermercado) | `/supermercado/encomendas` | ❌ Não existe |
| Editar Perfil (dropdown) | `/[role]/perfil` | ❌ Não existe |
| Definições (dropdown) | `/definicoes` | ❌ Não existe |
| Gerir Utilizadores (admin) | `/admin/utilizadores` | ❌ Não existe |
| Ver Entregas (estafeta) | `/estafeta/entregas` | ❌ Não existe |
| Ver Encomendas (cliente) | `/cliente/encomendas` | ❌ Não existe |
| Eliminar Produto (tabela) | N/A | ❌ Botão sem ação |
| Recuperar Password (POST) | `/auth/recuperarPassword` | ❌ Rota POST não existe |
| Detalhes Encomenda (dashboard super) | `#` | ❌ Link placeholder |
