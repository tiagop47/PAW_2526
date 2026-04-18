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


---
