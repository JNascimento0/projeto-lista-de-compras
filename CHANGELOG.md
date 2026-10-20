# Changelog

Este arquivo registra as principais mudanças realizadas em cada versão da aplicação Lista de Compras.

O projeto utiliza versionamento semântico no formato:

`MAJOR.MINOR.PATCH`

---

## [Não lançado]

Alterações em desenvolvimento que ainda não fazem parte de uma versão publicada.

### Adicionado

- Edge Function `buscar-produto-ean`, que consulta o Cosmos e o OpenFoodFacts.
- Busca de produto por EAN no Cadastros usando a Edge Function.
- Criada a tela de Relatórios com métricas financeiras e gráficos.
- Adicionados filtros por período: este mês, mês passado, últimos 3 meses e este ano.
- Adicionado gráfico de gastos por categoria.
- Adicionado gráfico de gastos por estabelecimento.
- Adicionado gráfico de evolução mensal dos gastos.
- Adicionados estados visuais de carregamento, ausência de dados e erro.

### Melhorado

- Mensagens de erro e de sucesso da tela Cadastros exibidas na própria tela, no lugar de `alert()`.
- A tela passou a exibir a mensagem devolvida pela função quando a busca falha.
- Adicionada contagem de itens comprados considerando quantidades inteiras e quantidades decimais.
- Melhorado o tratamento de erros no carregamento dos dados dos relatórios.
- Adicionada opção de tentar novamente após falha no carregamento.
- Padronizada a interface de Relatórios com a identidade visual da aplicação.
- Melhorada a responsividade dos gráficos e cards em diferentes tamanhos de tela.
- Substituídos os `alert()` da tela Cadastros por mensagens na tela, seguindo o padrão da tela de Compra.
- Mensagens de sucesso e erro da tela Cadastros passaram a ser exibidas na própria seção (marca, estabelecimento e produto).
- Validação dos campos da tela Cadastros com erro exibido abaixo do campo, removido ao digitar.
- Cadastro de produto passou a validar nome e categoria separadamente, exibindo os dois erros ao mesmo tempo.
- Erros de nome ou código de barras duplicado passaram a aparecer junto ao campo correspondente.
- Melhorada a acessibilidade dos formulários de Cadastros com `label` associado ao campo (`htmlFor`).

### Segurança

- A consulta ao Cosmos saiu do frontend; o token fica em secret do Supabase.

### Corrigido

- Corrigida a contagem de quantidades decimais na métrica de itens comprados.
- Corrigida a busca por EAN em Cadastros, que não dava retorno ao clicar com o campo vazio.
- Corrigido o botão "Pesquisar EAN", que podia ficar preso em "Buscando..." após um erro inesperado.


## [1.5.3] - 2026-09-27

### Adicionado

- Navegação por teclado no autocomplete do Comparador de Preços com ↑, ↓, Enter e Esc.
- Estados visuais para carregamento, erro, pesquisa inicial e pesquisa sem resultados.
- Atalhos para os produtos mais comprados.
- Exibição de menor e maior preço no histórico de comparação.

### Alterado

- Reformulada a interface do Comparador de Preços seguindo o padrão visual do aplicativo.
- Melhorada a responsividade do Comparador para dispositivos móveis.
- Melhorado o autocomplete de produtos com debounce e fechamento consistente após pesquisas.
- Centralizados ícones SVG reutilizáveis em `src/components/icons`.

### Corrigido

- Corrigido o reaparecimento do autocomplete após selecionar uma sugestão ou produto frequente.
- Corrigida a formatação de quantidades decimais no histórico de preços.
- Corrigida a duplicação de `R$` na tela Histórico.

---

## [1.5.2] - 2026-09-22

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

## [1.5.1] - 2026-09-19

### Melhorado

- Melhorado o layout dos itens do carrinho em dispositivos móveis.
- A descrição do produto passou a utilizar melhor o espaço disponível.
- Quantidade, preço e botão de remoção foram reorganizados no mobile.

---

## [1.5.0] - 2026-09-18

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