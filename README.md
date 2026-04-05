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