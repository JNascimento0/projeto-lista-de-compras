-- ============================================================
-- RLS nas tabelas base: leitura para logados, escrita só admin
-- ============================================================

-- 1. Função auxiliar: o usuário atual é admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;


-- 2. Policies (antes de ligar o RLS)

drop policy if exists "Acesso publico total estabelecimentos"
on public.estabelecimentos_base;

-- marcas_base
create policy "logados_leem_marcas"
on public.marcas_base for select to authenticated
using (true);

create policy "admin_escreve_marcas"
on public.marcas_base for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- produtos_base
create policy "logados_leem_produtos"
on public.produtos_base for select to authenticated
using (true);

create policy "admin_escreve_produtos"
on public.produtos_base for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- estabelecimentos_base
create policy "logados_leem_estabelecimentos"
on public.estabelecimentos_base for select to authenticated
using (true);

create policy "admin_escreve_estabelecimentos"
on public.estabelecimentos_base for all to authenticated
using (public.is_admin())
with check (public.is_admin());


-- 3. Liga o RLS nas duas tabelas que estavam sem
alter table public.marcas_base enable row level security;
alter table public.produtos_base enable row level security;


-- 4. Permissões diretas: tira o que ninguém precisa
revoke all on table
  public.marcas_base,
  public.produtos_base,
  public.estabelecimentos_base
from anon;

revoke truncate, references, trigger on table
  public.marcas_base,
  public.produtos_base,
  public.estabelecimentos_base
from authenticated;