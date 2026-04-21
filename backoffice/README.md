# PAW Marketplace de Supermercados Locais

Projeto desenvolvido para a Unidade Curricular de Programação em Ambiente Web (PAW).

## Utilizadores de Teste

Pode utilizar as seguintes credenciais para testar as diferentes áreas da plataforma:
mesmo que o professor não consiga acesso à base dados o administrador é criado por default, as credenciais mantêm-se;

| Perfil | Email | Password |
| :--- | :--- | :--- |
| **Administrador** | `admin@teste.com` | `Teste12345` |
| **Estafeta** | `estafeta@teste.com` | `Teste12345` |
| **Supermercado** | `supermercado@teste.com` | `Teste12345` |
| **Cliente** | `cliente@teste.com` | `Teste12345` |

###  Venda em Caixa (Default)
Para vendas sem cliente identificado, o sistema utiliza automaticamente o seguinte perfil:
- **Email:** `cliente@teste.com`
- **NIF:** `999999990`

## Como correr o projeto
1. Instalar dependências: `npm install`
2. Configurar o ficheiro `.env` 
3. Iniciar o servidor: `npm run dev`

# Exemplo de .env
MONGODB_URI=(...)
SALT_ROUNDS=(...)
CAPTCHA_API_KEY=(...)
CAPTCHA_API_SECRET=(...)
CAPTCHA_MIN_SCORE=(...)
NODE_ENV=(...)
DEFAULT_ADMIN_PASSWORD=(...) 
# Configurações do Mailgun (SMTP)
EMAIL_HOST=(...) 
EMAIL_PORT=(...) 
EMAIL_USER=(...) 
EMAIL_PASS=(...) 

o ficheiro .env é usado como garantia de segurança já o ficheiro config.js utiliza estas variáveis para 
que possamos de forma segura utilizar estes valores.
##  Sistema de Envio de Emails (Recuperação de Password)

O projeto utiliza a biblioteca **Nodemailer** com o serviço **Mailgun**.

### Arquitetura
1.  **Nodemailer**: Atua como o cliente SMTP dentro da aplicação Node.js, facilitando a construção e o envio de mensagens HTML formatadas.
2.  **Mailgun**: Utilizado como servidor de saída para garantir a entrega e segurança no envio do token para atualizar palavra-passe.

### Configuração para Testes (Ambiente de Desenvolvimento)
Devido às restrições do plano grátis, o envio de emails reais está limitado apenas a destinatários autorizados e o uso de dominios institucionais não funcionam...

**Verificação via Terminal (Recomendado), caso contrário apenas com Email pessoal**
Ao não configurar uma conta email pessoal o sistema possui um mecanismo de *fallback* automático:
1. Variáveis `EMAIL_USER` e `EMAIL_PASS` vazias no ficheiro `.env`.
2. Ao solicitar a recuperação de password, o sistema usará o **Ethereal Email**.
3. O link para visualizar o email gerado será impresso diretamente no **terminal do servidor**.


## Zonas de Operação e Geolocalização

Para garantir a consistência dos dados e facilitar o trabalho dos estafetas, o sistema utiliza um sistema de zonas restritas:

- **Zonas Ativas**: Lousada, Porto, Felgueiras e Penafiel.
- **Registo de Supermercado**: O utilizador deve selecionar um concelho da lista. Ao selecionar, o mapa foca automaticamente nessa região para facilitar a marcação exata da loja no supermercado não há possibilidade de a venda ser feita fora do círculo.
- **Filtragem de Estafetas**: Os estafetas escolhem a sua zona de trabalho e o mapa abre focado apenas nos supermercados e entregas dessa região, ignorando tudo o resto para uma interface limpa e rápida.

---

## Fluxo de Encomendas

### Estados possíveis

| Estado | Descrição |
| :--- | :--- |
| `pendente` | Encomenda criada pelo cliente (frontoffice) — aguarda confirmação do supermercado |
| `confirmada` | Supermercado confirmou a encomenda — pronta para preparação ou entrega |
| `em preparação` | Encomenda está a ser preparada pelo supermercado (apenas para levantamento em loja) |
| `em entrega` | Estafeta aceitou a encomenda e está a caminho do cliente |
| `aguarda validação` | Estafeta entregou no destino — aguarda confirmação final do cliente |
| `entregue` | Cliente confirmou a receção ou venda imediata em caixa — **estado final** |
| `cancelada` | Encomenda cancelada em qualquer fase — **estado final** |

### Diagrama de transições

**Entrega ao Domicílio:**
```
pendente → confirmada → em entrega → aguarda validação → entregue
    ↓           ↓             ↓               ↓
 cancelada   cancelada     cancelada       cancelada
```

**Levantamento em Loja:**
```
pendente → confirmada → em preparação → entregue
    ↓           ↓              ↓
 cancelada   cancelada      cancelada
```

### Quem faz o quê?

| Transição | Responsável |
| :--- | :--- |
| `pendente` → `confirmada` | Supermercado |
| `confirmada` → `em preparação` | Supermercado (Levantamento em Loja) |
| `confirmada` → `em entrega` | Estafeta (ao aceitar a entrega) |
| `em entrega` → `aguarda validação` | Estafeta (ao chegar ao destino) |
| `aguarda validação` → `entregue` | Cliente (via Frontoffice) |
| `em preparação` → `entregue` | Supermercado (no ato do levantamento) |
| qualquer estado → `cancelada` | Supermercado / Cliente (se nos primeiros 5 min) |

### Pontos de entrada

**Venda em Caixa (POS — Backoffice)**
- **Levantamento em loja**: A encomenda é criada diretamente como `entregue` (venda imediata).
- **Entrega ao domicílio**: A encomenda é criada como `confirmada` (entra no fluxo de entrega).

**Encomenda Online (Frontoffice)**
- A encomenda é criada como `pendente` e segue o fluxo completo desde o início.

### Regras de negócio
- **Estados finais** (`entregue`, `cancelada`): não permitem mais alterações.
- **Sem recuos**: um estado só pode avançar para o próximo, nunca voltar atrás.
- **Cancelamento pelo Cliente**: o cliente pode cancelar a encomenda a qualquer momento enquanto estiver `pendente`. Após ser `confirmada`, o cancelamento apenas é permitido nos primeiros **5 minutos**.
- **Um Supermercado por Encomenda**: cada encomenda apenas pode conter produtos de um único supermercado.
- **Uma Entrega por Estafeta**: cada estafeta apenas pode ter uma entrega ativa (`em entrega`) de cada vez.
- **Stock**: produtos sem stock não podem ser adicionados ao carrinho. O stock é decrementado atomicamente no momento da criação da venda e reposto caso a encomenda seja cancelada.
- **Fatura**: é gerada automaticamente na primeira transição para `confirmada` ou superior.
- **Avaliação**: o cliente só pode avaliar após o estado `entregue`.

---
