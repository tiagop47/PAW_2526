
Pode utilizar as seguintes credenciais para testar as diferentes áreas da plataforma:

| Perfil | Email | Password |
| :--- | :--- | :--- |
| **Administrador** | `admin@teste.com` | `Teste12345` |
| **Estafeta** | `estafeta@teste.com` | `Teste12345` |
| **Supermercado** | `supermercado@teste.com` | `Teste12345` |
| **Cliente** | `cliente@teste.com` | `Teste12345` |

### Venda em Caixa 
Para vendas sem cliente identificado, o sistema utiliza fallback o seguinte user 'clientes':
- **Email:** `cliente@teste.com`
- **NIF:** `999999990`

---

## Resiliência no Ponto de Venda

O módulo de **Venda em Caixa** foi desenhado para ser resiliente a erros operacionais e facilitar a navegação:

1.  **Persistência com `sessionStorage`**: O estado do carrinho de compras é guardado localmente no browser. Isto permite que o funcionário:
    *   Navegue para a página de detalhes de um produto ou configurações da loja sem perder a venda em curso.
    *   Recupere os dados automaticamente após um recarregamento acidental da página (F5).
2.  **Sincronização Automática**: Qualquer alteração na quantidade ou remoção de itens atualiza instantaneamente o armazenamento da sessão.
3.  **Limpeza Inteligente**: O armazenamento é limpo de forma segura apenas quando a venda é finalizada com sucesso, garantindo que o sistema esteja pronto para a próxima transação sem dados residuais.
---

## Fluxo de Encomendas

O sistema utiliza 6 estados oficiais conforme os requisitos do projeto:

### Fluxo de Encomendas Inteligente

O sistema distingue a origem das encomendas para otimizar a operação do supermercado, utilizando o campo `origem` (`online` ou `caixa`):

| Origem | Estado Inicial | Fluxo de Estados (Levantamento) |
| :--- | :--- | :--- |
| **Venda em Caixa (POS)** | `confirmada` | `confirmada` → `entregue` |
| **Online (Frontoffice)** | `pendente` | `pendente` → `confirmada` → `em_preparacao` → `entregue` |

#### Regras de Negócio por Origem:
1.  **Vendas em Caixa (POS)**: Como são validadas no momento pelo lojista, entram diretamente no estado **`confirmada`**. O fluxo é simplificado para levantamento imediato, saltando a fase de preparação em sistema.
2.  **Encomendas Online**: Criadas pelo cliente no Frontoffice, entram como **`pendente`**. Após a confirmação da loja, seguem um fluxo detalhado que inclui a fase de **`em_preparacao`**, permitindo ao cliente acompanhar o estado do pedido.

### Responsabilidade das Transições
- **`pendente` → `confirmada`**: Supermercado (validar pedido online).
- **`confirmada` → `em_preparacao`**: Supermercado (apenas encomendas com origem `online`).
- **`confirmada` → `em_entrega`**: Estafeta (ao aceitar a recolha no supermercado).
- **`em_preparacao` → `entregue`**: Supermercado (no ato da entrega em mão ao cliente).
- **`confirmada` → `entregue`**: Supermercado (apenas encomendas com origem `caixa` — salto direto para finalização).
- **`em_entrega` → `aguarda_validacao`**: Estafeta (ao entregar os produtos na morada do cliente).
- **`aguarda_validacao` → `entregue`**: Cliente (confirmação final no Frontoffice).


## Sistema de Cupões e Fidelização

O sistema de cupões é gerido pelos supermercados para os seus clientes, utilizando uma arquitetura que permite alta personalização:

1.  **Vínculo Local**: Cada cupão pertence a um único supermercado. Um cupão criado pelo "Supermercado A" não pode ser utilizado em compras no "Supermercado B".
2.  **Boas-Vindas**: Ao registar-se, se o cliente escolher um supermercado favorito, recebe automaticamente um cupão de 10% de desconto (`WELCOME` + ID) exclusivo para essa loja.
3.  **Gestão de Cupões**: Os supermercados podem criar, ativar, desativar ou eliminar cupões. Ao criar um novo cupão, todos os clientes que têm esse supermercado como favorito são notificados por email.
4.  **Consumo**: Os cupões são de utilização única e são removidos da conta do utilizador após a finalização da encomenda.

### Arquitetura de Fidelização Dinâmica
O sistema utiliza um modelo de **Associação Híbrida** (referências cruzadas entre Cupão, Supermercado e Utilizador), o que permite estratégias de marketing altamente segmentadas:
- **Segmentação por Comportamento**: Ao ter o cupão associado diretamente ao perfil do cliente, o sistema está preparado para atribuições automáticas baseadas em regras de negócio.
    - *Exemplo:* É possível configurar o sistema para que, sempre que um cliente atinja um volume de compras superior a **100€**, um cupão de "Cliente Frequente" seja injetado automaticamente na sua carteira.
- **Segurança de Dados**: Através de **Discriminadores de Schema**, garantimos que estes benefícios de fidelização (campo `cupoes` e `supermercadoFavorito`) existam apenas em perfis do tipo `clientes`, mantendo a base de dados limpa e livre de campos irrelevantes para administradores ou estafetas.

---

### Regras de Negócio e POS
- **Confirmação do Cliente**: Em entregas ao domicílio, a encomenda só passa a `entregue` quando o cliente confirma no Frontoffice que recebeu o pedido. Isto liberta o pagamento e finaliza o processo.
- **Venda em Caixa (POS)**: Qualquer venda registada no Backoffice entra no estado **`confirmada`**.
    - Se for **Levantamento**, a loja prepara e marca como `entregue` quando o cliente aparecer.
    - Se for **Entrega**, entra no fluxo de estafeta e aguarda confirmação final do cliente.
- **Faturação**: As faturas são geradas automaticamente na transição para `confirmada`.

---

## Emails e Notificações
O sistema utiliza **Nodemailer** com fallback automático para **Ethereal Email** em ambiente de desenvolvimento. Os links de visualização de emails (Recuperação de Password, Boas-vindas, Novos Cupões) são impressos no terminal do servidor.
