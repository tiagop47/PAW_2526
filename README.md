# PAW Marketplace de Supermercados Locais

Projeto desenvolvido para a Unidade Curricular de Programação em Ambiente Web (PAW).

## Utilizadores de Teste

Pode utilizar as seguintes credenciais para testar as diferentes áreas da plataforma:

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
2. Configurar o ficheiro `.env` com a variável `MONGODB_URI`
3. Iniciar o servidor: `npm run dev`
