# Changelog

Este arquivo registra as principais mudanças realizadas em cada versão da aplicação Lista de Compras.

O projeto utiliza versionamento semântico no formato:

`MAJOR.MINOR.PATCH`

---

## [Não lançado]

Alterações em desenvolvimento que ainda não fazem parte de uma versão publicada.

---

## [1.5.2]

### Melhorado

- Reformulada a interface da tela Histórico.
- Padronizada a tela com a identidade visual verde da aplicação.
- Substituídos emojis por ícones SVG.
- Melhorado o comportamento dos accordions de estabelecimentos e compras.
- Adicionados chevrons animados com estado individual.
- Melhorada a exibição de nomes longos de estabelecimentos.
- Valores monetários passaram a utilizar formatação brasileira.
- Adicionado destaque visual para o total da compra.
- Melhorado o layout dos itens no mobile.
- A tabela de itens passou a ser exibida como cards em telas pequenas.
- Adicionados estados visuais de carregamento, erro e histórico vazio.
- Adicionada opção de tentar novamente em caso de falha no carregamento.
- Melhorada a acessibilidade dos accordions com `aria-expanded`.

### Corrigido

- Corrigido o comportamento em que todos os chevrons de estabelecimentos giravam ao abrir apenas um.
- Corrigidos problemas de quebra e distribuição de conteúdo em telas pequenas.

---

## [1.5.1]

### Melhorado

- Melhorado o layout dos itens do carrinho em dispositivos móveis.
- A descrição do produto passou a utilizar melhor o espaço disponível.
- Quantidade, preço e botão de remoção foram reorganizados no mobile.

---

## [1.5.0]

### Adicionado

- Fluxo de busca de produtos por código de barras.
- Possibilidade de sugerir cadastro quando um produto não é encontrado.
- Registro das sugestões associado ao usuário autenticado.
- Armazenamento de `id_produto` e `codigo_barra` nos itens da compra.
- Migration inicial do Supabase para registrar mudanças importantes do banco.

### Melhorado

- Validações da tela de compras.
- Mensagens contextuais de sucesso e erro.
- Fluxo de cadastro e identificação de produtos por EAN.
- Estrutura de salvamento de compras.

### Segurança

- Ativado RLS para `compras` e `itens_compra`.
- Usuários autenticados passaram a consultar apenas suas próprias compras.
- Itens são acessíveis apenas através de compras pertencentes ao usuário.
- Salvamento da compra e de seus itens centralizado na RPC `salvar_compra_com_itens`.
- RPC protegida para execução apenas por usuários autenticados.
- Definido `search_path` explícito na função RPC.
- Removido acesso direto desnecessário de usuários anônimos.

### Banco de dados

- Removido o campo antigo `codigo_produto` de `itens_compra`.
- Adicionado `id_produto`.
- Adicionado `codigo_barra`.
- Criada relação entre `itens_compra.id_produto` e `produtos_base.id`.
- Configurado `ON DELETE SET NULL` para preservar o histórico.
- Normalizados códigos de barras existentes.