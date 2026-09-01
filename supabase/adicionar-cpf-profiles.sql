-- Acesso apenas com CPF + senha (e-mail opcional, preenchido depois no perfil).
-- Rode este script no SQL Editor do seu Supabase.

alter table public.profiles
  add column if not exists cpf text,
  add column if not exists data_nascimento date,
  add column if not exists email text;

create unique index if not exists profiles_cpf_unico on public.profiles (cpf) where cpf is not null;

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
