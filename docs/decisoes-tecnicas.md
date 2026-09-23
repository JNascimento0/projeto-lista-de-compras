# Decisões Técnicas

Este documento registra decisões técnicas importantes tomadas durante o desenvolvimento da aplicação Lista de Compras.

A intenção é preservar o contexto das escolhas feitas ao longo do projeto e facilitar futuras manutenções e evoluções.

---

## 1. React + Vite

A interface foi construída com React e Vite.

### Motivos

- desenvolvimento rápido;
- boa experiência com hot reload;
- estrutura simples para projetos frontend;
- facilidade de integração com Supabase;
- familiaridade com JavaScript e React.

---

## 2. Supabase

O Supabase foi escolhido para fornecer:

- autenticação;
- banco de dados PostgreSQL;
- armazenamento;
- políticas de segurança com RLS;
- funções RPC.

### Motivos

A escolha permite concentrar autenticação, dados e segurança em uma única plataforma, reduzindo a necessidade de criar um backend completo neste estágio do projeto.

---

## 3. Segurança no banco de dados

A segurança não deve depender apenas da interface React.

Mesmo que determinados botões ou páginas sejam ocultados no frontend, o acesso aos dados deve ser validado pelo banco através de RLS e permissões.

Essa decisão evita que um usuário contorne restrições manipulando diretamente requisições feitas pelo frontend.

---

## 4. Perfis e roles

A aplicação utiliza a tabela `profiles` para armazenar informações adicionais dos usuários.

O campo `role` diferencia usuários comuns e administradores.

Valores utilizados:

- `user`
- `admin`

A role controla funcionalidades administrativas, como manutenção da base de produtos.

---

## 5. Cadastro de produtos

Usuários comuns não cadastram produtos diretamente em `produtos_base`.

Quando um código de barras não é encontrado, o usuário pode criar uma sugestão de cadastro.

### Motivos

Essa decisão evita:

- produtos duplicados;
- nomes inconsistentes;
- marcas cadastradas incorretamente;
- categorias despadronizadas.

A base principal permanece sob controle administrativo.

---

## 6. Busca por código de barras

A lógica de busca por código de barras foi mantida separada da futura implementação do scanner.

A função de busca recebe o código como argumento e não depende da câmera.

### Motivos

Isso permite que a mesma lógica seja utilizada por:

- entrada manual;
- leitura por câmera;
- futuras fontes de código de barras.

O scanner deve apenas obter o código e enviá-lo para a lógica de busca existente.

---

## 7. Scanner adiado

A integração com leitura de código de barras por câmera foi adiada enquanto outras partes da aplicação são estabilizadas.

### Ordem planejada

1. melhorar e estabilizar as telas;
2. preparar completamente o fluxo de código de barras;
3. configurar Capacitor;
4. integrar o plugin nativo de scanner.

### Motivo

Evitar adicionar uma nova camada de complexidade antes de estabilizar a lógica principal da aplicação.

---

## 8. Capacitor para versão mobile

A versão mobile será baseada na aplicação web existente utilizando Capacitor.

### Motivos

- reaproveitamento da aplicação React atual;
- manutenção da versão web;
- possibilidade de acesso a recursos nativos;
- menor necessidade de reescrever a interface.

O Android será priorizado inicialmente.

O suporte a iOS poderá ser tratado posteriormente.

---

## 9. Salvamento de compra via RPC

O salvamento da compra e de seus itens foi centralizado na função:

`salvar_compra_com_itens`

### Motivos

Antes dessa decisão, compra e itens poderiam depender de várias operações independentes.

A RPC permite tratar o processo como uma única operação no banco.

Isso reduz o risco de situações como:

- compra criada sem itens;
- apenas parte dos itens sendo registrada;
- inconsistências em caso de falha durante o salvamento.

---

## 10. Histórico independente da base atual de produtos

Os itens da compra armazenam informações próprias, como:

- descrição;
- marca;
- código de barras;
- categoria;
- preços.

Além disso, existe uma referência opcional para `produtos_base`.

A relação utiliza:

`ON DELETE SET NULL`

### Motivo

O histórico representa o que aconteceu no momento da compra.

Alterações ou exclusões posteriores na base de produtos não devem apagar os dados históricos.

---

## 11. Migrations do Supabase

Mudanças importantes no banco devem ser registradas em:

`supabase/migrations/`

### Motivos

- manter banco e código versionados juntos;
- documentar alterações estruturais;
- facilitar reconstrução futura do banco;
- evitar depender apenas do estado atual do painel do Supabase.

A primeira migration foi criada para registrar as mudanças realizadas na versão `1.5.0`.

---

## 12. Segredos e frontend

Chaves públicas destinadas ao frontend podem existir no cliente quando protegidas pelas regras adequadas do Supabase.

Credenciais secretas de serviços externos não devem permanecer expostas no código frontend.

### Direção futura

APIs que exigem credenciais privadas deverão ser movidas para uma camada segura, como backend ou Supabase Edge Functions.

---

## 13. Padronização visual

As telas devem seguir uma identidade visual comum.

Paleta principal:

- `#126337` — destaques, ícones e valores importantes;
- `#195537` — botões e elementos preenchidos;
- `#123f2a` — hover;
- `#eef6ef` — fundos verdes claros;
- `#d2e4d5` / `#d5e7d8` — bordas suaves.

Ícones devem seguir, sempre que possível, o mesmo padrão:

- SVG outline;
- traços simples;
- cantos arredondados;
- uso de `currentColor`.

---

## 14. Responsividade

As telas devem ser verificadas tanto em desktop quanto em dispositivos móveis.

Quando uma tabela não funciona bem no celular, a preferência é adaptar a apresentação para um formato mais adequado, em vez de depender apenas de rolagem horizontal.

Exemplo atual:

A tabela de itens do Histórico é apresentada como tabela no desktop e como cards no mobile.

---

## 15. Versionamento

O projeto utiliza versionamento semântico:

`MAJOR.MINOR.PATCH`

### Interpretação

- `PATCH` — correções e melhorias pequenas sem mudança significativa de funcionalidade;
- `MINOR` — novas funcionalidades compatíveis com a versão atual;
- `MAJOR` — mudanças incompatíveis ou grandes alterações estruturais.

A versão deve ser atualizada quando um conjunto relevante de alterações estiver concluído, e não a cada pequena modificação.
