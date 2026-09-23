# Banco de Dados

Este documento descreve a estrutura principal do banco de dados da aplicação Lista de Compras.

O projeto utiliza Supabase como banco de dados, autenticação e camada de segurança.

---

## 1. Visão geral

As principais tabelas da aplicação são:

- `profiles`
- `compras`
- `itens_compra`
- `produtos_base`
- `marcas_base`
- `estabelecimentos_base`
- `sugestoes_cadastro`

Além das tabelas, o projeto utiliza:

- Supabase Auth
- Row Level Security (RLS)
- função RPC para salvar compras e seus itens em uma única operação
- migrations para registrar alterações importantes no banco

---

## 2. profiles

Armazena informações adicionais dos usuários autenticados.

Principais campos:

- `id`
- `nome`
- `email`
- `avatar_url`
- `role`
- `created_at`

O campo `id` corresponde ao identificador do usuário autenticado.

O campo `role` define o nível de acesso do usuário.

Valores utilizados atualmente:

- `user`
- `admin`

O valor padrão é:

`user`

---

## 3. compras

Armazena as compras realizadas pelos usuários.

Principais campos:

- `id`
- `data_compra`
- `valor_total`
- `criado_em`
- `user_id`
- `id_estabelecimento`
- `nome_estabelecimento`

### Relacionamentos

`id_estabelecimento` referencia:

`estabelecimentos_base.id`

O campo `user_id` identifica o usuário responsável pela compra.

---

## 4. itens_compra

Armazena os itens pertencentes a cada compra.

Principais campos:

- `id`
- `id_compra`
- `id_produto`
- `codigo_barra`
- `descricao_produto`
- `categoria`
- `quantidade`
- `preco_unitario`
- `preco_total`
- `marca_produto`

### Relacionamentos

`id_compra` referencia:

`compras.id`

`id_produto` referencia:

`produtos_base.id`

A relação com `produtos_base` utiliza:

`ON DELETE SET NULL`

Isso permite que o histórico da compra continue existindo mesmo caso o produto seja removido da base principal.

---

## 5. produtos_base

Armazena os produtos cadastrados na base principal.

Principais campos:

- `id`
- `nome`
- `categoria`
- `codigo_barra`

O campo `codigo_barra` possui restrição de unicidade.

Isso impede que dois produtos diferentes sejam cadastrados com o mesmo código de barras.

---

## 6. marcas_base

Armazena as marcas disponíveis para cadastro e associação aos produtos.

Principais campos:

- `id`
- `nome`

---

## 7. estabelecimentos_base

Armazena os estabelecimentos utilizados nas compras.

Principais campos:

- `id`
- `nome`
- `created_at`

As compras podem manter tanto o identificador do estabelecimento quanto o nome utilizado no momento do registro.

---

## 8. sugestoes_cadastro

Armazena sugestões de produtos que ainda não existem na base principal.

Principais campos:

- `id`
- `codigo_barra`
- `user_id`
- `criado_em`
- `status`

O campo `user_id` utiliza por padrão o usuário autenticado.

O status inicial é:

`pendente`

---

## 9. Salvamento de compras

O registro de uma compra utiliza a função:

`salvar_compra_com_itens`

Essa função recebe os dados da compra e a lista de itens e realiza os registros no banco.

O objetivo é garantir que a compra e seus itens sejam tratados como uma única operação.

A função também associa a compra ao usuário autenticado através de:

`auth.uid()`

---

## 10. Segurança e RLS

As tabelas `compras` e `itens_compra` utilizam Row Level Security.

### compras

Usuários autenticados podem consultar apenas registros cujo:

`user_id = auth.uid()`

### itens_compra

O acesso aos itens depende da compra à qual o item pertence.

O usuário só pode consultar itens de compras pertencentes a ele.

---

## 11. Sugestões e permissões

A tabela `sugestoes_cadastro` utiliza RLS.

Usuários comuns podem:

- criar sugestões em seu próprio nome;
- visualizar suas próprias sugestões.

Administradores podem:

- visualizar todas as sugestões;
- atualizar sugestões.

---

## 12. Segurança da RPC

A função `salvar_compra_com_itens` utiliza:

`SECURITY DEFINER`

O `search_path` é definido explicitamente para reduzir riscos relacionados à resolução de objetos do banco.

A execução é permitida para usuários autenticados.

Usuários anônimos não possuem permissão de execução.

---

## 13. Migrations

As alterações importantes no banco devem ser registradas em:

```text
supabase/migrations/
