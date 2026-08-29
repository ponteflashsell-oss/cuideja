-- ============================================================
-- CuideJá — Estrutura completa do banco de dados (Supabase/Postgres)
-- Execute este script inteiro no SQL Editor de um projeto Supabase novo.
-- Ordem: extensões -> tipos -> funções -> tabelas -> grants -> RLS
--        -> policies -> índices -> triggers -> storage
-- ============================================================

-- 1. EXTENSÕES ------------------------------------------------
create extension if not exists pgcrypto;

-- 2. TIPOS ----------------------------------------------------
do $$ begin
  create type public.app_role as enum ('admin', 'moderator', 'user');
exception when duplicate_object then null; end $$;

-- 3. FUNÇÕES BASE ---------------------------------------------
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 4. TABELAS --------------------------------------------------

-- 4.1 profiles (famílias e cuidadoras)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  cidade text not null default '',
  bairros text[] not null default '{}',
  bio text not null default '',
  especialidades text[] not null default '{}',
  tarifa_hora numeric not null default 0,
  tarifa_diaria numeric not null default 0,
  tarifa_plantao12 numeric not null default 0,
  tarifa_plantao24 numeric not null default 0,
  verificado boolean not null default false,
  tipo text not null default 'cuidadora' check (tipo in ('cuidadora', 'familia')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.2 user_roles (papéis — NUNCA guardar papel no profile)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- 4.3 verificacoes (KYC: selfie + documento, fila de conferência manual)
create table if not exists public.verificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'em_analise',
  nome_documento text not null default '',
  cpf text not null default '',
  data_nascimento text not null default '',
  tipo_documento text not null default '',
  cpf_valido boolean not null default false,
  face_confere boolean not null default false,
  score integer not null default 0,
  observacoes text not null default '',
  antecedentes_status text not null default 'nao_consultado',
  antecedentes_dados jsonb,
  selfie_path text not null default '',
  documento_path text not null default '',
  revisao_manual boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.4 documentos (arquivos enviados: PDF/foto do documento oficial)
create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null default 'documento_oficial',
  nome_arquivo text not null default '',
  caminho text not null,
  mime text not null default '',
  tamanho bigint not null default 0,
  origem text not null default 'upload',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.5 conversas + mensagens (chat por par família/cuidadora)
create table if not exists public.conversas (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references auth.users(id) on delete cascade,
  cuidadora_id uuid not null references auth.users(id) on delete cascade,
  assunto text not null default '',
  status text not null default 'aberta' check (status in ('aberta', 'encerrada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (familia_id, cuidadora_id)
);

create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.conversas(id) on delete cascade,
  remetente_id uuid not null references auth.users(id) on delete cascade,
  mensagem text not null check (char_length(trim(mensagem)) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- 4.6 mensagens_conversa (chat rápido legado, sem tabela de conversa)
create table if not exists public.mensagens_conversa (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references auth.users(id) on delete cascade,
  cuidadora_id uuid not null references auth.users(id) on delete cascade,
  remetente_id uuid not null references auth.users(id) on delete cascade,
  mensagem text not null check (char_length(trim(mensagem)) between 1 and 500),
  created_at timestamptz not null default now(),
  check (remetente_id = familia_id or remetente_id = cuidadora_id)
);

-- 4.7 propostas (negociação de plantão)
create table if not exists public.propostas (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references auth.users(id) on delete cascade,
  cuidadora_id uuid not null references auth.users(id) on delete cascade,
  data_servico date not null,
  hora_inicio time not null,
  hora_fim time not null,
  valor_proposto numeric not null check (valor_proposto > 0),
  observacao text not null default '' check (char_length(trim(observacao)) <= 140),
  status text not null default 'pendente_cuidadora'
    check (status in ('pendente_cuidadora','contraproposta','pendente_familia','aceita','recusada','expirada')),
  expira_em timestamptz not null default (now() + interval '12 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.8 contratos (termo família x cuidadora com dados reais e aceites)
create table if not exists public.contratos (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references auth.users(id) on delete cascade,
  cuidadora_id uuid not null references auth.users(id) on delete cascade,
  criado_por uuid not null,
  reserva_id text not null unique
    default ('RES-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  familia_nome text not null default '',
  familia_cpf text not null default '',
  familia_cidade text not null default '',
  familia_bairro text not null default '',
  familia_telefone text not null default '',
  familia_verificada boolean not null default false,
  cuidadora_nome text not null default '',
  cuidadora_cpf text not null default '',
  cuidadora_cidade text not null default '',
  cuidadora_telefone text not null default '',
  cuidadora_verificada boolean not null default false,
  assistido_nome text not null default '',
  descricao_cuidado text not null default '',
  endereco text not null default '',
  regime text not null default 'plantao12',
  data_inicio date not null,
  data_fim date,
  hora_inicio text not null default '',
  hora_fim text not null default '',
  valor numeric not null default 0,
  taxa_percentual numeric not null default 10,
  observacoes text not null default '',
  termo_texto text not null default '',
  status text not null default 'aguardando',
  familia_aceite_em timestamptz,
  familia_aceite_nome text not null default '',
  cuidadora_aceite_em timestamptz,
  cuidadora_aceite_nome text not null default '',
  recusado_por uuid,
  motivo_recusa text not null default '',
  pagamento_status text not null default 'pendente',
  pagamento_id text,
  pago_em timestamptz,
  checkout_url text,
  emitido_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.9 alertas_plantao (avisos da cuidadora durante o plantão)
create table if not exists public.alertas_plantao (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  criado_por uuid not null references auth.users(id) on delete cascade,
  mensagem text not null check (char_length(mensagem) between 1 and 500),
  created_at timestamptz not null default now(),
  lido_em timestamptz
);

-- 4.10 admin_auditoria (log imutável de acessos administrativos)
create table if not exists public.admin_auditoria (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  user_id uuid,
  acao text not null,
  caminho text not null default '',
  detalhe text not null default '',
  created_at timestamptz not null default now()
);

-- 5. GRANTS (obrigatório: o Data API não concede privilégios por padrão)
grant select, insert, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert, update on public.verificacoes to authenticated;
grant select, insert on public.documentos to authenticated;
grant select, insert, update on public.conversas to authenticated;
grant select, insert on public.mensagens to authenticated;
grant select, insert on public.mensagens_conversa to authenticated;
grant select, insert, update on public.propostas to authenticated;
grant select, insert, update on public.contratos to authenticated;
grant select, insert, update on public.alertas_plantao to authenticated;
grant select on public.admin_auditoria to authenticated;

grant all on public.profiles, public.user_roles, public.verificacoes,
  public.documentos, public.conversas, public.mensagens,
  public.mensagens_conversa, public.propostas, public.contratos,
  public.alertas_plantao, public.admin_auditoria to service_role;

-- 6. RLS ------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.verificacoes enable row level security;
alter table public.documentos enable row level security;
alter table public.conversas enable row level security;
alter table public.mensagens enable row level security;
alter table public.mensagens_conversa enable row level security;
alter table public.propostas enable row level security;
alter table public.contratos enable row level security;
alter table public.alertas_plantao enable row level security;
alter table public.admin_auditoria enable row level security;

-- 7. FUNÇÃO DE PAPÉIS (security definer, evita recursão de RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- 8. POLICIES -------------------------------------------------

-- profiles
create policy "Cuidadoras podem ver o proprio perfil" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "Cuidadoras podem criar o proprio perfil" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "Cuidadoras podem editar o proprio perfil" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admins veem todos os perfis" on public.profiles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins editam todos os perfis" on public.profiles
  for update to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- user_roles (somente leitura pelo dono ou admin; escrita só service_role)
create policy "Usuarios veem os proprios papeis" on public.user_roles
  for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- verificacoes
create policy "Cuidadoras veem as proprias verificacoes" on public.verificacoes
  for select to authenticated using (auth.uid() = user_id);
create policy "Cuidadoras criam as proprias verificacoes" on public.verificacoes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Admins veem todas as verificacoes" on public.verificacoes
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins atualizam verificacoes" on public.verificacoes
  for update to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- documentos
create policy "Usuarios veem os proprios documentos" on public.documentos
  for select to authenticated using (auth.uid() = user_id);
create policy "Usuarios enviam os proprios documentos" on public.documentos
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Admins veem todos os documentos" on public.documentos
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- conversas
create policy "Participantes veem suas conversas" on public.conversas
  for select to authenticated using (auth.uid() = familia_id or auth.uid() = cuidadora_id);
create policy "Familias iniciam conversas" on public.conversas
  for insert to authenticated with check (auth.uid() = familia_id);
create policy "Participantes atualizam suas conversas" on public.conversas
  for update to authenticated using (auth.uid() = familia_id or auth.uid() = cuidadora_id)
  with check (auth.uid() = familia_id or auth.uid() = cuidadora_id);

-- mensagens
create policy "Participantes veem mensagens" on public.mensagens
  for select to authenticated using (exists (
    select 1 from public.conversas c
    where c.id = mensagens.conversa_id
      and (c.familia_id = auth.uid() or c.cuidadora_id = auth.uid())));
create policy "Participantes enviam mensagens" on public.mensagens
  for insert to authenticated with check (remetente_id = auth.uid() and exists (
    select 1 from public.conversas c
    where c.id = mensagens.conversa_id
      and (c.familia_id = auth.uid() or c.cuidadora_id = auth.uid())));

-- mensagens_conversa
create policy "Participantes veem mensagens da conversa" on public.mensagens_conversa
  for select to authenticated using (auth.uid() = familia_id or auth.uid() = cuidadora_id);
create policy "Participantes enviam mensagens da conversa" on public.mensagens_conversa
  for insert to authenticated
  with check (remetente_id = auth.uid() and (auth.uid() = familia_id or auth.uid() = cuidadora_id));

-- propostas
create policy "Familia ve suas propostas" on public.propostas
  for select to authenticated using (auth.uid() = familia_id);
create policy "Cuidadora ve propostas recebidas" on public.propostas
  for select to authenticated using (auth.uid() = cuidadora_id);
create policy "Familia cria proposta" on public.propostas
  for insert to authenticated with check (auth.uid() = familia_id);
create policy "Participantes atualizam proposta" on public.propostas
  for update to authenticated using (auth.uid() = familia_id or auth.uid() = cuidadora_id)
  with check (auth.uid() = familia_id or auth.uid() = cuidadora_id);

-- contratos
create policy "Partes veem os proprios contratos" on public.contratos
  for select to authenticated using (auth.uid() = familia_id or auth.uid() = cuidadora_id);
create policy "Partes criam contratos" on public.contratos
  for insert to authenticated
  with check (auth.uid() = criado_por and (auth.uid() = familia_id or auth.uid() = cuidadora_id));
create policy "Partes atualizam os proprios contratos" on public.contratos
  for update to authenticated using (auth.uid() = familia_id or auth.uid() = cuidadora_id)
  with check (auth.uid() = familia_id or auth.uid() = cuidadora_id);
create policy "Admins veem todos os contratos" on public.contratos
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- alertas_plantao
create policy "Participantes veem alertas do plantao" on public.alertas_plantao
  for select to authenticated using (exists (
    select 1 from public.contratos c
    where c.id = alertas_plantao.contrato_id
      and (c.familia_id = auth.uid() or c.cuidadora_id = auth.uid())));
create policy "Cuidadora cria alertas do plantao" on public.alertas_plantao
  for insert to authenticated with check (criado_por = auth.uid() and exists (
    select 1 from public.contratos c
    where c.id = alertas_plantao.contrato_id
      and c.cuidadora_id = auth.uid() and c.status = 'ativo'));
create policy "Familia marca alerta como lido" on public.alertas_plantao
  for update to authenticated using (exists (
    select 1 from public.contratos c
    where c.id = alertas_plantao.contrato_id and c.familia_id = auth.uid()))
  with check (lido_em is not null);

-- admin_auditoria (log imutável: só leitura por admin; escrita via service_role)
create policy "Admins veem a auditoria" on public.admin_auditoria
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- 9. ÍNDICES --------------------------------------------------
create index if not exists documentos_user_id_idx on public.documentos (user_id);
create index if not exists verificacoes_user_id_idx on public.verificacoes (user_id, created_at desc);
create index if not exists mensagens_conversa_created_idx on public.mensagens (conversa_id, created_at);
create index if not exists mensagens_conversa_participantes_idx
  on public.mensagens_conversa (familia_id, cuidadora_id, created_at);
create index if not exists propostas_familia_idx on public.propostas (familia_id, created_at desc);
create index if not exists propostas_cuidadora_idx on public.propostas (cuidadora_id, status, created_at desc);
create index if not exists contratos_familia_idx on public.contratos (familia_id, created_at desc);
create index if not exists contratos_cuidadora_idx on public.contratos (cuidadora_id, created_at desc);
create index if not exists alertas_plantao_contrato_created_idx
  on public.alertas_plantao (contrato_id, created_at desc);
create index if not exists admin_auditoria_created_at_idx on public.admin_auditoria (created_at desc);

-- 10. TRIGGERS DE updated_at ----------------------------------
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();
create trigger update_verificacoes_updated_at before update on public.verificacoes
  for each row execute function public.update_updated_at_column();
create trigger update_documentos_updated_at before update on public.documentos
  for each row execute function public.update_updated_at_column();
create trigger update_conversas_updated_at before update on public.conversas
  for each row execute function public.update_updated_at_column();
create trigger trigger_propostas_updated_at before update on public.propostas
  for each row execute function public.update_updated_at_column();
create trigger update_contratos_updated_at before update on public.contratos
  for each row execute function public.update_updated_at_column();

-- 11. CRIAÇÃO AUTOMÁTICA DE PERFIL AO CADASTRAR ---------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, cidade, tipo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'cidade', ''),
    case when new.raw_user_meta_data ->> 'tipo' = 'familia' then 'familia' else 'cuidadora' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 12. STORAGE -------------------------------------------------
-- Bucket privado com selfies e documentos das verificações.
insert into storage.buckets (id, name, public)
values ('verificacoes', 'verificacoes', false)
on conflict (id) do nothing;

create policy "Usuario envia arquivos da propria verificacao" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'verificacoes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Usuario le arquivos da propria verificacao" on storage.objects
  for select to authenticated
  using (bucket_id = 'verificacoes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Admin le arquivos de verificacao" on storage.objects
  for select to authenticated
  using (bucket_id = 'verificacoes' and public.has_role(auth.uid(), 'admin'));

-- 13. ADMIN INICIAL -------------------------------------------
-- Rode DEPOIS de criar a conta pelo app (substitua o e-mail se necessário):
-- insert into public.user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'ponteflashsell@gmail.com'
-- on conflict (user_id, role) do nothing;

-- FIM ---------------------------------------------------------
