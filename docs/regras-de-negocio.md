# Regras de Negócio

Este documento registra as principais regras de funcionamento da aplicação Lista de Compras.

A intenção é manter as regras de negócio separadas dos detalhes de implementação, facilitando a manutenção e evolução do projeto.

---

## 1. Usuários

A aplicação possui dois tipos principais de usuário:

- `user`
- `admin`

Usuários comuns podem utilizar as funcionalidades relacionadas às próprias compras.

Administradores possuem permissões adicionais para manutenção dos dados base da aplicação.

---

## 2. Cadastro de produtos

Usuários comuns não podem cadastrar produtos diretamente na base principal.

O cadastro de produtos é responsabilidade de usuários com perfil de administrador.

Quando um produto não é encontrado durante uma compra, o usuário pode enviar uma sugestão de cadastro.

---

## 3. Código de barras

Os produtos podem possuir um código de barras utilizado para identificação durante uma compra.

O código de barras deve ser tratado sem espaços em branco.

Na tabela `produtos_base`, o código de barras é único.

O código de barras também é armazenado nos itens da compra para preservar a informação utilizada no momento da compra.

---

## 4. Produto não encontrado

Quando um código de barras não corresponde a um produto existente:

1. o sistema informa que o produto não foi encontrado;
2. o usuário pode sugerir o cadastro do produto;
3. a sugestão fica registrada com o usuário responsável;
4. administradores podem visualizar e tratar essas sugestões.

A sugestão não cria automaticamente um produto na base principal.

---

## 5. Registro de compras

Uma compra deve possuir:

- data da compra;
- estabelecimento;
- pelo menos um item;
- valor total.

Cada compra pertence ao usuário autenticado que realizou o registro.

---

## 6. Itens da compra

Cada item pode armazenar informações como:

- produto;
- código de barras;
- descrição do produto;
- marca;
- categoria;
- quantidade;
- preço unitário;
- preço total.

O item pode possuir referência ao produto da base através de `id_produto`.

Caso o produto da base seja removido futuramente, o histórico da compra não deve ser perdido.

---

## 7. Quantidades

Quantidades inteiras são apresentadas como unidades.

Exemplo:

`2 Un`

Quantidades fracionadas são apresentadas como peso.

Exemplo:

`0,750 Kg`

---

## 8. Valores monetários

Valores devem ser apresentados no padrão brasileiro.

Exemplos:

`R$ 2,99`

`R$ 1.234,56`

---

## 9. Histórico

O histórico exibe apenas compras pertencentes ao usuário autenticado.

As compras são agrupadas por estabelecimento.

Dentro de cada estabelecimento, as compras são apresentadas por data.

Cada compra permite consultar os itens registrados e seu valor total.

---

## 10. Segurança

As regras de segurança não devem depender apenas da interface React.

O banco de dados utiliza políticas RLS para controlar o acesso aos dados.

Usuários autenticados só podem consultar suas próprias compras e os respectivos itens.

Operações administrativas devem ser protegidas também no banco de dados.

---

## 11. Sugestões de cadastro

Cada sugestão possui um status.

O status inicial é:

`pendente`

Usuários comuns podem consultar suas próprias sugestões.

Administradores podem consultar e atualizar as sugestões cadastradas.
