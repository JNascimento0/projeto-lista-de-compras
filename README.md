# Lista de Compras

Aplicação para registrar compras, organizar produtos, comparar preços e acompanhar o histórico de compras realizadas.

## Sobre o projeto

O projeto foi criado com o objetivo de facilitar o controle de compras do dia a dia, permitindo registrar estabelecimentos, produtos, valores e consultar informações posteriormente.

Além da versão web, o projeto está sendo preparado para futuramente funcionar também como aplicativo mobile.

## Funcionalidades atuais

- Autenticação de usuários
- Controle de perfil de usuário e administrador
- Registro de compras
- Busca de produtos por código de barras
- Sugestão de cadastro de produtos não encontrados
- Histórico de compras
- Comparação de preços
- Relatórios
- Cadastro de produtos, marcas e estabelecimentos por administradores
- Controle de acesso com Supabase RLS

## Tecnologias utilizadas

- React
- Vite
- JavaScript
- Supabase
- Recharts

## Estrutura do projeto

```text
src/
├─ pages/
├─ services/
├─ styles/
└─ ...

supabase/
└─ migrations/