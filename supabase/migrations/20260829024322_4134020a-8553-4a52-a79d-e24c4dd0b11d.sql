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

CREATE TABLE public.alertas_plantao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  criado_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mensagem text NOT NULL CHECK (char_length(mensagem) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  lido_em timestamptz
);

GRANT SELECT, INSERT, UPDATE ON public.alertas_plantao TO authenticated;
GRANT ALL ON public.alertas_plantao TO service_role;

CREATE INDEX alertas_plantao_contrato_created_idx
  ON public.alertas_plantao (contrato_id, created_at DESC);

ALTER TABLE public.alertas_plantao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participantes veem alertas do plantao"
ON public.alertas_plantao FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contratos c
    WHERE c.id = contrato_id
      AND (c.familia_id = auth.uid() OR c.cuidadora_id = auth.uid())
  )
);

CREATE POLICY "Cuidadora cria alertas do plantao"
ON public.alertas_plantao FOR INSERT TO authenticated
WITH CHECK (
  criado_por = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.contratos c
    WHERE c.id = contrato_id
      AND c.cuidadora_id = auth.uid()
      AND c.status = 'ativo'
  )
);

CREATE POLICY "Familia marca alerta como lido"
ON public.alertas_plantao FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contratos c
    WHERE c.id = contrato_id AND c.familia_id = auth.uid()
  )
)
WITH CHECK (lido_em IS NOT NULL);

CREATE TABLE public.mensagens_conversa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cuidadora_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remetente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mensagem text NOT NULL CHECK (char_length(trim(mensagem)) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mensagens_conversa_participantes_check CHECK (remetente_id = familia_id OR remetente_id = cuidadora_id)
);

GRANT SELECT, INSERT ON public.mensagens_conversa TO authenticated;
GRANT ALL ON public.mensagens_conversa TO service_role;

CREATE INDEX mensagens_conversa_participantes_idx
  ON public.mensagens_conversa (familia_id, cuidadora_id, created_at);

ALTER TABLE public.mensagens_conversa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participantes veem mensagens da conversa"
ON public.mensagens_conversa FOR SELECT TO authenticated
USING (auth.uid() = familia_id OR auth.uid() = cuidadora_id);

CREATE POLICY "Participantes enviam mensagens da conversa"
ON public.mensagens_conversa FOR INSERT TO authenticated
WITH CHECK (
  remetente_id = auth.uid()
  AND (auth.uid() = familia_id OR auth.uid() = cuidadora_id)
);

CREATE TABLE public.conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cuidadora_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assunto text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'encerrada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (familia_id, cuidadora_id)
);

GRANT SELECT, INSERT, UPDATE ON public.conversas TO authenticated;
GRANT ALL ON public.conversas TO service_role;

CREATE TABLE public.mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
  remetente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mensagem text NOT NULL CHECK (char_length(trim(mensagem)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.mensagens TO authenticated;
GRANT ALL ON public.mensagens TO service_role;

CREATE INDEX mensagens_conversa_created_idx ON public.mensagens (conversa_id, created_at);
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participantes veem suas conversas" ON public.conversas FOR SELECT TO authenticated
USING (auth.uid() = familia_id OR auth.uid() = cuidadora_id);
CREATE POLICY "Familias iniciam conversas" ON public.conversas FOR INSERT TO authenticated
WITH CHECK (auth.uid() = familia_id);
CREATE POLICY "Participantes atualizam suas conversas" ON public.conversas FOR UPDATE TO authenticated
USING (auth.uid() = familia_id OR auth.uid() = cuidadora_id)
WITH CHECK (auth.uid() = familia_id OR auth.uid() = cuidadora_id);

CREATE POLICY "Participantes veem mensagens" ON public.mensagens FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.conversas c WHERE c.id = conversa_id AND (c.familia_id = auth.uid() OR c.cuidadora_id = auth.uid())));
CREATE POLICY "Participantes enviam mensagens" ON public.mensagens FOR INSERT TO authenticated
WITH CHECK (remetente_id = auth.uid() AND EXISTS (SELECT 1 FROM public.conversas c WHERE c.id = conversa_id AND (c.familia_id = auth.uid() OR c.cuidadora_id = auth.uid())));

CREATE TRIGGER update_conversas_updated_at
BEFORE UPDATE ON public.conversas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.propostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cuidadora_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_servico date NOT NULL,
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,
  valor_proposto numeric(10,2) NOT NULL CHECK (valor_proposto > 0),
  observacao text NOT NULL DEFAULT '' CHECK (char_length(trim(observacao)) <= 140),
  status text NOT NULL DEFAULT 'pendente_cuidadora' CHECK (
    status IN ('pendente_cuidadora', 'contraproposta', 'pendente_familia', 'aceita', 'recusada', 'expirada')
  ),
  expira_em timestamptz NOT NULL DEFAULT (now() + interval '12 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.propostas TO authenticated;
GRANT ALL ON public.propostas TO service_role;

CREATE INDEX propostas_familia_idx
  ON public.propostas (familia_id, created_at DESC);

CREATE INDEX propostas_cuidadora_idx
  ON public.propostas (cuidadora_id, status, created_at DESC);

ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Familia ve suas propostas"
ON public.propostas FOR SELECT TO authenticated
USING (auth.uid() = familia_id);

CREATE POLICY "Cuidadora ve propostas recebidas"
ON public.propostas FOR SELECT TO authenticated
USING (auth.uid() = cuidadora_id);

CREATE POLICY "Familia cria proposta"
ON public.propostas FOR INSERT TO authenticated
WITH CHECK (auth.uid() = familia_id);

CREATE POLICY "Participantes atualizam proposta"
ON public.propostas FOR UPDATE TO authenticated
USING (auth.uid() = familia_id OR auth.uid() = cuidadora_id)
WITH CHECK (auth.uid() = familia_id OR auth.uid() = cuidadora_id);

CREATE TRIGGER trigger_propostas_updated_at
BEFORE UPDATE ON public.propostas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'ponteflashsell@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;