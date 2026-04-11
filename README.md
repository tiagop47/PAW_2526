# PAW Marketplace de Supermercados Locais

Projeto desenvolvido para a Unidade Curricular de Programação em Ambiente Web (PAW).

## Utilizadores de Teste

Pode utilizar as seguintes credenciais para testar as diferentes áreas da plataforma:
mesmo que o professor não consiga acesso à base dados o administrador é criado por default, as credenciais mantêm-se;

| Perfil | Email | Password |
| :--- | :--- | :--- |
| **Administrador** | `admin@gmail.com` | `Admin12345` |
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

o ficheiro .env é usado como garantia de segurança já o ficheiro config.js utiliza estas variáveis para 
que possamos de forma segura utilizar estes valores.
## 📧 Sistema de Envio de Emails (Recuperação de Password)

O projeto utiliza uma arquitetura robusta para o envio de emails, combinando a biblioteca **Nodemailer** com o serviço profissional **Mailgun**.

### Arquitetura
1.  **Nodemailer**: Atua como o cliente SMTP dentro da aplicação Node.js, facilitando a construção e o envio de mensagens HTML formatadas.
2.  **Mailgun**: Utilizado como o servidor de saída (MTA) para garantir uma alta taxa de entrega e segurança no envio de credenciais.

### Configuração para Testes (Ambiente de Desenvolvimento)
Devido às restrições de segurança do plano **Mailgun Sandbox** (domínio de teste), o envio de emails reais está limitado apenas a destinatários autorizados.

#### Como o Professor pode testar:

**Opção A: Verificação via Terminal (Recomendado)**
Se não pretender configurar uma conta Mailgun própria, o sistema possui um mecanismo de *fallback* automático:
1. Deixe as variáveis `EMAIL_USER` e `EMAIL_PASS` vazias no ficheiro `.env`.
2. Ao solicitar a recuperação de password, o sistema usará o **Ethereal Email**.
3. O link para visualizar o email gerado será impresso diretamente no **terminal do servidor**.

**Opção B: Envio Real via Mailgun**
Caso deseje receber o email numa caixa de entrada real:
1. As credenciais do grupo já estão configuradas no `.env`.
2. Por restrição do Mailgun Sandbox, o destinatário deve estar na lista de **Authorized Recipients**.
3. Utilize o email de teste `8240128@estg.ipp.pt` na página de recuperação para ver o fluxo completo (o email será enviado para a caixa institucional do aluno).

### Segurança e Boas Práticas
*   **Tokens Temporários**: Os links de recuperação utilizam tokens criptográficos de uso único que expiram após 1 hora.
*   **Hashing**: Todas as passwords redefinidas passam pelo processo de *hashing* (Bcrypt) através de um *hook* de pré-gravação no modelo do Mongoose.
*   **Fallback Seguro**: Se o serviço de email falhar, o sistema captura o erro e informa o utilizador, garantindo que a aplicação não bloqueia.

---
