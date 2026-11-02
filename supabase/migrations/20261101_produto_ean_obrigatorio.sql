-- ============================================================
-- Código de barras (EAN) obrigatório em produtos_base
-- ============================================================

alter table public.produtos_base
alter column codigo_barra set not null;

alter table public.produtos_base
drop constraint if exists produtos_base_codigo_barra_formato;

alter table public.produtos_base
add constraint produtos_base_codigo_barra_formato
check (codigo_barra ~ '^[0-9]{8,14}$');