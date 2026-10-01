-- Execute no SQL Editor do projeto Supabase antes de habilitar cobranças em produção.
-- Mesmo com RLS permissiva, usuários autenticados não podem marcar pagamento como confirmado.
create or replace function public.proteger_confirmacao_pagamento()
returns trigger language plpgsql as $$
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    if tg_table_name = 'contratos' and (
      new.status = 'ativo' and old.status is distinct from 'ativo'
      or new.pagamento_status = 'confirmado' and old.pagamento_status is distinct from 'confirmado'
      or new.pagamento_id is distinct from old.pagamento_id
      or new.pago_em is distinct from old.pago_em
    ) then
      raise exception 'Confirmação de pagamento exclusiva do servidor';
    end if;
    if tg_table_name = 'propostas' and new.status = 'aceita' and old.status is distinct from 'aceita' then
      raise exception 'Aceite final exclusivo do servidor após conferência do pagamento';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_pagamento_contrato on public.contratos;
create trigger proteger_pagamento_contrato before update on public.contratos
for each row execute function public.proteger_confirmacao_pagamento();

drop trigger if exists proteger_pagamento_proposta on public.propostas;
create trigger proteger_pagamento_proposta before update on public.propostas
for each row execute function public.proteger_confirmacao_pagamento();

-- Caso exista CHECK enumerando estados da proposta, incluir 'aguardando_pagamento'.
-- Não reclassificar contratos antigos como pagos sem comprovante da operadora.