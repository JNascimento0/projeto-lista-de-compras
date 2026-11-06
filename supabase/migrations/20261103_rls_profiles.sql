-- ============================================================
-- profiles: cada usuário vê e edita só o próprio perfil
-- ============================================================

drop policy if exists "Permitir leitura de perfis" on public.profiles;
drop policy if exists "Permitir inserção de perfil no cadastro" on public.profiles;

drop policy if exists "Usuários podem ver seu próprio perfil" on public.profiles;

create policy "Usuários podem ver seu próprio perfil"
on public.profiles for select to authenticated
using (auth.uid() = id);

revoke all on table public.profiles from anon;

revoke insert, delete, truncate, references, trigger
on table public.profiles
from authenticated;

alter function public.handle_new_user()
set search_path = pg_catalog, public;