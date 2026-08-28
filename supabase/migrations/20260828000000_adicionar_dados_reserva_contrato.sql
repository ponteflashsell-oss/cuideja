ALTER TABLE public.contratos
  ADD COLUMN reserva_id text NOT NULL DEFAULT ('RES-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  ADD COLUMN emitido_em timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN familia_telefone text NOT NULL DEFAULT '',
  ADD COLUMN cuidadora_telefone text NOT NULL DEFAULT '',
  ADD COLUMN assistido_nome text NOT NULL DEFAULT '',
  ADD COLUMN pagamento_status text NOT NULL DEFAULT 'pendente',
  ADD COLUMN pagamento_id text,
  ADD COLUMN pago_em timestamptz,
  ADD COLUMN checkout_url text;

CREATE UNIQUE INDEX contratos_reserva_id_key ON public.contratos (reserva_id);
