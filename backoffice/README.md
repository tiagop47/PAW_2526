# PAW Marketplace de Supermercados Locais

Projeto desenvolvido para a Unidade Curricular de Programação em Ambiente Web (PAW).

## Utilizadores de Teste

Pode utilizar as seguintes credenciais para testar as diferentes áreas da plataforma:

| Perfil | Email | Password |
| :--- | :--- | :--- |
| **Administrador** | `admin@teste.com` | `Teste12345` |
| **Estafeta** | `estafeta@teste.com` | `Teste12345` |
| **Supermercado** | `supermercado@teste.com` | `Teste12345` |
| **Cliente** | `cliente@teste.com` | `Teste12345` |

### Venda em Caixa (POS - Default)
Para vendas sem cliente identificado, o sistema utiliza automaticamente o seguinte perfil:
- **Email:** `cliente@teste.com`
- **NIF:** `999999990`

## Como correr o projeto
1. Instalar dependências: `npm install`
2. Configurar o ficheiro `.env` 
3. Iniciar o servidor: `npm run dev`

---

## Sistema de Cupões e Fidelização

O sistema de cupões é gerido exclusivamente pelos supermercados para os seus clientes:

1.  **Vínculo Local**: Cada cupão pertence a um único supermercado. Um cupão criado pelo "Supermercado A" não pode ser utilizado em compras no "Supermercado B".
2.  **Boas-Vindas**: Ao registar-se, se o cliente escolher um supermercado favorito, recebe automaticamente um cupão de 10% de desconto (`WELCOME` + ID) exclusivo para essa loja.
3.  **Gestão de Cupões**: Os supermercados podem criar, ativar, desativar ou eliminar cupões. Ao criar um novo cupão, todos os clientes que têm esse supermercado como favorito são notificados por email.
4.  **Consumo**: Os cupões são de utilização única e são removidos da conta do utilizador após a finalização da encomenda.

---

## Fluxo de Encomendas

O sistema utiliza 6 estados oficiais conforme os requisitos do projeto:

### Estados Oficiais

| Estado | Descrição |
| :--- | :--- |
| `pendente` | Criada online (Frontoffice) — aguarda confirmação da loja. |
| `confirmada` | Confirmada pela loja (Online) ou registada na caixa (POS). Pronta para preparação ou entrega. |
| `em preparação` | A loja está a separar os produtos (apenas Levantamento em Loja). |
| `em entrega` | Estafeta aceitou e está a caminho do destino (apenas Entrega ao Domicílio). |
| `entregue` | Encomenda concluída (cliente recebeu ou levantou). **Estado Final**. |
| `entregue` | Encomenda concluída. **Estado Final**. |

### Responsabilidade das Transições
- **`pendente` → `confirmada`**: Supermercado (validar pedido online).
- **`confirmada` → `em preparação`**: Supermercado (apenas Levantamento em Loja).
- **`confirmada` → `em entrega`**: Estafeta (ao aceitar a recolha no supermercado).
- **`em entrega` → `entregue`**: **Cliente** (confirmação de receção no Frontoffice).
- **`em preparação` → `entregue`**: **Supermercado** (no ato da entrega em mão ao cliente).

### Regras de Negócio e POS
- **Confirmação do Cliente**: Em entregas ao domicílio, a encomenda só passa a `entregue` quando o cliente confirma no Frontoffice que recebeu o pedido. Isto liberta o pagamento e finaliza o processo.
- **Venda em Caixa (POS)**: Qualquer venda registada no Backoffice entra no estado **`confirmada`**.
    - Se for **Levantamento**, a loja prepara e marca como `entregue` quando o cliente aparecer.
    - Se for **Entrega**, entra no fluxo de estafeta e aguarda confirmação final do cliente.
- **Faturação**: As faturas são geradas automaticamente na transição para `confirmada`.
- **Zonas**: Lousada, Porto, Felgueiras e Penafiel. Supermercados e estafetas estão restritos às suas áreas geográficas de atuação.

---

## Emails e Notificações
O sistema utiliza **Nodemailer** com fallback automático para **Ethereal Email** em ambiente de desenvolvimento. Os links de visualização de emails (Recuperação de Password, Boas-vindas, Novos Cupões) são impressos no terminal do servidor.
