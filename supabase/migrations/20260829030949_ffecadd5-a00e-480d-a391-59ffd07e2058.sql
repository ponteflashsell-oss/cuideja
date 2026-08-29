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

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

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

create table if not exists public.mensagens_conversa (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references auth.users(id) on delete cascade,
  cuidadora_id uuid not null references auth.users(id) on delete cascade,
  remetente_id uuid not null references auth.users(id) on delete cascade,
  mensagem text not null check (char_length(trim(mensagem)) between 1 and 500),
  created_at timestamptz not null default now(),
  check (remetente_id = familia_id or remetente_id = cuidadora_id)
);

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

create table if not exists public.alertas_plantao (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  criado_por uuid not null references auth.users(id) on delete cascade,
  mensagem text not null check (char_length(mensagem) between 1 and 500),
  created_at timestamptz not null default now(),
  lido_em timestamptz
);

create table if not exists public.admin_auditoria (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  user_id uuid,
  acao text not null,
  caminho text not null default '',
  detalhe text not null default '',
  created_at timestamptz not null default now()
);

-- 5. GRANTS ---------------------------------------------------
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

-- 7. FUNÇÃO DE PAPÉIS -----------------------------------------
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