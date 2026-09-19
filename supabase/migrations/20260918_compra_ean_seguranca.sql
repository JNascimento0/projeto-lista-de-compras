-- ============================================================
-- v1.5.0 - Fluxo de compra, EAN, integridade e segurança
-- ============================================================


-- ------------------------------------------------------------
-- 1. Estrutura de itens_compra
-- ------------------------------------------------------------

alter table public.itens_compra
drop column if exists codigo_produto;

alter table public.itens_compra
add column if not exists id_produto bigint;

alter table public.itens_compra
add column if not exists codigo_barra text;


-- ------------------------------------------------------------
-- 2. Relacionamento com produtos_base
-- ------------------------------------------------------------

alter table public.itens_compra
drop constraint if exists itens_compra_id_produto_fkey;

alter table public.itens_compra
add constraint itens_compra_id_produto_fkey
foreign key (id_produto)
references public.produtos_base(id)
on delete set null;


-- ------------------------------------------------------------
-- 3. Normalização dos códigos de barras
-- ------------------------------------------------------------

update public.produtos_base
set codigo_barra = regexp_replace(codigo_barra, '\s', '', 'g')
where codigo_barra is not null
  and codigo_barra <> regexp_replace(codigo_barra, '\s', '', 'g');


-- ------------------------------------------------------------
-- 4. RPC para salvar compra + itens em uma única transação
-- ------------------------------------------------------------

drop function if exists public.salvar_compra_com_itens(
  date,
  bigint,
  text,
  numeric,
  jsonb
);

create function public.salvar_compra_com_itens(
  p_data_compra date,
  p_id_estabelecimento bigint,
  p_nome_estabelecimento text,
  p_valor_total numeric,
  p_itens jsonb
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, auth, public
as $$
declare
  v_id_compra bigint;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  insert into public.compras (
    user_id,
    data_compra,
    id_estabelecimento,
    nome_estabelecimento,
    valor_total
  )
  values (
    auth.uid(),
    p_data_compra,
    p_id_estabelecimento,
    p_nome_estabelecimento,
    p_valor_total
  )
  returning id into v_id_compra;

  insert into public.itens_compra (
    id_compra,
    id_produto,
    codigo_barra,
    descricao_produto,
    marca_produto,
    categoria,
    quantidade,
    preco_unitario,
    preco_total
  )
  select
    v_id_compra,
    item.id_produto,
    item.codigo_barra,
    item.descricao_produto,
    item.marca_produto,
    item.categoria,
    item.quantidade,
    item.preco_unitario,
    item.preco_total
  from jsonb_to_recordset(p_itens) as item (
    id_produto bigint,
    codigo_barra text,
    descricao_produto text,
    marca_produto text,
    categoria text,
    quantidade numeric,
    preco_unitario numeric,
    preco_total numeric
  );

  return v_id_compra;
end;
$$;


-- ------------------------------------------------------------
-- 5. Permissão de execução da RPC
-- ------------------------------------------------------------

revoke execute on function public.salvar_compra_com_itens(
  date,
  bigint,
  text,
  numeric,
  jsonb
) from public;

revoke execute on function public.salvar_compra_com_itens(
  date,
  bigint,
  text,
  numeric,
  jsonb
) from anon;

grant execute on function public.salvar_compra_com_itens(
  date,
  bigint,
  text,
  numeric,
  jsonb
) to authenticated;


-- ------------------------------------------------------------
-- 6. Row Level Security
-- ------------------------------------------------------------

alter table public.compras
enable row level security;

alter table public.itens_compra
enable row level security;


-- ------------------------------------------------------------
-- 7. Policies de leitura
-- ------------------------------------------------------------

drop policy if exists "usuarios_leem_suas_compras"
on public.compras;

create policy "usuarios_leem_suas_compras"
on public.compras
for select
to authenticated
using (
  user_id = auth.uid()
);


drop policy if exists "usuarios_leem_itens_das_suas_compras"
on public.itens_compra;

create policy "usuarios_leem_itens_das_suas_compras"
on public.itens_compra
for select
to authenticated
using (
  exists (
    select 1
    from public.compras c
    where c.id = itens_compra.id_compra
      and c.user_id = auth.uid()
  )
);


-- ------------------------------------------------------------
-- 8. Permissões diretas das tabelas
-- ------------------------------------------------------------

revoke all privileges
on table public.compras, public.itens_compra
from anon;

revoke insert, update, delete, truncate, references, trigger
on table public.compras, public.itens_compra
from authenticated;

grant select
on table public.compras, public.itens_compra
to authenticated;